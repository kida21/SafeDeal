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

func (p *Producer) PublishPaymentSuccess(txRef string, escrowID, userID uint32, amount float64) error {
    event := events.NewPaymentSuccessEvent(txRef, escrowID, userID, amount)
    body, err := event.ToJSON()
    if err != nil {
        return err
    }

    return p.Channel.Publish(
        "safe_deal_exchange",
        "payment.success",
        false,
        false,
        amqp.Publishing{
            ContentType: "application/json",
            Body:        body,
        },
    )
}
func (p *Producer) PublishTransferSuccess(transferID string, escrowID uint64) error {
	event := events.TransferSuccessEvent{
		BaseEvent: events.BaseEvent{
			Type:      "transfer.success",
			Timestamp: time.Now().Unix(),
		},
		TransferID: transferID,
		EscrowID:   escrowID,
	}

	body, err := event.ToJSON()
	if err != nil {
		return err
	}

	return p.Channel.Publish(
		"safe_deal_exchange",
		"transfer.success",
		false,
		false,
		amqp.Publishing{
			ContentType: "application/json",
			Body:        body,
		},
	)
}