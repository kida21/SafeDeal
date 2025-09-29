package consumer

import (
	"encoding/json"
	"log"

	amqp "github.com/streadway/amqp"
	"gorm.io/gorm"
	"message_broker/rabbitmq/events"
	
)

type Consumer struct {
	Channel *amqp.Channel
	DB      *gorm.DB
}

func NewConsumer(db *gorm.DB) *Consumer {
	var conn *amqp.Connection
	var err error

	for i := 0; i < 10; i++ {
		conn, err = amqp.Dial("amqp://guest:guest@rabbitmq:5672/")
		if err == nil {
			break
		}
		log.Printf("Failed to connect to RabbitMQ: %v. Retrying...", err)
	}

	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("Failed to open channel: %v", err)
	}

	if err := ch.ExchangeDeclare(
		"safe_deal_exchange",
		"topic",
		true,
		false,
		false,
		false,
		nil,
	); err != nil {
		log.Fatalf("Failed to declare exchange: %v", err)
	}

	return &Consumer{Channel: ch, DB: db}
}

func (c *Consumer) Listen() {
	queue, err := c.Channel.QueueDeclare(
		"notification_queue",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatalf("Failed to declare queue: %v", err)
	}

	routingKeys := []string{
		"escrow.create",
		"payment.success",
		"escrow.accepted",
		"escrow.disputed",
		"transfer.success",
	}

	for _, key := range routingKeys {
		if err := c.Channel.QueueBind(
			queue.Name,
			key,
			"safe_deal_exchange",
			false,
			nil,
		); err != nil {
			log.Fatalf("Failed to bind %s: %v", key, err)
		}
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
			if err := json.Unmarshal(msg.Body, &baseEvent); err != nil {
				log.Printf("Failed to unmarshal base event: %v", err)
				continue
			}

			switch baseEvent.Type {
			case "escrow.create":
				c.handleEscrowCreated(msg.Body)
			case "payment.success":
				c.handleEscrowFunded(msg.Body)
			case "escrow.accepted":
				c.handleEscrowAccepted(msg.Body)
			case "escrow.disputed":
				c.handleEscrowDisputed(msg.Body)
			case "transfer.success":
				c.handleTransferSuccess(msg.Body)
			}
		}
	}()
}