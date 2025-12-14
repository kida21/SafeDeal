package proxy

import (
	"fmt"
	"log"
	"strings"
	"time"

	"api_gateway/internal/consul"

	"github.com/gofiber/fiber/v2"
	"github.com/valyala/fasthttp"
)

var clientPool = make(map[string]*fasthttp.Client)

func getClient(addr string) *fasthttp.Client {
	if client, ok := clientPool[addr]; ok {
		return client
	}

	client := &fasthttp.Client{
		MaxConnsPerHost:             200,
		MaxIdleConnDuration:         5 * time.Second,
		MaxConnWaitTimeout:          3 * time.Second,
		DisableHeaderNamesNormalizing: true,
		ReadTimeout:                 70 * time.Second,
		WriteTimeout:                70 * time.Second,
	}

	clientPool[addr] = client
	return client
}

func ProxyHandler(serviceName string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		log.Printf("Proxy: incoming request for %s", c.Path())

		addr, err := consul.GetServiceEndpoint(serviceName)
		if err != nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": fmt.Sprintf("Service %s is unreachable", serviceName),
			})
		}

		req := fasthttp.AcquireRequest()
		resp := fasthttp.AcquireResponse()
		defer fasthttp.ReleaseRequest(req)
		defer fasthttp.ReleaseResponse(resp)

		pathWithQuery := rewritePathAndQuery(c.Path(), c.Request().URI().QueryString(), serviceName)

		req.Header.SetMethodBytes(c.Request().Header.Method())
		req.SetRequestURI("http://" + addr + pathWithQuery)

		// copy headers except hop-by-hop
		c.Request().Header.VisitAll(func(key, value []byte) {
			switch string(key) {
			case "Connection", "Keep-Alive", "Proxy-Authenticate", "Proxy-Authorization", "TE", "Trailers", "Transfer-Encoding", "Upgrade":
				return
			}
			req.Header.SetBytesKV(key, value)
		})

		req.SetBody(c.Request().Body())

		if err := getClient(addr).Do(req, resp); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to forward request: " + err.Error(),
			})
		}

		c.Status(resp.StatusCode())
		
		// Set CORS headers to ensure no wildcard leaks through
		origin := c.Get("Origin")
		if origin == "https://safe-deal.vercel.app" {
			c.Set("Access-Control-Allow-Origin", origin)
			c.Set("Access-Control-Allow-Credentials", "true")
			c.Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
			c.Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-User-ID, ngrok-skip-browser-warning")
		}
		
		resp.Header.VisitAll(func(key, value []byte) {
			switch string(key) {
			case "Connection", "Keep-Alive":
				return
			case "Access-Control-Allow-Origin", "Access-Control-Allow-Methods", "Access-Control-Allow-Headers", "Access-Control-Allow-Credentials":
				// Block CORS headers from backend - use gateway's CORS only
				return
			}
			c.Response().Header.SetBytesKV(key, value)
		})
		c.Response().SetBodyRaw(resp.Body())

		return nil
	}
}

func rewritePathAndQuery(path string, query []byte, serviceName string) string {
	prefix := fmt.Sprintf("/api/%s", serviceName)

	if strings.HasPrefix(path, prefix) {
		path = strings.TrimPrefix(path, prefix)
		if path == "" {
			path = "/"
		}
	}

	if len(query) > 0 {
		path += "?" + string(query)
	}

	return path
}
