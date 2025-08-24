package proxy

import (
	"fmt"
	"log"
	"net/http"
	"github.com/gorilla/websocket"
	"api_gateway/internal/consul"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func WebSocketProxy(serviceName string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		addr, err := consul.GetServiceEndpoint(serviceName)
		if err != nil {
			http.Error(w, "Service unreachable", http.StatusServiceUnavailable)
			return
		}

		u := fmt.Sprintf("ws://%s%s", addr, r.URL.Path)
		if r.URL.RawQuery != "" {
			u += "?" + r.URL.RawQuery
		}

		log.Printf("Upgrading to WebSocket: %s", u)

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("Upgrade failed: %v", err)
			return
		}
		defer conn.Close()

		backendConn, _, err := websocket.DefaultDialer.Dial(u, r.Header)
		if err != nil {
			log.Printf("Failed to connect to backend: %v", err)
			return
		}
		defer backendConn.Close()

		go copyWS(backendConn, conn)
		copyWS(conn, backendConn)
	}
}

func copyWS(src, dst *websocket.Conn) {
	for {
		msgType, msg, err := src.ReadMessage()
		if err != nil {
			break
		}
		if err := dst.WriteMessage(msgType, msg); err != nil {
			break
		}
	}
}