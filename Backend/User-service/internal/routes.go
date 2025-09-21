package internal

import (
	"user_service/internal/handlers"
	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

func SetupRoutes(app *fiber.App, db *gorm.DB) {
    app.Use(func(c fiber.Ctx) error {
        c.Locals("db", db)
        return c.Next()
    })
    
    // Public routes
    app.Post("/register", handlers.Register)
    app.Get("/activate", handlers.ActivateAccount)
    app.Post("/login", handlers.Login)
    app.Post("/refresh-token",handlers.RefreshToken)
    

     api := app.Group("/api")
    {   
        api.Post("/logout",handlers.Logout)
        api.Get("/profile", handlers.Profile)
        api.Patch("/updateprofile",handlers.UpdateProfile)
        api.Put("/profile/bank-details",handlers.UpdateBankDetails)
        api.Post("/wallet",handlers.CreateWallet)
        api.Get("/search", handlers.SearchUser)
        
    }
    
      
        
     
}