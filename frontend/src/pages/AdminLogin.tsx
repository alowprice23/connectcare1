import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import brain from "utils/brain-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster, toast } from "sonner";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordHint, setPasswordHint] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Fetch password hint on component mount
  useEffect(() => {
    getPasswordHint();
  }, []);

  // Function to get password hint
  const getPasswordHint = async () => {
    try {
      console.log("Fetching password hint...");
      const response = await brain.get_password_hint();
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Password hint error:", errorText);
        throw new Error("Failed to get password hint");
      }
      
      const data = await response.json();
      console.log("Received password hint:", data);
      setPasswordHint(data.hint);
    } catch (error) {
      console.error("Error fetching password hint:", error);
      toast.error("Failed to get password hint. Please try again later.");
    }
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log(`Attempting login with password length: ${password.length}`);
      
      const response = await brain.login({ password });
      console.log("Login response status:", response.status);
      
      // Handle non-JSON responses
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        throw new Error("Unexpected response from server");
      }
      
      // Handle error responses
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.detail || "Login failed";
        console.error("Login error data:", errorData);
        throw new Error(errorMessage);
      }
      
      // Parse successful response
      const data = await response.json();
      console.log("Login successful, received token data");
      
      // Store token in local storage
      localStorage.setItem("adminToken", data.access_token);
      localStorage.setItem("tokenExpiry", data.expires_at.toString());
      
      toast.success("Login successful!");
      
      // Redirect to admin dashboard
      navigate("/AdminDashboard");
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate current date for debugging display
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const historicalYear = currentYear - 42;

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50">
      <Toaster position="top-right" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>
            Enter the dynamic password to access the admin dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <div className="flex flex-col space-y-2">
                <label htmlFor="password" className="font-medium text-sm">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              
              {passwordHint && (
                <div className="text-sm bg-blue-50 p-2 rounded border border-blue-100">
                  <strong>Hint:</strong> {passwordHint}
                </div>
              )}
              
              {error && (
                <div className="text-sm bg-red-50 p-2 rounded border border-red-100 text-red-700">
                  {error}
                </div>
              )}
              
              {/* Debug info - remove in production */}
              <div className="text-xs text-gray-400 mt-4">
                <p>Current year: {currentYear}</p>
                <p>Historical year (42 years ago): {historicalYear}</p>
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="ghost" onClick={getPasswordHint} disabled={isLoading}>
            Forgot password? Get a hint
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
