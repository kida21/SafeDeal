package chapa

// BankAccountLengths maps Chapa bank ID to required account number length
var BankAccountLengths = map[int]int{
	130: 16, // Abay Bank
	772: 15, // Addis International Bank
	207: 10, // Ahadu Bank
	656: 14, // Awash Bank
	347: 8,  // Bank of Abyssinia
	571: 13, // Berhan Bank
	128: 10, // CBEBirr (mobile money)
	946: 13, // Commercial Bank of Ethiopia (CBE)
	893: 10, // Coopay-Ebirr
	880: 13, // Dashen Bank
	301: 13, // Global Bank Ethiopia
	534: 16, // Hibret Bank
	315: 9,  // Lion International Bank
	266: 10, // M-Pesa
	979: 13, // Nib International Bank
	423: 12, // Oromia International Bank
	855: 10, // telebirr
	472: 13, // Wegagen Bank
	687: 16, // Zemen Bank
}


func GetAccountLength(bankCode int) (int, bool) {
	length, exists := BankAccountLengths[bankCode]
	return length, exists
}


func IsMobileMoney(bankCode int) bool {
	mobileMoney := map[int]bool{
		128: true, // CBEBirr
		893: true, // Ebirr
		266: true, // M-Pesa
		855: true, // telebirr
	}
	return mobileMoney[bankCode]
}