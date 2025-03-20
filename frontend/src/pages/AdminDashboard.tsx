import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import brain from "utils/brain-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster, toast } from "sonner";
import { useAuthStore } from "utils/auth";
import { TOKEN_KEY, TOKEN_EXPIRY_KEY } from "utils/constants";

interface VerifyTokenResponse {
  valid: boolean;
  username: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<VerifyTokenResponse | null>(null);
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    // First, check the auth store state
    if (!isAuthenticated) {
      console.log("Not authenticated according to auth store, checking tokens directly");
      
      // Double-check tokens as fallback
      const token = localStorage.getItem(TOKEN_KEY);
      const tokenExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
      
      if (!token || !tokenExpiry) {
        console.log("No tokens found in localStorage");
        toast.error("You must be logged in to access this page");
        navigate("/AdminLogin");
        return;
      }
      
      // Check if the token is expired
      const expiryTime = parseInt(tokenExpiry, 10) * 1000; // Convert to milliseconds
      if (Date.now() > expiryTime) {
        console.log("Token is expired");
        // Token expired, clear local storage and redirect to login
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
        toast.error("Your session has expired. Please log in again.");
        navigate("/AdminLogin");
        return;
      }
      
      console.log("Token exists and is not expired, but auth store says not authenticated. Proceeding with verification.");
    }

    // Verify the token with the backend
    const verifyToken = async () => {
      try {
        console.log("Verifying token with backend...");
        const response = await brain.verify_token();
        
        if (!response.ok) {
          throw new Error(`Token verification failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Token verification response:", data);
        
        if (data.valid) {
          setUserData(data);
          console.log("Token verified successfully");
        } else {
          throw new Error("Invalid token response from server");
        }
      } catch (error) {
        console.error("Token verification error:", error);
        toast.error("Authentication failed. Please log in again.");
        logout(); // Use auth store logout to clear tokens and state
        navigate("/AdminLogin");
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [navigate, isAuthenticated, logout]);

  const handleLogout = () => {
    // Use the auth store logout function
    logout();
    toast.success("Logged out successfully");
    navigate("/AdminLogin");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50">
        <div className="text-center space-y-4">
          <p className="text-xl font-medium">Loading dashboard...</p>
          <p className="text-sm text-gray-500">Verifying your session</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col p-4 bg-slate-50">
      <Toaster position="top-right" />
      
      <header className="flex justify-between items-center mb-6 p-4 bg-white rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold">CareConnect Admin Dashboard</h1>
        <Button onClick={handleLogout}>Logout</Button>
      </header>
      
      <main className="flex-1 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Admin Information</CardTitle>
            <CardDescription>Your current session information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Username:</strong> {userData?.username || "Admin"}</p>
              <p><strong>Last Verified:</strong> {userData?.timestamp ? new Date(userData.timestamp).toLocaleString() : "Unknown"}</p>
              <p><strong>Password Formula:</strong> "banana" + [year from 42 years ago]</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Unstable Clients</CardTitle>
            <CardDescription>Manage client stability issues</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">View Clients</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Available Caregivers</CardTitle>
            <CardDescription>Manage caregiver availability</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">View Caregivers</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>New Client Referrals</CardTitle>
            <CardDescription>Review and process new client referrals</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">View Referrals</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>New Applicants</CardTitle>
            <CardDescription>Review and process new caregiver applications</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">View Applicants</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Tetris Scheduling</CardTitle>
            <CardDescription>Access the caregiver-client matching engine</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Open Scheduler</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
