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

		// Inspect backend response CORS headers (case-insensitive)
		var backendHasWildcard bool
		resp.Header.VisitAll(func(key, value []byte) {
			keyStr := strings.ToLower(string(key))
			valueStr := string(value)
			if keyStr == "access-control-allow-origin" && valueStr == "*" {
				backendHasWildcard = true
				log.Printf("Backend has wildcard CORS header from upstream")
			}
		})

		c.Status(resp.StatusCode())

		// Set CORS headers to ensure no wildcard leaks through
		origin := c.Get("Origin")
		log.Printf("Request origin: %s", origin)

		// Remove any existing CORS headers on the response first
		c.Response().Header.Del("Access-Control-Allow-Origin")
		c.Response().Header.Del("Access-Control-Allow-Credentials")
		c.Response().Header.Del("Access-Control-Allow-Methods")
		c.Response().Header.Del("Access-Control-Allow-Headers")
		c.Response().Header.Del("Vary")

		// Allow both production and development origins
		if origin == "https://safe-deal.vercel.app" || origin == "https://elida-necktieless-unaspiringly.ngrok-free.dev" {
			c.Set("Access-Control-Allow-Origin", origin)
			c.Set("Access-Control-Allow-Credentials", "true")
			c.Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
			c.Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-User-ID, ngrok-skip-browser-warning")
			c.Set("Vary", "Origin")
			log.Printf("Set CORS headers for origin: %s", origin)
		} else {
			log.Printf("Origin not allowed: %s", origin)
		}

		if backendHasWildcard {
			log.Printf("Blocked wildcard CORS from backend")
		}

		// Copy upstream headers but strip any CORS headers (case-insensitive)
		resp.Header.VisitAll(func(key, value []byte) {
			keyStr := strings.ToLower(string(key))
			switch keyStr {
			case "connection", "keep-alive":
				return
			case "access-control-allow-origin", "access-control-allow-methods", "access-control-allow-headers", "access-control-allow-credentials", "vary":
				// Block CORS-related headers from backend - use gateway's CORS only
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
