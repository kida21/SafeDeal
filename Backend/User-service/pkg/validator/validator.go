package validator

import (
    "github.com/go-playground/validator/v10"
	"regexp"
)

var validate = validator.New()
func init() {
    
    _ = validate.RegisterValidation("chars_only", validateCharsOnly)
}
var regex = regexp.MustCompile(`^[a-zA-Z\s]+$`)

func validateCharsOnly(fl validator.FieldLevel) bool {
    return regex.MatchString(fl.Field().String())
}

func ValidateStruct(s any) error {
    return validate.Struct(s)
}