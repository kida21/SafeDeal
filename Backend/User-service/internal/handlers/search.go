package handlers

import (
	"strconv"
	"strings"
	"user_service/internal/model"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)


type SearchUserRequest struct {
	Query      string `query:"q"`
	FirstName  string `query:"first_name"`
	LastName   string `query:"last_name"`
	Profession string `query:"profession"`
	Page       int    `query:"page"`
	PageSize   int    `query:"page_size"`
	Limit int `query:"limit"` 
}

func SearchUser(c fiber.Ctx) error {
	query := c.Query("q")
	firstName := c.Query("first_name")
	lastName := c.Query("last_name")
	profession := c.Query("profession")

	page := 1
	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed >= 1 {
			page = parsed
		}
	}

	pageSize := 10
	if ps := c.Query("page_size"); ps != "" {
		if parsed, err := strconv.Atoi(ps); err == nil && parsed >= 1 && parsed <= 50 {
			pageSize = parsed
		}
	} else if limit := c.Query("limit"); limit != "" { // fallback to limit
		if parsed, err := strconv.Atoi(limit); err == nil && parsed >= 1 && parsed <= 50 {
			pageSize = parsed
		}
	}

	offset := (page - 1) * pageSize

	db := c.Locals("db").(*gorm.DB)
	var users []model.User
	var total int64

	// Base query: only activated users
	baseQuery := db.Model(&model.User{}).Where("activated = ?", true)

	// Build full-text and filter conditions
	var conditions []string
	var args []interface{}

	// Full-text search
	if query != "" {
		tsQuery := strings.ReplaceAll(query, " ", " & ")
		conditions = append(conditions, "to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || coalesce(profession, '')) @@ to_tsquery('english', ?)")
		args = append(args, tsQuery)
	}

	// Field filters
	if firstName != "" {
		conditions = append(conditions, "first_name ILIKE ?")
		args = append(args, "%"+firstName+"%")
	}
	if lastName != "" {
		conditions = append(conditions, "last_name ILIKE ?")
		args = append(args, "%"+lastName+"%")
	}
	if profession != "" {
		conditions = append(conditions, "profession ILIKE ?")
		args = append(args, "%"+profession+"%")
	}

	// Apply conditions
	if len(conditions) > 0 {
		combined := strings.Join(conditions, " AND ")
		baseQuery = baseQuery.Where(combined, args...)
	}

	// Get total count
	if err := baseQuery.Count(&total).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to count users"})
	}

	// Fetch users
	if err := baseQuery.
		Order("first_name, last_name").
		Offset(offset).
		Limit(pageSize).
		Find(&users).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to search users"})
	}

	// Build response
	var results []fiber.Map
	for _, u := range users {
		results = append(results, fiber.Map{
			"first_name": u.FirstName,
			"last_name":  u.LastName,
			"profession": u.Profession,
			"activated":  u.Activated,
		})
	}

	return c.JSON(fiber.Map{
		"users": results,
		"pagination": fiber.Map{
			"current_page":  page,
			"page_size":     pageSize,
			"total":         total,
			"total_pages":   (total + int64(pageSize) - 1) / int64(pageSize),
			"has_next":      page*pageSize < int(total),
			"has_previous":  page > 1,
		},
	})
}