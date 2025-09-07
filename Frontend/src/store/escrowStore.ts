import { create } from 'zustand';
import { Escrow } from '../types';

interface EscrowState {
    escrows: Escrow[];
    currentEscrow: Escrow | null;
    isLoading: boolean;
    setEscrows: (escrows: Escrow[]) => void;
    addEscrow: (escrow: Escrow) => void;
    updateEscrow: (id: number, updates: Partial<Escrow>) => void;
    setCurrentEscrow: (escrow: Escrow | null) => void;
    setLoading: (loading: boolean) => void;
}

export const useEscrowStore = create<EscrowState>((set) => ({
    escrows: [],
    currentEscrow: null,
    isLoading: false,
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
}));
