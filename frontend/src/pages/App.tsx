import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageTurningAnimation } from "components/PageTurningAnimation";
import { Button } from "components/Button";
import { Puzzle, Clock, Users, MapPin, Heart } from "lucide-react";
import { useAuthStore } from "utils/auth";
import { useUserRoutes } from "utils/user-routes";
import { Toaster } from "sonner";
import { initializeLocalStorage } from "utils/localStorageDb";
import "utils/brain-wrapper"; // Import brain wrapper to initialize auth interceptor

// Initialize LocalStorage database
initializeLocalStorage();

export default function App() {
  const navigate = useNavigate();
  const { initAuthFromStorage } = useAuthStore();
  
  // Initialize auth state on mount, not during module load
  useEffect(() => {
    console.log('App initializing...');
    // Small delay to prevent blocking UI
    const initTimer = setTimeout(() => {
      console.log('Starting auth initialization');
      initAuthFromStorage().catch(err => {
        console.error('Error initializing auth:', err);
      }).finally(() => {
        console.log('Auth initialization complete');
      });
    }, 100);
    
    return () => clearTimeout(initTimer);
  }, [initAuthFromStorage]);
  
  // Initialize route protection
  useUserRoutes();
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Toaster for notifications */}
      <Toaster />
      
      {/* Header */}
      <header className="py-6 px-8 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Puzzle className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">CareConnect <span className="text-blue-600">Tetris</span></h1>
        </div>
        <nav>
          <ul className="flex space-x-6">
            <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">About</a></li>
            <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a></li>
            <li>
              <Button
                variant="link"
                className="text-blue-600 hover:text-blue-800 transition-colors font-medium p-0 h-auto"
                onClick={() => navigate("/caregiver-application")}
              >
                Apply Now
              </Button>
            </li>
            <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Contact</a></li>
          </ul>
        </nav>
      </header>

      {/* Hero Section */}
      <PageTurningAnimation className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
          <div className="flex flex-col justify-center space-y-6">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-800 leading-tight">
              Revolutionizing <span className="text-blue-600">Healthcare Scheduling</span> with Precision
            </h2>
            <p className="text-lg text-gray-600">
              CareConnect Tetris seamlessly matches caregivers with clients using our innovative Tetris-inspired scheduling system. We optimize care delivery while ensuring the perfect fit for both caregivers and clients.
            </p>
            <div className="pt-4 flex space-x-4">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md px-6 py-3 shadow-lg transform transition hover:scale-105"
                onClick={() => navigate("/caregiver-application")}
              >
                Apply to Become a Caregiver
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold rounded-md px-6 py-3"
                onClick={() => navigate("/login")}
              >
                Staff Login
              </Button>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="absolute -z-10 w-72 h-72 bg-blue-200 rounded-full opacity-70 blur-3xl"></div>
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md border border-gray-100 transform rotate-1">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Scheduling Preview</h3>
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 cursor-pointer">
                  ?
                </div>
              </div>
              <div className="space-y-3">
                {/* Simplified Tetris-style blocks */}
                <div className="flex space-x-2">
                  <div className="h-10 bg-blue-500 rounded-md flex-grow"></div>
                  <div className="h-10 bg-green-500 rounded-md w-1/4"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-10 bg-yellow-500 rounded-md w-1/3"></div>
                  <div className="h-10 bg-purple-500 rounded-md flex-grow"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-10 bg-red-500 rounded-md w-2/3"></div>
                  <div className="h-10 bg-blue-500 rounded-md flex-grow"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageTurningAnimation>

      {/* Features Section */}
      <section className="py-16 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">How CareConnect Tetris Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Caregiver Matching</h3>
              <p className="text-gray-600">Our system matches caregivers with clients based on skills, availability, and location.</p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Puzzle className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Tetris Scheduling</h3>
              <p className="text-gray-600">Our unique scheduling system optimizes shifts like pieces in a Tetris game.</p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Location-Based</h3>
              <p className="text-gray-600">We use geographic data to find caregivers closest to clients' locations.</p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Always Optimizing</h3>
              <p className="text-gray-600">Our system continuously re-optimizes schedules every 5 minutes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-8 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Join Our Network of Caregivers</h2>
          <p className="text-xl opacity-90 mb-8">Make a difference in people's lives while enjoying flexible hours and competitive pay.</p>
          <Button 
            className="bg-white text-blue-700 hover:bg-gray-100 font-semibold rounded-md px-8 py-4 shadow-lg transform transition hover:scale-105"
            onClick={() => navigate("/caregiver-application")}
          >
            Apply Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Heart className="h-6 w-6 text-blue-600" />
            <p className="text-gray-600">© 2025 CareConnect Tetris. All rights reserved.</p>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-500 hover:text-blue-600">Privacy Policy</a>
            <a href="#" className="text-gray-500 hover:text-blue-600">Terms of Service</a>
            <a href="#" className="text-gray-500 hover:text-blue-600">Contact</a>
            <Button
              variant="link"
              className="text-gray-500 hover:text-blue-600 p-0 h-auto"
              onClick={() => navigate("/AdminLogin")}
            >
              Admin Login
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
