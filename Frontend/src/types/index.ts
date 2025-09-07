export interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    activated: boolean;
    wallet_address?: string;
    account_name?: string;
    account_number?: string;
    bank_code?: number;
    created_at: string;
    updated_at: string;
}

export interface AuthResponse {
    user: User;
    access_token: string;
    refresh_token: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    first_name: string;
    last_name: string;
    profession: string;
    email: string;
    password: string;
}

export type EscrowStatus = 'Pending' | 'Funded' | 'Released' | 'Disputed';

export interface Escrow {
    id: number;
    buyer_id: number;
    seller_id: number;
    amount: number;
    status: EscrowStatus;
    conditions?: string;
    blockchain_tx_hash?: string;
    blockchain_escrow_id?: number;
    active: boolean;
    created_at: string;
    updated_at: string;
    buyer?: User;
    seller?: User;
}

export interface CreateEscrowRequest {
    seller_id: number;
    amount: number;
    conditions?: string;
}

export type TransactionStatus = 'Pending' | 'Completed' | 'Failed' | 'Refunded';

export interface EscrowPayment {
    id: number;
    escrow_id: number;
    buyer_id: number;
    transaction_ref: string;
    amount: number;
    currency: string;
    status: TransactionStatus;
    payment_url?: string;
    created_at: string;
    updated_at: string;
}

export interface Message {
    id: number;
    escrow_id: number;
    sender_id: number;
    content: string;
    created_at: string;
    sender?: User;
}

export interface BankDetails {
    account_name: string;
    account_number: string;
    bank_code: number;
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
    success: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}
