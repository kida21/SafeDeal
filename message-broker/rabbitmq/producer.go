package rabbitmq

import (
    "log"
    "time"

    "github.com/streadway/amqp"
    "message_broker/rabbitmq/events"
)

type Producer struct {
    Channel *amqp.Channel
}

func NewProducer() *Producer {
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

    if err != nil {
        log.Fatalf("Could not connect to RabbitMQ: %v", err)
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

    return &Producer{Channel: channel}
}

func (p *Producer) Publish(event events.Event, routingKey string) error {
    body, err := event.ToJSON()
    if err != nil {
        return err
    }

    return p.Channel.Publish(
        "safe_deal_exchange",
        routingKey,
        false,
        false,
        amqp.Publishing{
            ContentType: "application/json",
            Body:        body,
        },
    )
}