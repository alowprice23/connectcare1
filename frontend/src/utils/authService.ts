import brain from 'brain';

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_at: number;
}

interface LoginRequest {
  password: string;
}

interface AuthHint {
  hint: string;
}

class AuthService {
  private TOKEN_KEY = 'auth_token';
  private EXPIRY_KEY = 'auth_expiry';
  
  /**
   * Login with dynamic password
   */
  async login(password: string): Promise<LoginResponse> {
    const request: LoginRequest = { password };
    
    const response = await brain.login(request);
    const data = await response.json() as LoginResponse;
    
    // Store token in localStorage
    localStorage.setItem(this.TOKEN_KEY, data.access_token);
    localStorage.setItem(this.EXPIRY_KEY, String(data.expires_at));
    
    return data;
  }
  
  /**
   * Check if user is logged in with valid token
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const expiry = localStorage.getItem(this.EXPIRY_KEY);
    
    if (!token || !expiry) {
      return false;
    }
    
    // Check if token is expired
    const expiryTime = parseInt(expiry, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    
    return currentTime < expiryTime;
  }
  
  /**
   * Get the current auth token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
  
  /**
   * Log out by removing token
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.EXPIRY_KEY);
  }
  
  /**
   * Get a hint for the dynamic password
   */
  async getPasswordHint(): Promise<string> {
    const response = await brain.get_password_hint();
    const data = await response.json() as AuthHint;
    return data.hint;
  }
}

export const authService = new AuthService();
