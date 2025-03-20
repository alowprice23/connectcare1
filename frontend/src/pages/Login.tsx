import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "utils/auth";
import { Button } from "@/components/ui/button";
import { HelpCircle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, error, getPasswordHint } = useAuthStore();
  const [password, setPassword] = useState("");
  const [hint, setHint] = useState("");
  const [hintLoading, setHintLoading] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  
  // Initialize automatically with password hint for better UX - with proper debouncing
  useEffect(() => {
    console.log('Login component mounted, timestamp:', Date.now());
    
    // Only load hint if we're not already authenticated 
    // and don't have the hint already to prevent unnecessary API calls
    if (!isAuthenticated && !hint) {
      // Add longer delay to avoid potential race conditions
      const timer = setTimeout(() => {
        console.log('Delayed password hint loading triggered');
        loadHint();
      }, 800);  // Much longer delay to ensure auth has time to initialize
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, hint]);
  
  // If already authenticated, redirect to admin dashboard or the page they were trying to access
  useEffect(() => {
    console.log('Authentication status changed, isAuthenticated:', isAuthenticated, 'timestamp:', Date.now());
    if (isAuthenticated) {
      console.log('Redirecting to admin due to authentication');
      const returnPath = location.state?.from?.pathname || "/admin";
      // Add a small delay to avoid potential race conditions
      setTimeout(() => {
        navigate(returnPath, { replace: true });
      }, 100);
    }
  }, [isAuthenticated, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      toast.error("Please enter a password.");
      return;
    }
    
    setLoggingIn(true);
    // First show a toast indicating login in progress
    toast.loading("Logging in...", { id: "login-toast" });
    
    try {
      console.log('Executing login with password, timestamp:', Date.now());
      // Small delay to prevent UI freezing
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const result = await login(password);
      
      // Dismiss loading toast
      toast.dismiss("login-toast");
      
      if (!result.success && result.message) {
        toast.error(result.message);
      } else if (result.success) {
        toast.success("Login successful!");
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.dismiss("login-toast");
      toast.error("An unexpected error occurred during login.");
    } finally {
      setLoggingIn(false);
    }
  };

  // Using a properly debounced load hint function
  const loadHint = async () => {
    // Prevent duplicate calls if already loading
    if (hintLoading) {
      console.log('Password hint already loading, skipping request');
      return;
    }
    
    // Check if we already have a hint to prevent unnecessary API calls
    if (hint) {
      console.log('Password hint already loaded, skipping request');
      return;
    }
    
    setHintLoading(true);
    try {
      console.log('Requesting password hint, timestamp:', Date.now());
      const hintText = await getPasswordHint();
      if (hintText && hintText !== 'Password hint not available') {
        setHint(hintText);
        
        // Extract the year from the hint and create a suggested password
        const yearMatch = hintText.match(/\d{4}/);
        if (yearMatch && yearMatch[0]) {
          const year = yearMatch[0];
          // Just log it but don't auto-fill for security
          console.log(`Hint suggests the year component is: ${year}`);
          // Don't set password automatically for security reasons
        }
      }
    } catch (err) {
      console.error('Failed to load password hint:', err);
      // No toast here to avoid confusion on load
    } finally {
      setHintLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md p-6 bg-white shadow-lg rounded-lg">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">CareConnect Tetris</h1>
            <p className="text-gray-500">Admin Access</p>
          </div>
          
          <Separator />
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={loadHint}
                        disabled={hintLoading}
                      >
                        {hintLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <HelpCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{hint || 'Click for password hint'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter the dynamic password"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loggingIn || !password}
            >
              {loggingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>
          
          {hint && (
            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-600">
              <p>Hint: {hint}</p>
            </div>
          )}
          
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              <p>Error: {error}</p>
            </div>
          )}
          
          <div className="mt-4 text-center text-sm text-gray-500">
            <p>This is the admin portal for CareConnect Tetris.</p>
            <p>Only authorized personnel should proceed.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
