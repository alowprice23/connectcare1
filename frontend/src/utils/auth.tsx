import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";

/**
 * Hook to check if the user is authenticated
 * @param redirectTo Path to redirect to if not authenticated
 */
export const useAuth = (redirectTo: string = "/AdminLogin") => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the user is authenticated
    const token = localStorage.getItem("adminToken");
    const tokenExpiry = localStorage.getItem("tokenExpiry");
    
    if (!token || !tokenExpiry) {
      // No token found, redirect to login
      toast.error("You must be logged in to access this page");
      navigate(redirectTo);
      return;
    }
    
    // Check if the token is expired
    const expiryTime = parseInt(tokenExpiry, 10) * 1000; // Convert to milliseconds
    if (Date.now() > expiryTime) {
      // Token expired, clear local storage and redirect to login
      localStorage.removeItem("adminToken");
      localStorage.removeItem("tokenExpiry");
      toast.error("Your session has expired. Please log in again.");
      navigate(redirectTo);
    }
  }, [navigate, redirectTo]);

  return {
    getAuthHeaders: () => {
      const token = localStorage.getItem("adminToken");
      return {
        Authorization: `Bearer ${token}`,
      };
    },
    isAuthenticated: () => {
      const token = localStorage.getItem("adminToken");
      const tokenExpiry = localStorage.getItem("tokenExpiry");
      
      if (!token || !tokenExpiry) {
        return false;
      }
      
      const expiryTime = parseInt(tokenExpiry, 10) * 1000; // Convert to milliseconds
      return Date.now() <= expiryTime;
    },
    logout: () => {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("tokenExpiry");
      toast.success("Logged out successfully");
      navigate(redirectTo);
    }
  };
};

/**
 * Component to wrap protected routes
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute = ({ children, redirectTo = "/AdminLogin" }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuth(redirectTo);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate(redirectTo);
    }
  }, [isAuthenticated, navigate, redirectTo]);

  return (
    <>
      <Toaster position="top-right" />
      {children}
    </>
  );
};
