package proxy

import (
	"api_gateway/internal/consul"
	"fmt"
    "github.com/gofiber/fiber/v3"
	"github.com/valyala/fasthttp"
)

var client fasthttp.Client

func ProxyHandler(serviceName string) fiber.Handler {
    return func(c fiber.Ctx) error {
        
        addr, err := consul.GetServiceEndpoint(serviceName)
        if err != nil {
            return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
                "error": fmt.Sprintf("Service %s is unreachable", serviceName),
            })
        }

        
        newReq := fasthttp.AcquireRequest()
        defer fasthttp.ReleaseRequest(newReq)

        
        newReq.Header.SetMethodBytes(c.Request().Header.Method())
        newReq.Header.SetHost(addr)

        
        uri := c.Request().URI().String()
        newReq.SetRequestURI(string(uri))

        
        for k, v := range c.Request().Header.All() {
            newReq.Header.SetBytesKV(k, v)
        }

       
        newReq.SetBody(c.Request().Body())

       
        resp := fasthttp.AcquireResponse()
        defer fasthttp.ReleaseResponse(resp)

        
        if err := client.Do(newReq, resp); err != nil {
            return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
                "error": "Failed to forward request",
            })
        }

        
        c.Response().SetBody(resp.Body())
        c.Response().Header.SetStatusCode(resp.StatusCode())

        
        for k, v := range resp.Header.All() {
            c.Response().Header.SetBytesKV(k, v)
        }

        return nil
    }
}