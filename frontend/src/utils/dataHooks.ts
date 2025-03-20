import { useCallback, useEffect, useState } from 'react';
import { useAppStore } from './store';
import { CaregiverStatus, ClientStatus } from './models';
import { authService } from './authService';
import { toast } from 'sonner';

/**
 * Hook for accessing and managing authentication
 */
export const useAuth = () => {
  const { auth, login, logout, checkAuthStatus } = useAppStore();
  
  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return {
    isAuthenticated: auth.isAuthenticated,
    loading: auth.loading,
    error: auth.error,
    login,
    logout,
    checkAuthStatus,
    getPasswordHint: authService.getPasswordHint.bind(authService)
  };
};

/**
 * Hook for accessing and managing caregiver data
 */
export const useCaregivers = () => {
  const {
    caregivers,
    fetchNewApplicants,
    fetchAvailableCaregivers,
    fetchAssignedCaregivers,
    createCaregiver,
    updateCaregiver,
    updateCaregiverStatus,
    deleteCaregiver,
  } = useAppStore();

  // Fetch all caregiver data when the hook is first used
  const fetchAllCaregivers = useCallback(() => {
    // Use Promise.all to fetch data in parallel
    Promise.allSettled([
      fetchNewApplicants(),
      fetchAvailableCaregivers(),
      fetchAssignedCaregivers()
    ]).catch(err => console.error('Error fetching caregivers:', err));
  }, [fetchNewApplicants, fetchAvailableCaregivers, fetchAssignedCaregivers]);

  return {
    // Data
    newApplicants: caregivers.newApplicants,
    availableCaregivers: caregivers.availableCaregivers,
    assignedCaregivers: caregivers.assignedCaregivers,
    loading: caregivers.loading,
    error: caregivers.error,

    // Actions
    fetchAllCaregivers,
    fetchNewApplicants,
    fetchAvailableCaregivers,
    fetchAssignedCaregivers,
    createCaregiver,
    updateCaregiver,

    // Helper functions
    markAsAvailable: (id: string) => updateCaregiverStatus(id, CaregiverStatus.AVAILABLE),
    markAsAssigned: (id: string) => updateCaregiverStatus(id, CaregiverStatus.ASSIGNED),
    markAsInactive: (id: string) => updateCaregiverStatus(id, CaregiverStatus.INACTIVE),
    approveApplicant: (id: string) => updateCaregiverStatus(id, CaregiverStatus.BACKGROUND_CHECK),
    completeBackgroundCheck: (id: string, passed: boolean) => {
      return updateCaregiver(id, {
        backgroundCheckPassed: passed,
        status: passed ? CaregiverStatus.TRAINING : CaregiverStatus.INACTIVE
      });
    },
    completeTraining: (id: string, completed: boolean) => {
      return updateCaregiver(id, {
        trainingCompleted: completed,
        status: completed ? CaregiverStatus.AVAILABLE : CaregiverStatus.INACTIVE
      });
    },
    deleteCaregiver
  };
};

/**
 * Hook for accessing and managing client data
 */
export const useClients = () => {
  const {
    clients,
    fetchUnstableClients,
    fetchNewReferrals,
    fetchStableClients,
    fetchUnassignedClients,
    fetchInactiveClients,
    createClient,
    updateClient,
    updateClientStatus,
    addClientShift,
    assignCaregiverToShift,
    deleteClient
  } = useAppStore();

  // Fetch all client data when the hook is first used
  const fetchAllClients = useCallback(() => {
    fetchUnstableClients();
    fetchNewReferrals();
    fetchStableClients();
    fetchUnassignedClients();
    fetchInactiveClients();
  }, [fetchUnstableClients, fetchNewReferrals, fetchStableClients, fetchUnassignedClients, fetchInactiveClients]);

  return {
    // Data
    unstableClients: clients.unstableClients,
    newReferrals: clients.newReferrals,
    stableClients: clients.stableClients,
    unassignedClients: clients.unassignedClients,
    inactiveClients: clients.inactiveClients,
    loading: clients.loading,
    error: clients.error,

    // Actions
    fetchAllClients,
    fetchUnstableClients,
    fetchNewReferrals,
    fetchStableClients,
    fetchUnassignedClients,
    fetchInactiveClients,
    createClient,
    updateClient,
    assignCaregiverToShift,
    addClientShift,

    // Helper functions
    markAsStable: (id: string) => updateClientStatus(id, ClientStatus.STABLE),
    markAsUnstable: (id: string) => updateClientStatus(id, ClientStatus.UNSTABLE),
    markAsInactive: (id: string) => updateClientStatus(id, ClientStatus.INACTIVE),
    addShift: (clientId: string, shift: any) => addClientShift(clientId, shift),
    deleteClient,
  };
};

/**
 * Hook to initialize the data store on component mount
 */
export const useDataInit = () => {
  const { fetchAllCaregivers } = useCaregivers();
  const { fetchAllClients } = useClients();
  const [initializationAttempted, setInitializationAttempted] = useState(false);

  useEffect(() => {
    // Only attempt to initialize data once
    if (initializationAttempted) {
      console.log('Data initialization already attempted, skipping');
      return;
    }
    
    console.log('Starting safe data initialization process');
    setInitializationAttempted(true);
    
    // Create a toast to show initialization progress
    toast.loading('Initializing data...', { id: 'data-init-toast', duration: 2000 });
    
    // Load caregivers with error handling and timeout protection
    const loadCaregivers = async () => {
      try {
        console.log('Initializing caregivers data...');
        const caregiverPromise = fetchAllCaregivers();
        
        // Add timeout protection
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Caregiver data loading timed out')), 8000);
        });
        
        await Promise.race([caregiverPromise, timeoutPromise]);
        console.log('Caregivers data initialized successfully');
        return true;
      } catch (error) {
        console.error('Error initializing caregiver data:', error);
        return false;
      }
    };
    
    // Load clients with error handling and timeout protection
    const loadClients = async () => {
      try {
        console.log('Initializing clients data...');
        const clientPromise = fetchAllClients();
        
        // Add timeout protection
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Client data loading timed out')), 8000);
        });
        
        await Promise.race([clientPromise, timeoutPromise]);
        console.log('Clients data initialized successfully');
        return true;
      } catch (error) {
        console.error('Error initializing client data:', error);
        return false;
      }
    };
    
    // Execute both data loading operations with proper sequencing and error handling
    const initiateDataLoading = async () => {
      let caregiverSuccess = false;
      let clientSuccess = false;
      
      try {
        // First attempt caregivers
        caregiverSuccess = await loadCaregivers();
        
        // Then attempt clients
        clientSuccess = await loadClients();
        
        // Update toast based on results
        toast.dismiss('data-init-toast');
        
        if (caregiverSuccess && clientSuccess) {
          toast.success('Data initialized successfully', { duration: 2000 });
        } else if (!caregiverSuccess && !clientSuccess) {
          toast.error('Failed to load application data', { duration: 3000 });
        } else {
          toast.warning('Some data failed to load', { duration: 3000 });
        }
      } catch (error) {
        console.error('Unhandled error during data initialization:', error);
        toast.dismiss('data-init-toast');
        toast.error('Failed to initialize data', { duration: 3000 });
      }
    };
    
    // Start the data loading process
    initiateDataLoading();
    
    // No cleanup needed since we're using the state flag to prevent duplicate initialization
  }, [fetchAllCaregivers, fetchAllClients, initializationAttempted]);
};
