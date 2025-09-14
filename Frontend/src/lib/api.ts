import axios, { AxiosResponse } from 'axios';
// Ensure Vite's types are available for import.meta
/// <reference types="vite/client" />
import {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    User,
    Escrow,
    CreateEscrowRequest,
    EscrowPayment,
    BankDetails
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080';
console.log('API Base URL:', API_BASE_URL);

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
        console.log('API Request:', config.url);
        console.log('Token exists:', !!token);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Authorization header set:', `Bearer ${token}...`);
        } else {
            console.warn('No access token found in localStorage');
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        console.log('API Response Error:', error.response?.status, error.response?.data);
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            console.log('401 error, attempting token refresh...');
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (refreshToken) {
                    console.log('Refresh token found, attempting refresh...');
                    const response = await axios.post(`${API_BASE_URL}/refresh-token`, {
                        refresh_token: refreshToken,
                    });

                    const { access_token } = response.data;
                    localStorage.setItem('access_token', access_token);
                    console.log('Token refreshed successfully');

                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                    return api(originalRequest);
                } else {
                    console.log('No refresh token found');
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
            }
        }

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

    refreshToken: (refreshToken: string): Promise<AxiosResponse<{ access_token: string }>> =>
        api.post('/refresh-token', { refresh_token: refreshToken }),
};

// User API
export const userApi = {
    getProfile: (): Promise<AxiosResponse<User>> =>
        api.get('/api/profile'),

    updateBankDetails: (data: BankDetails): Promise<AxiosResponse<User>> =>
        api.put('/api/profile/bank-details', data),

    createWallet: (): Promise<AxiosResponse<User>> =>
        api.post('/api/wallet'),
};

// Escrow API
export const escrowApi = {
    create: (data: any): Promise<AxiosResponse<Escrow>> =>
        api.post('/api/escrows', data),

    getById: (id: number): Promise<AxiosResponse<Escrow>> =>
        api.get(`/api/escrows/${id}`),

    accept: (id: number): Promise<AxiosResponse<Escrow>> =>
        api.post(`/api/escrows/${id}/accept`),

    confirmReceipt: (id: number): Promise<AxiosResponse<Escrow>> =>
        api.post(`/api/escrows/${id}/confirm-receipt`),

    dispute: (id: number, reason: string): Promise<AxiosResponse<Escrow>> =>
        api.post(`/api/escrows/dispute/${id}`, { reason }),

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

// Payment API
export const paymentApi = {
    initiateEscrowPayment: (escrowId: number): Promise<AxiosResponse<EscrowPayment>> =>
        api.post('/api/payments/initiate', { escrow_id: escrowId }),
};

export default api;
