package proxy

import (
    "fmt"
    "strings"
    "time"

    "github.com/gofiber/fiber/v3"
    "github.com/valyala/fasthttp"
    "api_gateway/internal/consul"
)

var clientPool = make(map[string]*fasthttp.Client)

func getClient(addr string) *fasthttp.Client {
    if client, ok := clientPool[addr]; ok {
        return client
    }

    client := &fasthttp.Client{
        MaxConnsPerHost:       200,
        MaxIdleConnDuration:   5 * time.Second,
        MaxConnWaitTimeout:    3 * time.Second,
        DisableHeaderNamesNormalizing: true,
        ReadTimeout:           10 * time.Second,
        WriteTimeout:          10 * time.Second,
        
        
    }

    clientPool[addr] = client
    return client
}

func ProxyHandler(serviceName string) fiber.Handler {
    return func(c fiber.Ctx) error {
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

        // Set method and URL
        req.Header.SetMethodBytes(c.Request().Header.Method())
        req.SetRequestURI("http://" + addr + rewritePath(c.Path(), serviceName))

        // Copy headers
        c.Request().Header.VisitAll(func(key, value []byte) {
            switch string(key) {
            case "Connection", "Keep-Alive", "Proxy-Authenticate", "Proxy-Authorization", "TE", "Trailers", "Transfer-Encoding", "Upgrade":
                return
            }
            req.Header.SetBytesKV(key, value)
        })

        // Copy body
        req.SetBody(c.Request().Body())

        // Perform request
        if err := getClient(addr).Do(req, resp); err != nil {
            return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
                "error": "Failed to forward request: " + err.Error(),
            })
        }

        // Copy response back
        c.Response().SetStatusCode(resp.StatusCode())
        resp.Header.VisitAll(func(key, value []byte) {
            switch string(key) {
            case "Connection", "Keep-Alive":
                return
            }
            c.Response().Header.SetBytesKV(key, value)
        })
        c.Response().SetBody(resp.Body())

        return nil
    }
}

func rewritePath(path, serviceName string) string {
    prefix := fmt.Sprintf("/api/%s", serviceName)
    if strings.HasPrefix(path, prefix) {
        path = strings.TrimPrefix(path, prefix)
        if path == "" {
            return "/"
        }
    }
    return path
}