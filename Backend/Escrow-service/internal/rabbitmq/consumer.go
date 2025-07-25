package rabbitmq

import (
	"encoding/json"
	"escrow_service/internal/model"
	"log"
	"message_broker/rabbitmq/events"
	"github.com/streadway/amqp"
	"gorm.io/gorm"
)

type Consumer struct {
    Channel *amqp.Channel
    DB      *gorm.DB
}

func NewConsumer(db *gorm.DB) *Consumer {
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
    return &Consumer{Channel: ch, DB: db}
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

    go func() {
        for msg := range msgs {
            var baseEvent events.BaseEvent
            json.Unmarshal(msg.Body, &baseEvent)

            if baseEvent.Type == "payment.success" {
                var event events.PaymentSuccessEvent
                json.Unmarshal(msg.Body, &event)

                
                var escrow model.Escrow
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