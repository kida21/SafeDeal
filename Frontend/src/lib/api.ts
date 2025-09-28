import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';

// Extend AxiosRequestConfig to include our custom property
declare module 'axios' {
    export interface AxiosRequestConfig {
        skipAuthRefresh?: boolean;
    }
}

// Ensure Vite's types are available for import.meta
/// <reference types="vite/client" />
import {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UpdateProfileRequest,
    User,
    SearchUser,
    Escrow,
    CreateEscrowRequest,
    EscrowPayment,
    BankDetails,
    TransactionHistory
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh and retry logic
api.interceptors.response.use(
    (response) => {
        // Handle successful refresh token response
        if (response.config.url?.includes('/refresh-token') && response.data) {
            const { access_token, refresh_token: newRefreshToken } = response.data;
            
            if (access_token) {
                localStorage.setItem('access_token', access_token);
                console.debug('✅ Access token updated from refresh response');
            }
            
            // Update refresh token if provided (token rotation)
            if (newRefreshToken) {
                localStorage.setItem('refresh_token', newRefreshToken);
                console.debug('✅ Refresh token rotated');
            }
        }
        
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Only handle 401 errors and only if this isn't a retry
        if (error.response?.status === 401 && !originalRequest._retry) {
            // If this is a refresh token request, don't retry
            if (originalRequest.url?.includes('/refresh-token')) {
                console.debug('❌ Refresh token failed - logging out');
                // Clear auth data
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user_profile');
                window.location.href = '/login';
                return Promise.reject(error);
            }

            console.debug('🔄 401 intercepted - attempting token refresh');
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    console.debug('❌ No refresh token available');
                    throw new Error('No refresh token');
                }

                // Attempt to refresh the token
                const response = await axios.post(
                    `${API_BASE_URL}/refresh-token`,
                    { refresh_token: refreshToken },
                    {
                        headers: { 'Content-Type': 'application/json' },
                        // @ts-ignore - skipAuthRefresh is a custom property we're adding
                        skipAuthRefresh: true // Prevent infinite loops
                    } as AxiosRequestConfig
                );

                const { access_token, refresh_token: newRefreshToken } = response.data;
                
                if (!access_token) {
                    throw new Error('No access token in refresh response');
                }

                // Store new tokens
                localStorage.setItem('access_token', access_token);
                if (newRefreshToken) {
                    localStorage.setItem('refresh_token', newRefreshToken);
                }

                console.debug('✅ Token refresh successful');

                // Update the auth header
                originalRequest.headers.Authorization = `Bearer ${access_token}`;
                
                // Update the original request config with the new token
                originalRequest.headers = {
                    ...originalRequest.headers,
                    'Authorization': `Bearer ${access_token}`
                };

                // Retry the original request with the new token
                return api(originalRequest);

            } catch (refreshError: any) {
                console.debug('❌ Fallback refresh failed:', refreshError.message);
                
                // Only clear tokens on actual auth failures (not network errors)
                if (refreshError.response?.status === 401 || refreshError.response?.status === 403) {
                    console.debug('🚪 Clearing tokens and redirecting to login');
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user_profile');
                    
                    // Redirect to login page
                    window.location.href = '/login';
                    return Promise.reject(new Error('Authentication failed'));
                }
                
                // For network errors, don't clear tokens - let proactive refresh handle it
                console.debug('🌐 Network error during refresh - keeping tokens');
            }
        }

        // Don't clear tokens on 403 - these are business logic errors (not activated, etc.)
        // Don't clear tokens on network errors - proactive refresh will handle them

        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    login: (data: LoginRequest): Promise<AxiosResponse<AuthResponse>> =>
        api.post('/login', data),

    register: (data: RegisterRequest): Promise<AxiosResponse<AuthResponse>> =>
        api.post('/register', data),

    logout: (): Promise<AxiosResponse<void>> =>
        api.post('/api/logout'),

    refreshToken: (refreshToken: string): Promise<AxiosResponse<{ access_token: string; refresh_token?: string }>> =>
        api.post('/refresh-token', { refresh_token: refreshToken }),
};

// User API - Based on backend endpoints
export const userApi = {
    // GET Profile
    getProfile: (): Promise<AxiosResponse<User>> =>
        api.get('/api/profile'),

    // PATCH Update Profile
    updateProfile: (data: UpdateProfileRequest): Promise<AxiosResponse<User>> =>
        api.patch('/api/updateprofile', data),

    // GET Search - Search for users (returns array of users)
    searchUsers: (query: string): Promise<AxiosResponse<{ users: SearchUser[], pagination: any }>> =>
        api.get(`/api/search?q=${encodeURIComponent(query)}`),

    // PUT Bank-Details
    updateBankDetails: (data: BankDetails): Promise<AxiosResponse<User>> =>
        api.put('/api/profile/bank-details', data),

    // POST Wallet
    createWallet: (): Promise<AxiosResponse<User>> =>
        api.post('/api/wallet'),

    // POST Resend Activation Email (public route via gateway)
    resendActivation: (email: string): Promise<AxiosResponse<{ message: string }>> =>
        axios.post(`${API_BASE_URL}/resend`, { email }, { headers: { 'Content-Type': 'application/json' } }),
};

// Escrow API - Based on backend endpoints
export const escrowApi = {
    // POST Create-escrow
    create: (data: CreateEscrowRequest): Promise<AxiosResponse<Escrow>> =>
        api.post('/api/escrows', data),

    // GET My Escrows - Get user's escrows
    // Backend returns: { escrows: Escrow[], summary: { total, active, completed } }
    getMyEscrows: (): Promise<AxiosResponse<{ escrows: Escrow[]; summary: { total: number; active: number; completed: number } }>> =>
        api.get('/api/escrows/my'),

    // GET Fetch-escrow
    getById: (id: number): Promise<AxiosResponse<Escrow>> =>
        api.get(`/api/escrows/${id}`),

    // POST Accept-escrow
    accept: (id: number): Promise<AxiosResponse<Escrow>> =>
        api.post(`/api/escrows/${id}/accept`),

    // POST Confirm-receipt
    confirmReceipt: (id: number): Promise<AxiosResponse<Escrow>> =>
        api.post(`/api/escrows/${id}/confirm-receipt`),

    // POST Dispute
    dispute: (id: number, reason: string): Promise<AxiosResponse<Escrow>> =>
        api.post(`/api/escrows/dispute/${id}`, { reason }),

    // GET Dispute (if available)
    getDispute: (id: number): Promise<AxiosResponse<any>> =>
        api.get(`/api/escrows/dispute/${id}`),

    // Helper function to get multiple escrows by IDs
    getMultipleByIds: async (ids: number[]): Promise<Escrow[]> => {
        const promises = ids.map(id => escrowApi.getById(id));
        const responses = await Promise.allSettled(promises);
        return responses
            .filter((result): result is PromiseFulfilledResult<AxiosResponse<Escrow>> =>
                result.status === 'fulfilled')
            .map(result => result.value.data);
    },
};

// Payment API - Based on backend endpoints
export const paymentApi = {
    // POST Payment
    initiateEscrowPayment: async (escrowId: number, p0: { email: string | undefined; first_name: string | undefined; last_name: string | undefined; phone_number: string; }): Promise<AxiosResponse<EscrowPayment>> => {
        // Fetch escrow to get amount if needed
        const escrowResp = await api.get(`/api/escrows/${escrowId}`);
        const amount = escrowResp?.data?.amount;
        const profileRaw = localStorage.getItem('user_profile');
        let email = '';
        let first_name = '';
        let last_name = '';
        let phone_number = '';
        try {
            if (profileRaw) {
                const profile = JSON.parse(profileRaw);
                email = profile.email || '';
                first_name = profile.first_name || '';
                last_name = profile.last_name || '';
                phone_number = profile.phone_number || '';
            }
        } catch { }

        return api.post('/api/payments/initiate', {
            escrow_id: escrowId,
            amount,
            currency: 'ETB',
            email,
            first_name,
            last_name,
            phone_number,
        });
    },

    // GET Transaction History
    getTransactionHistory: (): Promise<AxiosResponse<{ transactions: TransactionHistory[]; total: number; status: string }>> =>
        api.get('/api/payments/transactions'),
};

// WebSocket API for real-time features
export const wsApi = {
    // Chat WebSocket connection
    connectChat: (escrowId: number): WebSocket => {
        const token = localStorage.getItem('access_token') || '';
        if (escrowId === undefined || escrowId === null) {
            // Return a dummy WS that will immediately close to avoid null checks downstream
            const dummy = new WebSocket('ws://localhost:0');
            try { dummy.close(); } catch { }
            return dummy;
        }

        const wsBase = API_BASE_URL.startsWith('https')
            ? API_BASE_URL.replace('https', 'wss')
            : API_BASE_URL.replace('http', 'ws');
        const qs = token ? `?token=${encodeURIComponent(token)}` : '';
        const wsUrl = `${wsBase}/api/chat/ws/${escrowId}${qs}`;
        try {
            return new WebSocket(wsUrl);
        } catch (error) {
            // Return a dummy socket that immediately closes
            const dummy = new WebSocket('ws://localhost:0');
            try { dummy.close(); } catch { }
            return dummy;
        }
    },

    // Notification WebSocket connection
    connectNotifications: (): WebSocket => {
        const token = localStorage.getItem('access_token') || '';
        const wsBase = API_BASE_URL.startsWith('https')
            ? API_BASE_URL.replace('https', 'wss')
            : API_BASE_URL.replace('http', 'ws');
        const qs = token ? `?token=${encodeURIComponent(token)}` : '';
        const wsUrl = `${wsBase}/api/notifications/ws${qs}`;
        try {
            return new WebSocket(wsUrl);
        } catch (error) {
            const dummy = new WebSocket('ws://localhost:0');
            try { dummy.close(); } catch { }
            return dummy;
        }
    },
};

export default api;
