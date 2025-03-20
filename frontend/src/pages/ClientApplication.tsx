import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageTurningAnimation } from "components/PageTurningAnimation";
import { Client, ClientStatus } from "../utils/models";
import { ClientPersonalStep } from "components/ClientPersonalStep";
import { ClientCareStep } from "components/ClientCareStep";
import { ClientScheduleStep } from "components/ClientScheduleStep";
import { ClientEmergencyStep } from "components/ClientEmergencyStep";
import { ClientReviewStep } from "components/ClientReviewStep";
import { useClients } from "../utils/dataHooks";
import { toast } from "sonner";
import { ClientService } from "../utils/clientService";

// Define the steps of our form
const formSteps = [
  { id: "personal", title: "Personal Information" },
  { id: "care", title: "Care Needs" },
  { id: "schedule", title: "Schedule" },
  { id: "emergency", title: "Emergency Contact" },
  { id: "review", title: "Review & Submit" },
];

export default function ClientApplication() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('id');
  const { createClient, updateClient } = useClients();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [pageLoading, setPageLoading] = useState(true);
  
  // Initial empty form data
  const [formData, setFormData] = useState<Partial<Client>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    status: ClientStatus.NEW_REFERRAL,
    careNeeds: [],
    medicalConditions: [],
    careLevel: 1,
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    preferredCaregiverTraits: [],
    assignedCaregivers: [],
    shifts: [],
    notes: '',
    transportation: {
      hasCar: false,
      onBusLine: false,
      needsTransportation: false,
      transportationNotes: ''
    },
    authorization: {
      startDate: '',
      endDate: '',
      totalAuthorizedHours: 0
    }
  });
  
  // Fetch client data if editing
  useEffect(() => {
    const fetchData = async () => {
      if (clientId) {
        try {
          // Use ClientService directly instead of going through clients state
          const clientService = new ClientService();
          const foundClient = await clientService.getById(clientId);
          
          if (foundClient) {
            setFormData(foundClient);
          } else {
            toast.error('Client not found');
            navigate('/admin');
          }
        } catch (error) {
          console.error('Error fetching client data:', error);
          toast.error('Error loading client data');
          navigate('/admin');
        }
      }
      setPageLoading(false);
    };
    
    fetchData();
  }, [clientId, navigate]);
  
  // Handle form data changes
  const updateFormData = (data: Partial<Client>) => {
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
      navigate("/admin");
    }
  };

  const handleSubmit = async () => {
    try {
      if (clientId) {
        await updateClient(clientId, formData);
        toast.success("Client updated successfully");
      } else {
        await createClient(formData as Omit<Client, 'id'>);
        toast.success("Client created successfully");
      }
      navigate("/admin");
    } catch (error) {
      toast.error(clientId ? "Failed to update client" : "Failed to create client");
      console.error(error);
    }
  };

  // Determine if we can proceed to the next step (basic validation)
  const canProceed = () => {
    const step = formSteps[currentStep];
    
    switch(step.id) {
      case "personal":
        // Check if all required personal fields are filled
        return (
          formData.firstName?.trim() !== "" &&
          formData.lastName?.trim() !== "" &&
          formData.email?.trim() !== "" &&
          formData.phone?.trim() !== "" &&
          formData.address?.trim() !== "" &&
          formData.city?.trim() !== "" &&
          formData.state?.trim() !== "" &&
          formData.zip?.trim() !== ""
        );
      case "care":
        // Check if required care fields are filled
        return formData.careLevel !== undefined && formData.careLevel > 0;
      case "schedule":
        // No strict requirements for schedule
        return true;
      case "emergency":
        // Check if emergency contact has name and phone
        return (
          formData.emergencyContact?.name?.trim() !== "" &&
          formData.emergencyContact?.phone?.trim() !== ""
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
          <ClientPersonalStep 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        );
      case "care":
        return (
          <ClientCareStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case "schedule":
        return (
          <ClientScheduleStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case "emergency":
        return (
          <ClientEmergencyStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case "review":
        return (
          <ClientReviewStep
            formData={formData}
            updateFormData={updateFormData}
            isEditing={!!clientId}
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
  
  if (pageLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto pt-12 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {clientId ? 'Edit Client' : 'New Client Referral'}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Step {currentStep + 1} of {formSteps.length}: {formSteps[currentStep].title}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/admin")}
            className="text-sm"
          >
            Cancel
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
            {currentStep === 0 ? "Back to Admin" : "Previous Step"}
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
              {clientId ? 'Update Client' : 'Submit Application'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
