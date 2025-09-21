// This file is deprecated - all API calls are now handled directly in the api.ts file
// and through the individual API modules (authApi, userApi, escrowApi, paymentApi)

export interface EscrowStats {
    total_escrows: number;
    active_escrows: number;
    completed_escrows: number;
    disputed_escrows: number;
    total_amount: number;
}

// Legacy DataService class - kept for backward compatibility
// All methods should now use the individual API modules instead
export class DataService {
    // This class is deprecated - use the individual API modules instead:
    // - authApi for authentication
    // - userApi for user operations
    // - escrowApi for escrow operations
    // - paymentApi for payment operations
    // - wsApi for WebSocket connections
}
