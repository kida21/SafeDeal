package chapa

import (
	"fmt"
	"strconv"
)

func ValidateAccount(bankCode int, accountNumber string) error {
	
	length, exists := GetAccountLength(bankCode)
	if !exists {
		return fmt.Errorf("unsupported bank code: %d", bankCode)
	}

	
	if len(accountNumber) != length {
		return fmt.Errorf("account number must be %d digits for this bank (got %d)", length, len(accountNumber))
	}

	// Check if all digits
	if _, err := strconv.Atoi(accountNumber); err != nil {
		return fmt.Errorf("account number must contain only digits")
	}

	return nil
}