package rabbitmq

import (
	"message_broker/rabbitmq/events"
	"time"

	"github.com/streadway/amqp"
)

type Producer struct {
    Channel *amqp.Channel
}

func NewProducer() *Producer {
    conn, err := amqp.Dial("amqp://guest:guest@rabbitmq:5672/")
    if err != nil {
        panic("Failed to connect to RabbitMQ")
    }

    ch, err := conn.Channel()
    if err != nil {
        panic("Failed to open a channel")
    }

    // Declare exchange
    err = ch.ExchangeDeclare(
        "safe_deal_exchange",
        "topic",
        true,
        false,
        false,
        false,
        nil,
    )
    if err != nil {
        panic("Failed to declare exchange")
    }

    return &Producer{Channel: ch}
}

func (p *Producer) PublishCreateEscrow(id uint64, buyerID, sellerID uint32, amount float64, buyerAddr, sellerAddr string) error {
	event := events.CreateEscrowEvent{
		BaseEvent: events.BaseEvent{
			Type:      "escrow.create",
			Timestamp: time.Now().Unix(),
		},
		ID:        id,
		BuyerID:   buyerID,
		SellerID:  sellerID,
		Amount:    amount,
		BuyerAddr: buyerAddr,
		SellerAddr: sellerAddr,
	}

	body, err := event.ToJSON()
	if err != nil {
		return err
	}

	return p.Channel.Publish(
		"safe_deal_exchange",
		"escrow.create",
		false,
		false,
		amqp.Publishing{
			ContentType: "application/json",
			Body:        body,
		},
	)
}