import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "components/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PersonalInformationStep } from "components/PersonalInformationStep";
import { PageTurningAnimation } from "components/PageTurningAnimation";
import { ExperienceStep } from "components/ExperienceStep";
import { AvailabilityStep } from "components/AvailabilityStep";
import { LocationStep } from "components/LocationStep";
import { ReferencesStep } from "components/ReferencesStep";
import { ReviewStep } from "components/ReviewStep";

// Types for our form data
export interface CaregiverFormData {
  // Personal Details
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  
  // Experience & Qualifications
  yearsExperience: string;
  certifications: string[];
  education: string;
  skills: string[];
  
  // Availability
  availableDays: string[];
  availableHours: {
    startTime: string;
    endTime: string;
  };
  maxClientsPerWeek: number;
  preferredHoursPerWeek: number;
  
  // Location
  serviceRadius: number;
  preferredLocations: string[];
  transportation: string;
  
  // References
  references: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
  }[];
}

// Initial empty form data
const initialFormData: CaregiverFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  
  yearsExperience: "",
  certifications: [],
  education: "",
  skills: [],
  
  availableDays: [],
  availableHours: {
    startTime: "",
    endTime: "",
  },
  maxClientsPerWeek: 0,
  preferredHoursPerWeek: 0,
  
  serviceRadius: 0,
  preferredLocations: [],
  transportation: "",
  
  references: [
    {
      name: "",
      relationship: "",
      phone: "",
      email: "",
    },
  ],
};

// Define the steps of our form
const formSteps = [
  { id: "personal", title: "Personal Information" },
  { id: "experience", title: "Experience & Qualifications" },
  { id: "availability", title: "Availability" },
  { id: "location", title: "Service Location" },
  { id: "references", title: "References" },
  { id: "review", title: "Review & Submit" },
];

export default function CaregiverApplication() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<CaregiverFormData>(initialFormData);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  // Handle form data changes
  const updateFormData = (data: Partial<CaregiverFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);

  // Navigation functions
  const goToNextStep = () => {
    if (currentStep < formSteps.length - 1) {
      setDirection("forward");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 500); // Match this with animation duration
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setDirection("backward");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 500); // Match this with animation duration
    } else {
      // If on first step, navigate back to home
      navigate("/");
    }
  };

  const handleSubmit = () => {
    // Here we would submit the form data to the backend
    console.log("Form submitted:", formData);
    // After successful submission, navigate to a confirmation page
    navigate("/application-submitted");
  };

  // Determine if we can proceed to the next step (basic validation)
  const canProceed = () => {
    const step = formSteps[currentStep];
    
    switch(step.id) {
      case "personal":
        // Check if all required personal fields are filled
        return (
          formData.firstName.trim() !== "" &&
          formData.lastName.trim() !== "" &&
          formData.email.trim() !== "" &&
          formData.phone.trim() !== "" &&
          formData.dateOfBirth.trim() !== "" &&
          formData.address.trim() !== "" &&
          formData.city.trim() !== "" &&
          formData.state.trim() !== "" &&
          formData.zip.trim() !== ""
        );
      case "experience":
        // Check if required experience fields are filled
        return (
          formData.yearsExperience.trim() !== "" &&
          formData.education.trim() !== ""
          // Not requiring certifications or skills as they may be optional
        );
      case "availability":
        // Check required availability fields
        return (
          formData.availableDays.length > 0 &&
          formData.availableHours.startTime !== "" &&
          formData.availableHours.endTime !== "" &&
          formData.preferredHoursPerWeek >= 32 &&
          formData.maxClientsPerWeek >= 1 && formData.maxClientsPerWeek <= 2
        );
      case "location":
        // Check required location fields
        return (
          formData.serviceRadius > 0 &&
          formData.transportation.trim() !== ""
          // Not requiring preferredLocations as they may be optional
        );
      case "references":
        // Check if at least one reference has name and contact info
        return (
          formData.references.length > 0 &&
          formData.references.some(ref => 
            ref.name.trim() !== "" && 
            (ref.phone.trim() !== "" || ref.email.trim() !== "")
          )
        );
      case "review":
        // Always allow proceeding from review
        return true;
      default:
        return true;
    }
  };

  // Render the current step content
  const renderStepContent = () => {
    const step = formSteps[currentStep];
    
    switch(step.id) {
      case "personal":
        return (
          <PersonalInformationStep 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        );
      case "experience":
        return (
          <ExperienceStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case "availability":
        return (
          <AvailabilityStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case "location":
        return (
          <LocationStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case "references":
        return (
          <ReferencesStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case "review":
        return (
          <ReviewStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      default:
        return (
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-6">{step.title}</h2>
            <p className="text-gray-500 mb-4">
              This is a placeholder for the {step.title.toLowerCase()} step content.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto pt-12 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Caregiver Application</h1>
            <p className="mt-2 text-sm text-gray-600">
              Step {currentStep + 1} of {formSteps.length}: {formSteps[currentStep].title}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/")}
            className="text-sm"
          >
            Cancel Application
          </Button>
        </div>

        {/* Progress bar */}
        <div className="relative mb-8">
          <div className="overflow-hidden h-2 rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all duration-300 ease-in-out"
              style={{ width: `${((currentStep) / (formSteps.length - 1)) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {formSteps.map((step, idx) => (
              <div 
                key={step.id}
                className={`text-xs font-medium ${idx <= currentStep ? 'text-blue-600' : 'text-gray-500'}`}
                style={{ width: `${100 / formSteps.length}%`, textAlign: idx === 0 ? 'left' : idx === formSteps.length - 1 ? 'right' : 'center' }}
              >
                {step.title}
              </div>
            ))}
          </div>
        </div>

        {/* Form content with page turning animation */}
        <PageTurningAnimation isAnimating={isAnimating} direction={direction}>
          {renderStepContent()}
        </PageTurningAnimation>

        {/* Navigation buttons */}
        <div className="mt-8 flex justify-between">
          <Button 
            variant="outline"
            onClick={goToPreviousStep}
            className="flex items-center"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {currentStep === 0 ? "Back to Home" : "Previous Step"}
          </Button>

          {currentStep < formSteps.length - 1 ? (
            <Button 
              onClick={goToNextStep}
              disabled={!canProceed()}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white"
            >
              Next Step
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              className="flex items-center bg-green-600 hover:bg-green-700 text-white"
            >
              Submit Application
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}