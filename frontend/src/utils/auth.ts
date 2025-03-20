import { create } from "zustand";
import brain from "utils/brain-wrapper";
import { TOKEN_KEY, TOKEN_EXPIRY_KEY } from './constants';
import { toast } from "sonner";

type User = {
  email: string;
  role: string;
};

type AuthStore = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  getPasswordHint: () => Promise<string>;
  initAuthFromStorage: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (password) => {
    set({ isLoading: true, error: null });

    try {
      console.log('Attempting login with password:', password);
      
      // Use a short timeout to prevent UI freezing
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Use brain client instead of fetch for API consistency
      console.log('Sending login request to API...');
      const response = await brain.login({ password });
      
      if (!response.ok) {
        let errorMessage = 'Authentication failed';
        try {
          const data = await response.json();
          errorMessage = data.detail || errorMessage;
          console.error('Login failed with error:', errorMessage);
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        
        set({ 
          isLoading: false,
          error: errorMessage
        });
        return { 
          success: false, 
          message: errorMessage
        };
      }
      
      let data;
      try {
        data = await response.json();
        console.log('Login response successfully parsed');
      } catch (e) {
        console.error('Failed to parse response:', e);
        set({ isLoading: false, error: 'Failed to parse server response' });
        return { success: false, message: 'Server returned invalid data' };
      }
      
      if (!data.access_token) {
        console.error('Missing access token in response');
        set({ isLoading: false, error: 'Invalid server response: missing token' });
        return { success: false, message: 'Server returned invalid response' };
      }
      
      console.log('Login successful, received token');
      
      // Store token in localStorage with proper error handling
      try {
        localStorage.setItem(TOKEN_KEY, data.access_token);
        localStorage.setItem(TOKEN_EXPIRY_KEY, String(data.expires_at));
        console.log(`Token stored in localStorage, expires at: ${new Date(data.expires_at * 1000).toISOString()}`);
        
        // Verify the token works by making a verification request
        try {
          console.log('Verifying token...');
          // The brain-wrapper will automatically add the Authorization header
          const verifyResponse = await brain.verify_token();
          
          if (verifyResponse.ok) {
            console.log('Token verification successful');
          } else {
            console.warn('Token verification failed, but proceeding with login');
          }
        } catch (verifyError) {
          console.warn('Token verification error, but proceeding with login:', verifyError);
        }
      } catch (storageError) {
        console.error('Failed to store token in localStorage:', storageError);
        // Continue even if storage fails - may be in incognito mode
      }
      
      set({
        user: {
          email: 'admin@careconnect.com', // Default admin email
          role: "admin",
        },
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      return { success: true };
    } catch (error) {
      console.error("Authentication error:", error);
      set({ 
        isLoading: false,
        error: error.message || 'An error occurred during authentication'
      });
      return { 
        success: false, 
        message: "An error occurred during authentication." 
      };
    }
  },

  logout: () => {
    // Clear tokens
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    
    // Update state
    set({
      user: null,
      isAuthenticated: false,
      error: null
    });
  },

  getPasswordHint: async () => {
    try {
      console.log('Fetching password hint');
      const response = await brain.get_password_hint();
      
      if (!response.ok) {
        console.error('Error fetching password hint, status:', response.status);
        return 'Password hint not available';
      }
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error('Failed to parse hint response:', e);
        return 'Password hint not available';
      }
      
      console.log('Received password hint:', data.hint);
      return data.hint || 'Password hint not available';
    } catch (error) {
      console.error('Failed to get password hint:', error);
      return 'Password hint not available';
    }
  },

  initAuthFromStorage: () => {
    // Create a flag to prevent multiple initializations
    const initializationStarted = localStorage.getItem('auth_init_started');
    const now = Date.now();
    
    try {
      console.log('Auth initialization requested, timestamp:', now);
      
      // Check if we've already started initialization recently (within last 3 seconds)
      if (initializationStarted && (now - parseInt(initializationStarted, 10)) < 3000) {
        console.log('Auth initialization already in progress, skipping', 
          'Last start:', new Date(parseInt(initializationStarted, 10)).toISOString());
        return;
      }
      
      // Mark initialization as started
      localStorage.setItem('auth_init_started', now.toString());
      
      // Use a longer non-blocking delay to ensure other operations complete first
      console.log('Scheduling auth initialization with delay');
      
      // Wrap in setTimeout to avoid blocking the main thread
      setTimeout(() => {
        try {
          console.log('Executing auth initialization, timestamp:', Date.now());
          const token = localStorage.getItem(TOKEN_KEY);
          const tokenExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
          
          if (!token) {
            console.log('No token found in storage');
            // Explicitly set isAuthenticated to false to ensure consistent state
            set({ isAuthenticated: false });
            return;
          }
          
          // Check if token is expired
          if (tokenExpiry) {
            const expiryTime = parseInt(tokenExpiry, 10);
            if (Date.now() >= expiryTime * 1000) { // Convert to milliseconds if stored as seconds
              console.log('Token expired, removing and setting unauthenticated');
              console.log(`Token expired at: ${new Date(expiryTime * 1000).toISOString()}, current time: ${new Date().toISOString()}`);
              localStorage.removeItem(TOKEN_KEY);
              localStorage.removeItem(TOKEN_EXPIRY_KEY);
              set({ isAuthenticated: false });
              return;
            }
          }
          
          console.log('Valid token found, setting authenticated state');
          set({
            user: {
              email: 'admin@careconnect.com',
              role: "admin",
            },
            isAuthenticated: true,
            error: null
          });
          console.log('Auth initialization complete, user is authenticated');
        } catch (innerError) {
          console.error('Error during auth initialization execution:', innerError);
          // Ensure we set isAuthenticated to false on errors
          set({ isAuthenticated: false, error: 'Authentication initialization failed' });
        } finally {
          // Clear the initialization flag after completion, regardless of success/failure
          localStorage.removeItem('auth_init_started');
        }
      }, 500); // Longer delay to ensure other operations complete first
    } catch (error) {
      console.error('Error in initAuthFromStorage outer block:', error);
      // Clear the initialization flag on errors
      localStorage.removeItem('auth_init_started');
      // Ensure we set isAuthenticated to false on errors
      set({ isAuthenticated: false, error: 'Authentication initialization failed' });
    }
  }
}));
