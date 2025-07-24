package events

type Event interface {
    GetType() string
	ToJSON() ([]byte, error)
}

type BaseEvent struct {
    Type      string `json:"type"`
    Timestamp int64  `json:"timestamp"`
}

func (e *BaseEvent) GetType() string {
    return e.Type
}