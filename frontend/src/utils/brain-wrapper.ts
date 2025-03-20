import brain from "brain";
import { TOKEN_KEY, TOKEN_EXPIRY_KEY } from './constants';

/**
 * BrainClientWrapper - A wrapper around the brain client that automatically adds auth headers
 * to authenticated requests and provides token validation/management
 */
class BrainClientWrapper {
  private initialized = false;
  
  /**
   * Get auth headers from localStorage if available
   */
  private getAuthHeaders(): Record<string, string> {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        console.log('No auth token found in storage');
        return {};
      }
      
      // Check token expiration
      const tokenExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
      if (tokenExpiry) {
        const expiryTime = parseInt(tokenExpiry, 10);
        if (Date.now() >= expiryTime * 1000) { // Convert to milliseconds if stored as seconds
          console.log('Token expired, not including in headers');
          return {};
        }
      }
      
      return {
        Authorization: `Bearer ${token}`
      };
    } catch (error) {
      console.error('Error getting auth headers:', error);
      return {};
    }
  }
  
  /**
   * Check if a URL should include auth headers
   */
  private shouldInterceptUrl(url: string): boolean {
    // Only add auth headers to our API requests
    return url.includes('/api/') && 
           // Skip auth endpoints to avoid circular auth issues
           !url.includes('/api/auth/login') &&
           !url.includes('/api/auth/password-hint');
  }
  
  /**
   * Wrap all brain client methods to include auth headers
   */
  constructor() {
    // Skip initialization in SSR context (no window)
    if (typeof window === 'undefined') return;
    
    // Prevent multiple initializations
    if (this.initialized) return;
    this.initialized = true;
    
    console.log('Initializing BrainClientWrapper');
    
    // Intercept all fetch requests from the brain client
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      // Extract URL from various input types
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      
      // Only intercept requests to our API (except login)
      if (this.shouldInterceptUrl(url)) {
        console.log(`Intercepting request to ${url.split('?')[0]}`); // Log only path without query params
        
        // Add auth headers to the request
        const headers = this.getAuthHeaders();
        
        // Only add headers if we have any
        if (Object.keys(headers).length > 0) {
          // Merge with existing headers
          const newInit = {
            ...init,
            headers: {
              ...init?.headers,
              ...headers
            }
          };
          
          console.log('Adding auth headers to request');
          return originalFetch(input, newInit);
        }
      }
      
      // Pass through other requests unchanged
      return originalFetch(input, init);
    };
    
    console.log('Fetch interceptor initialized');
  }
}

// Initialize the wrapper
const brainWrapper = new BrainClientWrapper();

// Export the original brain client which will now use the intercepted fetch
export default brain;
