package internal

import (
	"bytes"
	"net/http"
	"net/http/httptest"

	"github.com/gofiber/fiber/v3"
)

func HTTPHandlerFuncToFiber(h http.HandlerFunc) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		// Convert Fiber request to http.Request
		req, err := http.NewRequest(
			string(ctx.Method()),
			ctx.OriginalURL(),
			bytes.NewReader(ctx.Body()),
		)
		if err != nil {
			return err
		}

		// Copy headers
		ctx.Request().Header.VisitAll(func(k, v []byte) {
			req.Header.Set(string(k), string(v))
		})

		// Recorder for http.HandlerFunc response
		rec := httptest.NewRecorder()

		// Call the original http.HandlerFunc
		h.ServeHTTP(rec, req)

		// Copy status
		ctx.Status(rec.Code)

		// Copy headers back
		for k, vals := range rec.Header() {
			for _, v := range vals {
				ctx.Set(k, v)
			}
		}

		// Write body
		return ctx.Send(rec.Body.Bytes())
	}
}
