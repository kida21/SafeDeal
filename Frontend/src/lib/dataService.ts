import { Escrow, User } from '../types';
import { escrowApi, userApi } from './api';

// Mock data for demonstration - in a real app, this would come from a proper list endpoint
const MOCK_ESCROW_IDS = [1, 2, 3, 4, 5]; // These would be fetched from a list endpoint

export interface EscrowStats {
    total_escrows: number;
    active_escrows: number;
    completed_escrows: number;
    disputed_escrows: number;
    total_amount: number;
}

export class DataService {
    private static escrowCache = new Map<number, Escrow>();
    private static userCache = new Map<number, User>();
    private static statsCache: EscrowStats | null = null;
    private static lastFetch = 0;
    private static CACHE_DURATION = 30000; // 30 seconds

    // Get user profile with caching
    static async getUserProfile(): Promise<User> {
        try {
            const response = await userApi.getProfile();
            const user = response.data;
            this.userCache.set(user.id, user);
            return user;
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            throw error;
        }
    }

    // Get escrows with caching and mock data simulation
    static async getEscrows(limit: number = 5): Promise<Escrow[]> {
        try {
            // In a real app, this would be a single API call to get all escrows
            // For now, we'll simulate by trying to fetch known escrow IDs
            const escrows: Escrow[] = [];

            // Try to fetch escrows by ID (this simulates what would happen with a real list endpoint)
            for (const id of MOCK_ESCROW_IDS.slice(0, limit)) {
                try {
                    if (this.escrowCache.has(id)) {
                        escrows.push(this.escrowCache.get(id)!);
                    } else {
                        const response = await escrowApi.getById(id);
                        const escrow = response.data;
                        this.escrowCache.set(id, escrow);
                        escrows.push(escrow);
                    }
                } catch (error) {
                    // Escrow doesn't exist or user doesn't have access
                    console.log(`Escrow ${id} not found or no access`);
                }
            }

            return escrows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } catch (error) {
            console.error('Failed to fetch escrows:', error);
            throw error;
        }
    }

    // Calculate stats from escrows
    static async getEscrowStats(): Promise<EscrowStats> {
        const now = Date.now();

        // Return cached stats if still valid
        if (this.statsCache && (now - this.lastFetch) < this.CACHE_DURATION) {
            return this.statsCache;
        }

        try {
            const escrows = await this.getEscrows(50); // Get more escrows for stats calculation

            const stats: EscrowStats = {
                total_escrows: escrows.length,
                active_escrows: escrows.filter(e => e.status === 'Pending' || e.status === 'Funded').length,
                completed_escrows: escrows.filter(e => e.status === 'Released').length,
                disputed_escrows: escrows.filter(e => e.status === 'Disputed').length,
                total_amount: escrows
                    .filter(e => e.status === 'Released')
                    .reduce((sum, e) => sum + e.amount, 0)
            };

            this.statsCache = stats;
            this.lastFetch = now;
            return stats;
        } catch (error) {
            console.error('Failed to calculate escrow stats:', error);
            throw error;
        }
    }

    // Get specific escrow by ID
    static async getEscrowById(id: number): Promise<Escrow> {
        try {
            if (this.escrowCache.has(id)) {
                return this.escrowCache.get(id)!;
            }

            const response = await escrowApi.getById(id);
            const escrow = response.data;
            this.escrowCache.set(id, escrow);
            return escrow;
        } catch (error) {
            console.error(`Failed to fetch escrow ${id}:`, error);
            throw error;
        }
    }

    // Clear cache
    static clearCache(): void {
        this.escrowCache.clear();
        this.userCache.clear();
        this.statsCache = null;
        this.lastFetch = 0;
    }

    // Refresh all data
    static async refreshAll(): Promise<{ user: User; escrows: Escrow[]; stats: EscrowStats }> {
        this.clearCache();

        const [user, escrows, stats] = await Promise.all([
            this.getUserProfile(),
            this.getEscrows(),
            this.getEscrowStats()
        ]);

        return { user, escrows, stats };
    }
}
