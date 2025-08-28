package proxy

import (
	"log"
	"net/http"
	"net/url"

	gws "github.com/gorilla/websocket"
	"github.com/gofiber/contrib/websocket"
	"api_gateway/internal/consul"
)

// WebSocketProxy returns a Fiber WebSocket handler that proxies connections to chat-service
func WebSocketProxy(serviceName string) func(*websocket.Conn) {
	return func(clientConn *websocket.Conn) {
		defer clientConn.Close()

		log.Println("WebSocketProxy: handler started")

		// Extract user_id and session_id from Fiber locals (set by AuthMiddleware)
		userID, ok1 := clientConn.Locals("user_id").(string)
		sessionID, ok2 := clientConn.Locals("session_id").(string)
		if !ok1 || !ok2 || userID == "" || sessionID == "" {
			log.Println("WebSocketProxy: missing user/session ID in locals")
			return
		}
		

		// Resolve backend service endpoint via Consul
		addr, err := consul.GetServiceEndpoint(serviceName)
		if err != nil {
			log.Printf("WebSocketProxy: service %s unreachable: %v\n", serviceName, err)
			return
		}
		log.Printf("WebSocketProxy: resolved backend address: %s\n", addr)

		// Build target path from Fiber locals (set in route, e.g., /ws/:id)
		targetPath := clientConn.Locals("target_path")
		if targetPath == nil {
			targetPath = "/"
		}
		log.Printf("WebSocketProxy: target path: %s\n", targetPath)

		// Build the backend WebSocket URL
		u := url.URL{
			Scheme: "ws",
			Host:   addr,
			Path:   targetPath.(string),
		}

		headers := http.Header{}
		headers.Set("X-User-ID", userID)
		headers.Set("X-Session-ID", sessionID)

		log.Printf("WebSocketProxy: dialing backend ws://%s%s\n", addr, targetPath)

		// Dial backend chat-service using Gorilla WebSocket
		backendConn, _, err := gws.DefaultDialer.Dial(u.String(), headers)
		if err != nil {
			log.Printf("WebSocketProxy: failed to connect to backend: %v\n", err)
			return
		}
		defer backendConn.Close()
		log.Println("WebSocketProxy: backend connection established")

		// Bidirectional proxy: client <-> backend
		errCh := make(chan error, 2)

		// Client -> Backend
		go func() {
			for {
				mt, msg, err := clientConn.ReadMessage()
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

		// Backend -> Client
		go func() {
			for {
				mt, msg, err := backendConn.ReadMessage()
				if err != nil {
					errCh <- err
					return
				}
				if err := clientConn.WriteMessage(mt, msg); err != nil {
					errCh <- err
					return
				}
			}
		}()

		// Wait for error from either direction
		err = <-errCh
		log.Printf("WebSocketProxy: connection closed for path %v, reason: %v\n", targetPath, err)
	}
}
