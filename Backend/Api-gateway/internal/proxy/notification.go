package proxy

import (
	"log"
	"net/http"
	"net/url"
	"strings"

	gws "github.com/gorilla/websocket"
	"github.com/gofiber/contrib/websocket"
	"api_gateway/internal/consul"
)

func NotificationProxy(serviceName string) func(*websocket.Conn) {
	return func(c *websocket.Conn) {
		log.Println("NotificationProxy: handler started")

		userID, ok := c.Locals("user_id").(string)
		if !ok || userID == "" {
			log.Println("NotificationProxy: missing user_id in Locals")
			c.WriteMessage(gws.TextMessage, []byte(`{"type":"session_expired","message":"Missing user ID"}`))
			c.Close()
			return
		}

		addr, err := consul.GetServiceEndpoint(serviceName)
		if err != nil {
			log.Printf("NotificationProxy: service unreachable: %v", err)
			c.WriteMessage(gws.TextMessage, []byte(`{"type":"session_expired","message":"Service unavailable"}`))
			c.Close()
			return
		}
		log.Printf("NotificationProxy: resolved backend: %s", addr)

		backendURL := url.URL{
			Scheme: "ws",
			Host:   addr,
			Path:   "/ws/notifications",
		}

		headers := http.Header{}
		headers.Set("X-User-ID", userID)

		backendConn, _, err := gws.DefaultDialer.Dial(backendURL.String(), headers)
		if err != nil {
			log.Printf("NotificationProxy: failed to connect to backend: %v", err)
			c.WriteMessage(gws.TextMessage, []byte(`{"type":"session_expired","message":"Cannot connect to backend"}`))
			c.Close()
			return
		}
		defer backendConn.Close()
		log.Println("NotificationProxy: backend connected")

		errCh := make(chan error, 2)

		// Client → Backend
		go func() {
			for {
				mt, msg, err := c.ReadMessage()
				if err != nil {
					errCh <- err
					return
				}

				if strings.Contains(string(msg), "token is expired") {
					log.Println("NotificationProxy: token expired from client side, closing connection")
					c.WriteMessage(mt, []byte(`{"type":"session_expired","message":"Session expired"}`))
					c.Close()
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

				if strings.Contains(string(msg), "token is expired") {
					log.Println("NotificationProxy: token expired reported by backend, closing connection")
					c.WriteMessage(mt, []byte(`{"type":"session_expired","message":"Session expired"}`))
					c.Close()
					errCh <- err
					return
				}

				if err := c.WriteMessage(mt, msg); err != nil {
					errCh <- err
					return
				}
			}
		}()

		err = <-errCh
		log.Printf("NotificationProxy: connection closed: %v", err)
		c.Close()
	}
}
