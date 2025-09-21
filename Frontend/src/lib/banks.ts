// Bank list based on shared/chapa/banks.go
export interface Bank {
    code: number;
    name: string;
    accountLength: number;
    isMobileMoney: boolean;
}

export const BANKS: Bank[] = [
    { code: 130, name: "Abay Bank", accountLength: 16, isMobileMoney: false },
    { code: 772, name: "Addis International Bank", accountLength: 15, isMobileMoney: false },
    { code: 207, name: "Ahadu Bank", accountLength: 10, isMobileMoney: false },
    { code: 656, name: "Awash Bank", accountLength: 14, isMobileMoney: false },
    { code: 347, name: "Bank of Abyssinia", accountLength: 8, isMobileMoney: false },
    { code: 571, name: "Berhan Bank", accountLength: 13, isMobileMoney: false },
    { code: 128, name: "CBEBirr (Mobile Money)", accountLength: 10, isMobileMoney: true },
    { code: 946, name: "Commercial Bank of Ethiopia (CBE)", accountLength: 13, isMobileMoney: false },
    { code: 893, name: "Coopay-Ebirr (Mobile Money)", accountLength: 10, isMobileMoney: true },
    { code: 880, name: "Dashen Bank", accountLength: 13, isMobileMoney: false },
    { code: 301, name: "Global Bank Ethiopia", accountLength: 13, isMobileMoney: false },
    { code: 534, name: "Hibret Bank", accountLength: 16, isMobileMoney: false },
    { code: 315, name: "Lion International Bank", accountLength: 9, isMobileMoney: false },
    { code: 266, name: "M-Pesa (Mobile Money)", accountLength: 10, isMobileMoney: true },
    { code: 979, name: "Nib International Bank", accountLength: 13, isMobileMoney: false },
    { code: 423, name: "Oromia International Bank", accountLength: 12, isMobileMoney: false },
    { code: 855, name: "telebirr (Mobile Money)", accountLength: 10, isMobileMoney: true },
    { code: 472, name: "Wegagen Bank", accountLength: 13, isMobileMoney: false },
    { code: 687, name: "Zemen Bank", accountLength: 16, isMobileMoney: false },
];

export const getBankByCode = (code: number): Bank | undefined => {
    return BANKS.find(bank => bank.code === code);
};

export const getBankName = (code: number): string => {
    const bank = getBankByCode(code);
    return bank ? bank.name : `Unknown Bank (${code})`;
};
