import { create } from 'zustand';
import { Escrow } from '../types';
import { escrowApi } from '../lib/api';

interface EscrowStats {
    total_escrows: number;
    active_escrows: number;
    completed_escrows: number;
    disputed_escrows: number;
    total_amount: number;
}

interface EscrowState {
    escrows: Escrow[];
    currentEscrow: Escrow | null;
    isLoading: boolean;
    stats: EscrowStats | null;
    statsLoading: boolean;
    error: string | null;
    setEscrows: (escrows: Escrow[]) => void;
    addEscrow: (escrow: Escrow) => void;
    updateEscrow: (id: number, updates: Partial<Escrow>) => void;
    setCurrentEscrow: (escrow: Escrow | null) => void;
    setLoading: (loading: boolean) => void;
    setStats: (stats: EscrowStats) => void;
    setStatsLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    fetchEscrows: (limit?: number) => Promise<void>;
    fetchStats: () => Promise<void>;
    fetchEscrowById: (id: number) => Promise<void>;
    refreshAll: () => Promise<void>;
}

export const useEscrowStore = create<EscrowState>((set, get) => ({
    escrows: [],
    currentEscrow: null,
    isLoading: false,
    stats: null,
    statsLoading: false,
    error: null,
    setEscrows: (escrows) => set({ escrows }),
    addEscrow: (escrow) => set((state) => ({ escrows: [...state.escrows, escrow] })),
    updateEscrow: (id, updates) =>
        set((state) => ({
            escrows: state.escrows.map((escrow) =>
                escrow.id === id ? { ...escrow, ...updates } : escrow
            ),
            currentEscrow:
                state.currentEscrow?.id === id
                    ? { ...state.currentEscrow, ...updates }
                    : state.currentEscrow,
        })),
    setCurrentEscrow: (escrow) => set({ currentEscrow: escrow }),
    setLoading: (isLoading) => set({ isLoading }),
    setStats: (stats) => set({ stats }),
    setStatsLoading: (statsLoading) => set({ statsLoading }),
    setError: (error) => set({ error }),
    fetchEscrows: async (limit = 5) => {
        set({ isLoading: true, error: null });
        try {
            const response = await escrowApi.getMyEscrows();
            const escrows = response.data.slice(0, limit);
            set({ escrows, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Failed to fetch escrows',
                isLoading: false
            });
        }
    },
    fetchStats: async () => {
        set({ statsLoading: true, error: null });
        try {
            const response = await escrowApi.getMyEscrows();
            const escrows = response.data;

            // Calculate stats from escrows
            const stats = {
                total_escrows: escrows.length,
                active_escrows: escrows.filter(e => e.status === 'Pending' || e.status === 'Funded').length,
                completed_escrows: escrows.filter(e => e.status === 'Released').length,
                disputed_escrows: escrows.filter(e => e.status === 'Disputed').length,
                total_amount: escrows.reduce((sum, e) => sum + e.amount, 0)
            };

            set({ stats, statsLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Failed to fetch stats',
                statsLoading: false
            });
        }
    },
    fetchEscrowById: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
            const response = await escrowApi.getById(id);
            set({ currentEscrow: response.data, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Failed to fetch escrow',
                isLoading: false
            });
        }
    },
    refreshAll: async () => {
        set({ isLoading: true, statsLoading: true, error: null });
        try {
            const [escrowsResponse] = await Promise.all([
                escrowApi.getMyEscrows()
            ]);

            const escrows = escrowsResponse.data;
            const stats = {
                total_escrows: escrows.length,
                active_escrows: escrows.filter(e => e.status === 'Pending' || e.status === 'Funded').length,
                completed_escrows: escrows.filter(e => e.status === 'Released').length,
                disputed_escrows: escrows.filter(e => e.status === 'Disputed').length,
                total_amount: escrows.reduce((sum, e) => sum + e.amount, 0)
            };

            set({
                escrows: escrows.slice(0, 5), // Show recent 5 on dashboard
                stats,
                isLoading: false,
                statsLoading: false
            });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Failed to refresh data',
                isLoading: false,
                statsLoading: false
            });
        }
    },
}));
