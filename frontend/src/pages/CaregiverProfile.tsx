import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import CaregiverProfile from 'components/CaregiverProfile';
import { Caregiver } from 'utils/models';
import { useStore } from 'utils/store';

const CaregiverProfilePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const caregiverId = searchParams.get('id');
  const { getCaregiverById, caregivers } = useStore();
  const [caregiver, setCaregiver] = useState<Caregiver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (caregiverId) {
      try {
        console.log('Loading caregiver with ID:', caregiverId);
        console.log('Available caregivers:', {
          newApplicants: caregivers.newApplicants.length,
          availableCaregivers: caregivers.availableCaregivers.length,
          assignedCaregivers: caregivers.assignedCaregivers.length,
        });
        
        const caregiverData = getCaregiverById(caregiverId);
        console.log('Found caregiver:', caregiverData);
        
        if (caregiverData) {
          setCaregiver(caregiverData);
        } else {
          setError(`Caregiver with ID ${caregiverId} not found`);
        }
      } catch (err) {
        console.error('Error loading caregiver:', err);
        setError(err instanceof Error ? err.message : 'Failed to load caregiver');
      } finally {
        setLoading(false);
      }
    } else {
      // No ID provided, go back to the admin page
      navigate('/admin');
    }
  }, [caregiverId, getCaregiverById, caregivers, navigate]);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!caregiver && !loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Button
          variant="outline"
          size="sm"
          className="mb-6"
          onClick={() => navigate('/admin')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Admin
        </Button>
        
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Caregiver Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error || "The caregiver you're looking for doesn't exist or has been removed."}
          </p>
          <Button onClick={() => navigate('/admin')}>Return to Admin Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button
        variant="outline"
        size="sm"
        className="mb-6"
        onClick={() => navigate('/admin')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Admin
      </Button>
      
      <CaregiverProfile 
        caregiver={caregiver} 
        onClose={() => navigate('/admin')} 
      />
    </div>
  );
};

export default CaregiverProfilePage;