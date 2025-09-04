package rabbitmq

import (
	blockchain "blockchain_adapter"
	"context"
	"encoding/json"
	"escrow_service/internal/model"
	"log"
	"math/big"
	"message_broker/rabbitmq/events"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/streadway/amqp"
	"gorm.io/gorm"
)

type Consumer struct {
    Channel *amqp.Channel
    DB      *gorm.DB
	blockchainClient *blockchain.Client
}




func NewConsumer(db *gorm.DB,client *blockchain.Client) *Consumer {
    var conn *amqp.Connection
    var err error

    conn, err = amqp.Dial("amqp://guest:guest@rabbitmq:5672/")
        if err != nil {
            log.Printf("❌ RabbitMQ connection failed: %v.", err)
        }
        ch, err := conn.Channel()
    if err != nil {
        log.Fatalf("❌ Failed to open channel: %v", err)
    }

    err = ch.ExchangeDeclare("safe_deal_exchange", "topic", true, false, false, false, nil)
    if err != nil {
        log.Fatalf("❌ Failed to declare exchange: %v", err)
    }
    log.Println("✅ Connected to RabbitMQ")
    return &Consumer{Channel: ch, DB: db,blockchainClient: client}
}


func (c *Consumer) Listen() {
    queue, err := c.Channel.QueueDeclare(
        "escrow_queue",
        true,
        false,
        false,
        false,
        nil,
    )
    if err != nil {
        log.Fatalf("Failed to declare queue: %v", err)
    }

    
    err = c.Channel.QueueBind(
        queue.Name,
        "payment.success",
        "safe_deal_exchange",
        false,
        nil,
    )
    if err != nil {
        log.Fatalf("Failed to bind queue: %v", err)
    }

    msgs, err := c.Channel.Consume(
        queue.Name,
        "",
        true,
        false,
        false,
        false,
        nil,
    )
    if err != nil {
    log.Fatalf("Failed to consume: %v", err)
    }
    go func() {
        for msg := range msgs {
            var baseEvent events.BaseEvent
            json.Unmarshal(msg.Body, &baseEvent)

            if baseEvent.Type == "payment.success" {
                var event events.PaymentSuccessEvent
                json.Unmarshal(msg.Body, &event)

                
                var escrow model.Escrow
				//log.Printf("event escrowId:%d",event.EscrowID) //will be commented out
                if err := c.DB.First(&escrow, event.EscrowID).Error; err != nil {
                    log.Printf("Escrow not found: %d", event.EscrowID)
                    continue
                }

                escrow.Status = model.Funded
                c.DB.Save(&escrow)

                log.Printf("✅ Escrow %d updated to Funded", escrow.ID)
            }
        }
    }()
}

func (c *Consumer) ListenForTransferEvents() {
	queue, err := c.Channel.QueueDeclare(
		"escrow_transfer_queue",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatalf("Failed to declare transfer queue: %v", err)
	}

	err = c.Channel.QueueBind(
		queue.Name,
		"transfer.success",
		"safe_deal_exchange",
		false,
		nil,
	)
	if err != nil {
		log.Fatalf("Failed to bind transfer queue: %v", err)
	}

	msgs, err := c.Channel.Consume(
		queue.Name,
		"",
		true,
		false,
		false,
		false,
		nil,
	)
    if err != nil {
    log.Fatalf("Failed to consume: %v", err)
    }
	go func() {
		for msg := range msgs {
			var baseEvent events.BaseEvent
			json.Unmarshal(msg.Body, &baseEvent)

			if baseEvent.Type == "transfer.success" {
				var event events.TransferSuccessEvent
				json.Unmarshal(msg.Body, &event)

				
				var escrow model.Escrow
				if err := c.DB.Where("id = ?", event.EscrowID).First(&escrow).Error; err != nil {
					log.Printf("Escrow not found: %d", event.EscrowID)
					continue
				}

				
				escrow.Status = model.Released
				c.DB.Save(&escrow)
				log.Printf("Escrow updated to Released in DB")

				
				if c.blockchainClient == nil {
					log.Println("blockchainClient not initialized")
					continue
				}

				tx, err := c.blockchainClient.Contract.FinalizeEscrow(
					c.blockchainClient.Auth,
					new(big.Int).SetUint64(event.BlockchainEscrowID),
				)
				if err != nil {
					log.Printf("Failed to finalize escrow on-chain")
					continue
				}

				
				receipt, err := bind.WaitMined(context.Background(), c.blockchainClient.Client, tx)
				if err != nil {
					log.Printf("Transaction mining failed: %v", err)
					continue
				}

				
				for _, vLog := range receipt.Logs {
					e, err := c.blockchainClient.Contract.ParseEscrowFinalized(*vLog)
					if err == nil && e != nil {
						log.Printf("On-chain status updated")
						break
					}
				}
			}
		}
	}()
}

func (c *Consumer) StartEscrowWorker() {
	queue, err := c.Channel.QueueDeclare(
		"escrow_worker_queue",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatalf("Failed to declare escrow_worker_queue: %v", err)
	}

	err = c.Channel.QueueBind(
		queue.Name,
		"escrow.create",
		"safe_deal_exchange",
		false,
		nil,
	)
	if err != nil {
		log.Fatalf("Failed to bind escrow.create: %v", err)
	}

	msgs, err := c.Channel.Consume(
		queue.Name,
		"",
		true,
		false,
		false,
		false,
		nil,
	) 
	if err != nil {
    log.Fatalf("Failed to consume: %v", err)
    }

	go func() {
		for msg := range msgs {
			var event events.CreateEscrowEvent
			if err := json.Unmarshal(msg.Body, &event); err != nil {
				log.Printf("Failed to unmarshal CreateEscrowEvent: %v", err)
				continue
			}

			if c. blockchainClient == nil {
				log.Println("Blockchain client not initialized")
				continue
			}

			buyerAddr := common.HexToAddress(event.BuyerAddr)
			sellerAddr := common.HexToAddress(event.SellerAddr)
			amount := new(big.Int).SetUint64(uint64(event.Amount * 100))

			
			tx, err := c.blockchainClient.Contract.CreateEscrow(
				c.blockchainClient.Auth,
				buyerAddr,
				sellerAddr,
				amount,
			)
			if err != nil {
				log.Printf("Failed to create on-chain escrow: %v", err)
				continue
			}

			
			receipt, err := bind.WaitMined(context.Background(), c.blockchainClient.Client, tx)
			if err != nil {
				log.Printf("Mining failed: %v", err)
				continue
			}

			
			var escrowID *big.Int
			for _, vLog := range receipt.Logs {
				e, err := c.blockchainClient.Contract.ParseEscrowCreated(*vLog)
				if err == nil && e != nil {
					escrowID = e.Id
					break
				}
			}

			if escrowID == nil {
				log.Printf("Failed to get escrow ID from logs")
				continue
			}

			
			var escrow model.Escrow
			if err := c.DB.First(&escrow, "id = ?", event.ID).Error; err != nil {
				log.Printf("Escrow not found: %d", event.ID)
				continue
			}
            txHash := tx.Hash().Hex()
			id := escrowID.Uint64()
			escrow.BlockchainEscrowID = &id
			escrow.BlockchainTxHash = &txHash
			escrow.Status = model.Pending
			c.DB.Save(&escrow)

			log.Printf("✅ Escrow created on-chain")
		}
	}()
}