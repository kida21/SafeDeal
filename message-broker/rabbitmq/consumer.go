package rabbitmq

import (
	"encoding/json"
	"log"
	"time"

    "message_broker/rabbitmq/events"
	"github.com/streadway/amqp"
)

type Consumer struct {
    Channel *amqp.Channel
}

func NewConsumer() *Consumer {
    var conn *amqp.Connection
    var err error

    for i := 0; i < 10; i++ {
        conn, err = amqp.Dial("amqp://guest:guest@rabbitmq:5672/")
        if err == nil {
            break
        }
        log.Printf("Failed to connect to RabbitMQ: %v. Retrying...", err)
        time.Sleep(5 * time.Second)
    }

    channel, err := conn.Channel()
    if err != nil {
        log.Fatalf("Could not open a channel: %v", err)
    }

    if err := channel.ExchangeDeclare(
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

    return &Consumer{Channel: channel}
}

func (c *Consumer) Listen(queueName, routingKey string, handler func(events.Event)) {
   
    queue, err := c.Channel.QueueDeclare(
        queueName,
        true,
        false,
        false,
        false,
        nil,
    )
    if err != nil {
        log.Fatalf("Failed to declare queue: %v", err)
    }

    // Bind queue to exchange
    if err := c.Channel.QueueBind(
        queue.Name,
        routingKey,
        "safe_deal_exchange",
        false,
        nil,
    ); err != nil {
        log.Fatalf("Failed to bind queue: %v", err)
    }

    // Consume messages
    msgs, err := c.Channel.Consume(
        queue.Name,
        "",
        true,
        false,
        false,
        false,
        nil,
    )
    if err!=nil{
        log.Printf("error:%s",err)
    }
    go func() {
        for msg := range msgs {
            var baseEvent events.BaseEvent
            if err := json.Unmarshal(msg.Body, &baseEvent); err != nil {
                log.Printf("Failed to parse event type: %v", err)
                continue
            }

            var event events.Event
            switch baseEvent.Type {
            case "payment.success":
                var e events.PaymentSuccessEvent
                json.Unmarshal(msg.Body, &e)
                event = &e
            case "escrow.funded":
                var e events.EscrowFundedEvent
                json.Unmarshal(msg.Body, &e)
                event = &e
            default:
                log.Printf("Unknown event type: %s", baseEvent.Type)
                continue
            }

            handler(event)
        }
    }()
}