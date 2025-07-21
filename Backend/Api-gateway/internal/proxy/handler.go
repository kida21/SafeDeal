package proxy

import (
	"api_gateway/internal/consul"
	"fmt"
    "github.com/gofiber/fiber/v3"
	"github.com/valyala/fasthttp"
)

var client fasthttp.Client

// ProxyHandler creates a reverse proxy for a service
func ProxyHandler(serviceName string) fiber.Handler {
    return func(c fiber.Ctx) error {
        // Get service endpoint from Consul
        addr, err := consul.GetServiceEndpoint(serviceName)
        if err != nil {
            return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
                "error": fmt.Sprintf("Service %s is unreachable", serviceName),
            })
        }

        // Build fasthttp request
        newReq := fasthttp.AcquireRequest()
        defer fasthttp.ReleaseRequest(newReq)

        // Set method, host, path, query
        newReq.Header.SetMethodBytes(c.Request().Header.Method())
        newReq.Header.SetHost(addr)

        // Set full request URI
        uri := c.Request().URI().String()
        newReq.SetRequestURI(string(uri))

        // Copy headers using All()
        for k, v := range c.Request().Header.All() {
            newReq.Header.SetBytesKV(k, v)
        }

        // Copy body
        newReq.SetBody(c.Request().Body())

        // Prepare response
        resp := fasthttp.AcquireResponse()
        defer fasthttp.ReleaseResponse(resp)

        // Perform request
        if err := client.Do(newReq, resp); err != nil {
            return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
                "error": "Failed to forward request",
            })
        }

        // Copy response to client
        c.Response().SetBody(resp.Body())
        c.Response().Header.SetStatusCode(resp.StatusCode())

        // Copy response headers
        for k, v := range resp.Header.All() {
            c.Response().Header.SetBytesKV(k, v)
        }

        return nil
    }
}