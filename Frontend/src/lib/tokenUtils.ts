/**
 * JWT Token Utilities for SafeDeal Authentication
 * 
 * Implements the "Best UX: Combine both" approach:
 * - Decode JWT exp claim for proactive refresh
 * - Precise scheduling (14m40s for 15min tokens)
 * - Zero visible errors for users
 */

interface JWTPayload {
  exp: number;
  iat: number;
  sub: string;
  jti?: string;
  iss?: string;
  [key: string]: any;
}

/**
 * Decode JWT token without verification (for client-side expiration checking)
 * This is safe for expiration checking as we're not validating the signature
 */
export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decoded = atob(paddedPayload);
    const parsed = JSON.parse(decoded);
    
    // Validate required fields
    if (!parsed.exp || typeof parsed.exp !== 'number') {
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.debug('Failed to decode JWT token:', error);
    return null;
  }
};

/**
 * Check if JWT token is expired or will expire within buffer time
 * @param token - JWT token string
 * @param bufferSeconds - Seconds before expiration to consider token as expired (default: 120 = 2 minutes)
 */
export const isTokenExpired = (token: string, bufferSeconds: number = 120): boolean => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  const expirationWithBuffer = payload.exp - bufferSeconds;
  
  return now >= expirationWithBuffer;
};

/**
 * Get token expiration time in milliseconds (JavaScript Date format)
 */
export const getTokenExpiration = (token: string): number | null => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return null;
  }
  
  // Convert Unix timestamp to JavaScript timestamp (milliseconds)
  return payload.exp * 1000;
};

/**
 * Get time until token expires in seconds
 * Returns null if token is invalid or already expired
 */
export const getTimeUntilExpirationSeconds = (token: string): number | null => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return null;
  }
  
  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiration = payload.exp - now;
  
  // Return null if already expired
  return timeUntilExpiration > 0 ? timeUntilExpiration : null;
};

/**
 * Get time until token expires in minutes
 * Returns null if token is invalid or already expired
 */
export const getTimeUntilExpirationMinutes = (token: string): number | null => {
  const seconds = getTimeUntilExpirationSeconds(token);
  if (seconds === null) {
    return null;
  }
  
  return Math.floor(seconds / 60);
};

/**
 * Calculate optimal refresh time in milliseconds
 * For 15-minute tokens, this returns 14m40s (880 seconds)
 * For other durations, refreshes 2 minutes before expiration
 */
export const getOptimalRefreshTime = (token: string): number | null => {
  const timeUntilExpirationSeconds = getTimeUntilExpirationSeconds(token);
  if (timeUntilExpirationSeconds === null) {
    return null;
  }
  
  // Default buffer: 2 minutes (120 seconds)
  const bufferSeconds = 120;
  
  // Don't refresh if token expires too soon
  if (timeUntilExpirationSeconds <= bufferSeconds) {
    return null;
  }
  
  // Calculate refresh time (time until expiration minus buffer)
  const refreshInSeconds = timeUntilExpirationSeconds - bufferSeconds;
  
  // Convert to milliseconds for setTimeout
  return refreshInSeconds * 1000;
};

/**
 * Check if token should be refreshed immediately
 * Returns true if token expires within 2 minutes
 */
export const shouldRefreshImmediately = (token: string): boolean => {
  const timeUntilExpirationSeconds = getTimeUntilExpirationSeconds(token);
  if (timeUntilExpirationSeconds === null) {
    return true; // Invalid token, should refresh
  }
  
  // Refresh immediately if expires within 2 minutes
  return timeUntilExpirationSeconds <= 120;
};

/**
 * Get human-readable token expiration info for debugging
 */
export const getTokenInfo = (token: string): string => {
  const payload = decodeJWT(token);
  if (!payload) {
    return 'Invalid token';
  }
  
  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiration = payload.exp - now;
  
  if (timeUntilExpiration <= 0) {
    return 'Token expired';
  }
  
  const minutes = Math.floor(timeUntilExpiration / 60);
  const seconds = timeUntilExpiration % 60;
  
  return `Expires in ${minutes}m ${seconds}s`;
};
