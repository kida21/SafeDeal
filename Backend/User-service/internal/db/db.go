package db

import (
	"fmt"
	"os"
	"user_service/internal/model"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

type Config struct {
    Host     string
    Port     string
    User     string
    Password string
    DBName   string
    SSLMode  string
}

func LoadConfig() Config {
    return Config{
        Host:     os.Getenv("DB_HOST"),
        Port:     os.Getenv("DB_PORT"),
        User:     os.Getenv("DB_USER"),
        Password: os.Getenv("DB_PASSWORD"),
        DBName:   os.Getenv("DB_NAME"),
        SSLMode:  os.Getenv("DB_SSLMODE"),
    }
}

func ConnectDB() {
    cfg := LoadConfig()

    dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=UTC",
        cfg.Host, cfg.User, cfg.Password, cfg.DBName, cfg.Port, cfg.SSLMode)

    var err error
    DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
       
        panic("failed to connect database")
    }

    fmt.Println("Connected to Database")
}

func RunMigration(db *gorm.DB) error {
	// Auto migrate schema
	if err := db.AutoMigrate(&model.User{}); err != nil {
		return fmt.Errorf("failed to migrate: %v", err)
	}

	
	query := `
	CREATE INDEX IF NOT EXISTS idx_user_search 
	ON users USING GIN (
		to_tsvector('english', 
			coalesce(first_name, '') || ' ' || 
			coalesce(last_name, '') || ' ' || 
			coalesce(profession, '')
		)
	);
	`
  if err := db.Exec(query).Error; err != nil {
		return fmt.Errorf("failed to create full-text index: %v", err)
	}

	fmt.Println("✅ Full-text search index created or already exists")
	return nil
}
