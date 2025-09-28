import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
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
  TransactionHistory,
} from '../types';


const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080';

// Create Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // ✅ Enables sending HTTP-only cookies automatically
});

// Add access token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Add access token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------- API endpoints ----------
export const authApi = {
  login: (data: LoginRequest): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/login', data),

  register: (data: RegisterRequest): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/register', data),

  logout: (): Promise<AxiosResponse<void>> => api.post('/api/logout'),

  // ✅ Refresh using cookie — no params needed
  refreshToken: (): Promise<AxiosResponse<{ access_token: string; expires_in: number }>> =>
    api.post('/refresh-token'),
};

export const userApi = {
  getProfile: (): Promise<AxiosResponse<User>> => api.get('/api/profile'),
  updateProfile: (data: UpdateProfileRequest): Promise<AxiosResponse<User>> =>
    api.patch('/api/updateprofile', data),
  searchUsers: (query: string): Promise<AxiosResponse<{ users: SearchUser[]; pagination: any }>> =>
    api.get(`/api/search?q=${encodeURIComponent(query)}`),
  updateBankDetails: (data: BankDetails): Promise<AxiosResponse<User>> =>
    api.put('/api/profile/bank-details', data),
  createWallet: (): Promise<AxiosResponse<User>> => api.post('/api/wallet'),
  resendActivation: (email: string): Promise<AxiosResponse<{ message: string }>> =>
    axios.post(`${API_BASE_URL}/resend`, { email }),
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
