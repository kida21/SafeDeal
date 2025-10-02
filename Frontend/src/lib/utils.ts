import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'ETB'): string {
    return new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}

// Server time offset (difference between server and client time)
let serverTimeOffset = 0;

// Function to set server time offset based on server response
export function setServerTimeOffset(serverTimestamp: string | Date) {
    const serverTime = new Date(serverTimestamp).getTime();
    const clientTime = new Date().getTime();
    serverTimeOffset = serverTime - clientTime;
}

// Get current server time based on offset
export function getServerTime(): Date {
    return new Date(new Date().getTime() + serverTimeOffset);
}

// Format relative time based on server time
export function formatRelativeTimeFromServer(date: string | Date, serverCurrentTime?: Date): string {
    const now = serverCurrentTime || getServerTime();
    const targetDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'Just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
        return formatDate(date);
    }
}

// Legacy function for backward compatibility (uses client time)
export function formatRelativeTime(date: string | Date): string {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'Just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
        return formatDate(date);
    }
}

export function truncateAddress(address: string, startLength: number = 6, endLength: number = 4): string {
    if (address.length <= startLength + endLength) {
        return address;
    }
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

export function getStatusColor(status: string | undefined | null): string {
    if (!status) {
        return 'text-gray-600 bg-gray-100';
    }
    
    switch (status.toLowerCase()) {
        case 'pending':
            return 'text-yellow-600 bg-yellow-100';
        case 'funded':
        case 'completed':
            return 'text-green-600 bg-green-100';
        case 'released':
            return 'text-blue-600 bg-blue-100';
        case 'disputed':
            return 'text-red-600 bg-red-100';
        case 'failed':
            return 'text-red-600 bg-red-100';
        default:
            return 'text-gray-600 bg-gray-100';
    }
}

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

export function generateId(): string {
    return Math.random().toString(36).substr(2, 9);
}

export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
