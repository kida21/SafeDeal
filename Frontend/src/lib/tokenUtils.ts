/**
 * Utility functions for JWT token handling
 */

interface JWTPayload {
  exp: number;
  iat: number;
  sub: string;
  jti: string;
  iss: string;
}

/**
 * Decode JWT token without verification (for client-side expiration checking)
 */
export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    // Add padding if needed
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decoded = atob(paddedPayload);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

/**
 * Check if JWT token is expired or will expire soon
 * @param token - JWT token string
 * @param bufferMinutes - Minutes before expiration to consider token as expired (default: 2)
 */
export const isTokenExpired = (token: string, bufferMinutes: number = 2): boolean => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  const expirationWithBuffer = payload.exp - (bufferMinutes * 60);
  
  return now >= expirationWithBuffer;
};

/**
 * Get token expiration time in milliseconds
 */
export const getTokenExpiration = (token: string): number | null => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return null;
  }
  
  return payload.exp * 1000;
};

/**
 * Get time until token expires in minutes
 */
export const getTimeUntilExpiration = (token: string): number | null => {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return null;
  }
  
  const now = Date.now();
  const timeUntilExpiration = expiration - now;
  
  return Math.floor(timeUntilExpiration / (1000 * 60));
};
