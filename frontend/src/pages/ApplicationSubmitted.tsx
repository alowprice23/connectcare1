import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "components/Button";
import { CheckCircle, Home } from "lucide-react";

export default function ApplicationSubmitted() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4 py-8 bg-white shadow-lg rounded-lg">
        <div className="text-center">
          <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Application Submitted!</h1>
          
          <p className="mt-4 text-gray-600">
            Thank you for applying to join our CareConnect team. We've received your application and our team will review it shortly.
          </p>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h2 className="font-medium text-blue-800 mb-2">What happens next?</h2>
            <ol className="text-left text-sm text-blue-700 space-y-2">
              <li className="flex items-start">
                <span className="font-bold mr-2">1.</span>
                <span>Our team will review your application (typically within 1-2 business days)</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">2.</span>
                <span>You'll receive an email to schedule a brief phone interview</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">3.</span>
                <span>We'll conduct background verification and check references</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">4.</span>
                <span>Once approved, you'll be added to our scheduling system</span>
              </li>
            </ol>
          </div>
          
          <div className="mt-8 space-y-4">
            <Button
              onClick={() => navigate("/")}
              className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Home className="h-4 w-4 mr-2" />
              Return to Home
            </Button>
            
            <p className="text-sm text-gray-500">
              If you have any questions, please contact us at <a href="mailto:support@careconnect.com" className="text-blue-600 hover:underline">support@careconnect.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}