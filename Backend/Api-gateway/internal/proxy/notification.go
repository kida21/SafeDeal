package proxy

import (
	"log"
	"net/http"
	"net/url"

	gws "github.com/gorilla/websocket"
	"github.com/gofiber/contrib/websocket"
	"api_gateway/internal/consul"
)


func NotificationProxy(serviceName string) func(*websocket.Conn) {
	return func(c *websocket.Conn) {
		
		log.Println("NotificationProxy: handler started")

		// Get user_id from Locals (set by route)
		userID, ok := c.Locals("user_id").(string)
		if !ok || userID == "" {
			log.Println("NotificationProxy: missing user_id in Locals")
			return
		}

		// Resolve backend via Consul
		addr, err := consul.GetServiceEndpoint(serviceName)
		if err != nil {
			log.Printf("NotificationProxy: service unreachable: %v", err)
			return
		}
		log.Printf("NotificationProxy: resolved backend: %s", addr)

		// Build backend URL
		backendURL := url.URL{
			Scheme: "ws",
			Host:   addr,
			Path:   "/ws/notifications",
		}

		// Forward user_id as X-User-ID
		headers := http.Header{}
		headers.Set("X-User-ID", userID)

		log.Printf("NotificationProxy: dialing backend %s", backendURL.String())

		// Connect to notification-service
		backendConn, _, err := gws.DefaultDialer.Dial(backendURL.String(), headers)
		if err != nil {
			log.Printf("NotificationProxy: failed to connect to backend: %v", err)
			return
		}
		defer backendConn.Close()
		log.Println("NotificationProxy: backend connected")

		// Bidirectional copy
		errCh := make(chan error, 2)

		// Client → Backend
		go func() {
			for {
				mt, msg, err := c.ReadMessage()
				if err != nil {
					errCh <- err
					return
				}
				if err := backendConn.WriteMessage(mt, msg); err != nil {
					errCh <- err
					return
				}
			}
		}()

		// Backend → Client
		go func() {
			for {
				mt, msg, err := backendConn.ReadMessage()
				if err != nil {
					errCh <- err
					return
				}
				if err := c.WriteMessage(mt, msg); err != nil {
					errCh <- err
					return
				}
			}
		}()

		// Wait for close
		err = <-errCh
		log.Printf("NotificationProxy: connection closed: %v", err)
	}
}