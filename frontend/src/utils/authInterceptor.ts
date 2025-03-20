/**
 * Authentication Interceptor for Brain Client
 * 
 * This interceptor handles authentication tokens for API requests,
 * automatically attaching auth headers and handling token expiration.
 */

import { RequestParams } from "../brain/http-client";

// Token storage keys
const TOKEN_KEY = "adminToken";
const TOKEN_EXPIRY_KEY = "tokenExpiry";

/**
 * Check if the authentication token is valid and not expired
 */
export const isTokenValid = (): boolean => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiryString = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (!token || !expiryString) {
      console.log("No token or expiry found in storage");
      return false;
    }
    
    const expiry = parseInt(expiryString, 10);
    const now = Math.floor(Date.now() / 1000); // current time in seconds
    
    // Check if token is expired (with 5 minute buffer)
    if (expiry - now < 300) {
      console.log("Token is expired or about to expire");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error checking token validity:", error);
    return false;
  }
};

/**
 * Clear authentication tokens from storage
 */
export const clearAuthTokens = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

/**
 * Get the authentication token from storage
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Add authentication headers to request params if a token is present
 */
export const addAuthHeaders = (params: RequestParams): RequestParams => {
  const token = getAuthToken();
  
  if (!token) {
    return params;
  }
  
  return {
    ...params,
    headers: {
      ...params.headers,
      Authorization: `Bearer ${token}`,
    },
  };
};

/**
 * Initialize authentication state on app startup
 */
export const initializeAuth = (): void => {
  console.log("Auth initialization requested, timestamp:\n" + Date.now());
  
  // Set a small delay to ensure storage is loaded
  setTimeout(() => {
    console.log("Executing auth initialization, timestamp:\n" + Date.now());
    
    // Check token validity
    if (!isTokenValid()) {
      console.log("No token found in storage");
      clearAuthTokens();
      return;
    }
    
    console.log("Valid token found in storage");
  }, 1000);
};
