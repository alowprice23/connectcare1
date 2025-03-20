import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { ProtectedRoute } from 'components/ProtectedRoute';
import { useAuthStore } from 'utils/auth';

// This component will be rendered by the router for each route
// We'll use it to apply route protection where needed
export const useUserRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, initAuthFromStorage } = useAuthStore();
  
  useEffect(() => {
    // Initialize authentication from storage
    initAuthFromStorage();
  }, []);
  
  useEffect(() => {
    // If user is not authenticated and tries to access protected routes, redirect to login
    if (location.pathname === '/AdminDashboard' && !isAuthenticated) {
      console.log('Unauthorized access to AdminDashboard detected, redirecting to login');
      navigate('/AdminLogin', { state: { from: location }, replace: true });
    }
  }, [location.pathname, isAuthenticated, navigate, location]);
  
  return null;
};

// This component wraps the content of Admin page to protect it
export const AdminWrapper = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);
