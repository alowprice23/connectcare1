import { create } from 'zustand';
import { Caregiver, CaregiverStatus, Client, ClientStatus } from './models';
import { CaregiverService } from './caregiverService';
import { ClientService } from './clientService';
import { initializeSampleData } from './sampleData';
import { authService } from './authService';

// Initialize services
const caregiverService = new CaregiverService();
const clientService = new ClientService();

// Initialize sample data for development
initializeSampleData();

interface AppState {
  // Auth state
  auth: {
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
  };
  
  // Auth actions
  login: (password: string) => Promise<void>;
  logout: () => void;
  checkAuthStatus: () => boolean;
  
  // Caregivers
  caregivers: {
    newApplicants: Caregiver[];
    availableCaregivers: Caregiver[];
    assignedCaregivers: Caregiver[];
    loading: boolean;
    error: string | null;
  };
  
  // Clients
  clients: {
    unstableClients: Client[];
    newReferrals: Client[];
    stableClients: Client[];
    unassignedClients: Client[];
    inactiveClients: Client[];
    loading: boolean;
    error: string | null;
  };
  
  // Actions - Caregivers
  fetchNewApplicants: () => Promise<void>;
  fetchAvailableCaregivers: () => Promise<void>;
  fetchAssignedCaregivers: () => Promise<void>;
  createCaregiver: (data: Omit<Caregiver, 'id'>) => Promise<Caregiver>;
  updateCaregiver: (id: string, data: Partial<Caregiver>) => Promise<Caregiver>;
  updateCaregiverStatus: (id: string, status: CaregiverStatus) => Promise<Caregiver>;
  getCaregiverById: (id: string) => Caregiver | null;
  
  // Actions - Clients
  fetchUnstableClients: () => Promise<void>;
  fetchNewReferrals: () => Promise<void>;
  fetchStableClients: () => Promise<void>;
  fetchUnassignedClients: () => Promise<void>;
  fetchInactiveClients: () => Promise<void>;
  createClient: (data: Omit<Client, 'id'>) => Promise<Client>;
  updateClient: (id: string, data: Partial<Client>) => Promise<Client>;
  updateClientStatus: (id: string, status: ClientStatus) => Promise<Client>;
  addClientShift: (clientId: string, shift: Client['shifts'][0]) => Promise<Client>;
  assignCaregiverToShift: (clientId: string, shiftIndex: number, caregiverId: string) => Promise<Client>;
  deleteClient: (id: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Auth state
  auth: {
    isAuthenticated: authService.isAuthenticated(),
    loading: false,
    error: null
  },
  
  // Auth actions
  login: async (password: string) => {
    try {
      set(state => ({
        auth: {
          ...state.auth,
          loading: true,
          error: null
        }
      }));
      
      await authService.login(password);
      
      set(state => ({
        auth: {
          ...state.auth,
          isAuthenticated: true,
          loading: false
        }
      }));
    } catch (error) {
      set(state => ({
        auth: {
          ...state.auth,
          loading: false,
          error: error.message || 'Failed to login'
        }
      }));
      throw error;
    }
  },
  
  logout: () => {
    authService.logout();
    set(state => ({
      auth: {
        ...state.auth,
        isAuthenticated: false
      }
    }));
  },
  
  checkAuthStatus: () => {
    const isAuthenticated = authService.isAuthenticated();
    set(state => ({
      auth: {
        ...state.auth,
        isAuthenticated
      }
    }));
    return isAuthenticated;
  },
  
  // Initial state
  caregivers: {
    newApplicants: [],
    availableCaregivers: [],
    assignedCaregivers: [],
    loading: false,
    error: null
  },
  
  // Get caregiver by ID
  getCaregiverById: (id) => {
    const { newApplicants, availableCaregivers, assignedCaregivers } = get().caregivers;
    const allCaregivers = [...newApplicants, ...availableCaregivers, ...assignedCaregivers];
    return allCaregivers.find(caregiver => caregiver.id === id) || null;
  },
  
  clients: {
    unstableClients: [],
    newReferrals: [],
    stableClients: [],
    unassignedClients: [],
    inactiveClients: [],
    loading: false,
    error: null
  },
  
  // Caregiver actions
  fetchNewApplicants: async () => {
    try {
      set(state => ({
        caregivers: {
          ...state.caregivers,
          loading: true,
          error: null
        }
      }));
      
      const newApplicants = await caregiverService.getNewApplicants();
      
      set(state => ({
        caregivers: {
          ...state.caregivers,
          newApplicants,
          loading: false
        }
      }));
    } catch (error) {
      set(state => ({
        caregivers: {
          ...state.caregivers,
          loading: false,
          error: error.message || 'Failed to fetch new applicants'
        }
      }));
    }
  },
  
  fetchAvailableCaregivers: async () => {
    try {
      set(state => ({
        caregivers: {
          ...state.caregivers,
          loading: true,
          error: null
        }
      }));
      
      const availableCaregivers = await caregiverService.getAvailableCaregivers();
      
      set(state => ({
        caregivers: {
          ...state.caregivers,
          availableCaregivers,
          loading: false
        }
      }));
    } catch (error) {
      set(state => ({
        caregivers: {
          ...state.caregivers,
          loading: false,
          error: error.message || 'Failed to fetch available caregivers'
        }
      }));
    }
  },
  
  fetchAssignedCaregivers: async () => {
    try {
      set(state => ({
        caregivers: {
          ...state.caregivers,
          loading: true,
          error: null
        }
      }));
      
      const assignedCaregivers = await caregiverService.getAssignedCaregivers();
      
      set(state => ({
        caregivers: {
          ...state.caregivers,
          assignedCaregivers,
          loading: false
        }
      }));
    } catch (error) {
      set(state => ({
        caregivers: {
          ...state.caregivers,
          loading: false,
          error: error.message || 'Failed to fetch assigned caregivers'
        }
      }));
    }
  },
  
  createCaregiver: async (data) => {
    try {
      const newCaregiver = await caregiverService.create(data);
      
      // Refresh lists based on the new caregiver's status
      if (data.status === CaregiverStatus.NEW_APPLICANT) {
        get().fetchNewApplicants();
      } else if (data.status === CaregiverStatus.AVAILABLE) {
        get().fetchAvailableCaregivers();
      } else if (data.status === CaregiverStatus.ASSIGNED) {
        get().fetchAssignedCaregivers();
      }
      
      return newCaregiver;
    } catch (error) {
      set(state => ({
        caregivers: {
          ...state.caregivers,
          error: error.message || 'Failed to create caregiver'
        }
      }));
      throw error;
    }
  },
  
  updateCaregiver: async (id, data) => {
    try {
      const updatedCaregiver = await caregiverService.update(id, data);
      
      // Refresh all lists to ensure data consistency
      get().fetchNewApplicants();
      get().fetchAvailableCaregivers();
      get().fetchAssignedCaregivers();
      
      return updatedCaregiver;
    } catch (error) {
      set(state => ({
        caregivers: {
          ...state.caregivers,
          error: error.message || 'Failed to update caregiver'
        }
      }));
      throw error;
    }
  },
  
  updateCaregiverStatus: async (id, status) => {
    try {
      const updatedCaregiver = await caregiverService.updateStatus(id, status);
      
      // Refresh all lists to ensure data consistency
      get().fetchNewApplicants();
      get().fetchAvailableCaregivers();
      get().fetchAssignedCaregivers();
      
      return updatedCaregiver;
    } catch (error) {
      set(state => ({
        caregivers: {
          ...state.caregivers,
          error: error.message || 'Failed to update caregiver status'
        }
      }));
      throw error;
    }
  },
  
  // Client actions
  fetchUnstableClients: async () => {
    try {
      set(state => ({
        clients: {
          ...state.clients,
          loading: true,
          error: null
        }
      }));
      
      const unstableClients = await clientService.getUnstableClients();
      
      set(state => ({
        clients: {
          ...state.clients,
          unstableClients,
          loading: false
        }
      }));
    } catch (error) {
      set(state => ({
        clients: {
          ...state.clients,
          loading: false,
          error: error.message || 'Failed to fetch unstable clients'
        }
      }));
    }
  },
  
  fetchNewReferrals: async () => {
    try {
      set(state => ({
        clients: {
          ...state.clients,
          loading: true,
          error: null
        }
      }));
      
      const newReferrals = await clientService.getNewReferrals();
      
      set(state => ({
        clients: {
          ...state.clients,
          newReferrals,
          loading: false
        }
      }));
    } catch (error) {
      set(state => ({
        clients: {
          ...state.clients,
          loading: false,
          error: error.message || 'Failed to fetch new client referrals'
        }
      }));
    }
  },
  
  fetchStableClients: async () => {
    try {
      set(state => ({
        clients: {
          ...state.clients,
          loading: true,
          error: null
        }
      }));
      
      const stableClients = await clientService.getStableClients();
      
      set(state => ({
        clients: {
          ...state.clients,
          stableClients,
          loading: false
        }
      }));
    } catch (error) {
      set(state => ({
        clients: {
          ...state.clients,
          loading: false,
          error: error.message || 'Failed to fetch stable clients'
        }
      }));
    }
  },
  
  fetchUnassignedClients: async () => {
    try {
      set(state => ({
        clients: {
          ...state.clients,
          loading: true,
          error: null
        }
      }));
      
      const unassignedClients = await clientService.getClientsWithUnassignedShifts();
      
      set(state => ({
        clients: {
          ...state.clients,
          unassignedClients,
          loading: false
        }
      }));
    } catch (error) {
      set(state => ({
        clients: {
          ...state.clients,
          loading: false,
          error: error.message || 'Failed to fetch unassigned clients'
        }
      }));
    }
  },
  
  fetchInactiveClients: async () => {
    try {
      set(state => ({
        clients: {
          ...state.clients,
          loading: true,
          error: null
        }
      }));
      
      const inactiveClients = await clientService.getInactiveClients();
      
      set(state => ({
        clients: {
          ...state.clients,
          inactiveClients,
          loading: false
        }
      }));
    } catch (error) {
      set(state => ({
        clients: {
          ...state.clients,
          loading: false,
          error: error.message || 'Failed to fetch inactive clients'
        }
      }));
    }
  },
  
  createClient: async (data) => {
    try {
      let newClient: Client;
      if (data.status === ClientStatus.NEW_REFERRAL) {
        newClient = await clientService.createReferral(data);
      } else {
        newClient = await clientService.create(data);
      }
      
      // Refresh lists based on the new client's status
      if (data.status === ClientStatus.UNSTABLE) {
        get().fetchUnstableClients();
      } else if (data.status === ClientStatus.NEW_REFERRAL) {
        get().fetchNewReferrals();
      } else if (data.status === ClientStatus.STABLE) {
        get().fetchStableClients();
      }
      
      return newClient;
    } catch (error) {
      set(state => ({
        clients: {
          ...state.clients,
          error: error.message || 'Failed to create client'
        }
      }));
      throw error;
    }
  },
  
  updateClient: async (id, data) => {
    try {
      const updatedClient = await clientService.update(id, data);
      
      // Refresh all lists to ensure data consistency
      get().fetchUnstableClients();
      get().fetchNewReferrals();
      get().fetchStableClients();
      get().fetchUnassignedClients();
      
      return updatedClient;
    } catch (error) {
      set(state => ({
        clients: {
          ...state.clients,
          error: error.message || 'Failed to update client'
        }
      }));
      throw error;
    }
  },
  
  updateClientStatus: async (id, status) => {
    try {
      const updatedClient = await clientService.updateStatus(id, status);
      
      // Refresh all lists to ensure data consistency
      get().fetchUnstableClients();
      get().fetchNewReferrals();
      get().fetchStableClients();
      get().fetchUnassignedClients();
      
      return updatedClient;
    } catch (error) {
      set(state => ({
        clients: {
          ...state.clients,
          error: error.message || 'Failed to update client status'
        }
      }));
      throw error;
    }
  },
  
  addClientShift: async (clientId, shift) => {
    try {
      const updatedClient = await clientService.addShift(clientId, shift);
      
      // Refresh client lists
      get().fetchUnstableClients();
      get().fetchStableClients();
      get().fetchUnassignedClients();
      
      return updatedClient;
    } catch (error) {
      set(state => ({
        clients: {
          ...state.clients,
          error: error.message || 'Failed to add client shift'
        }
      }));
      throw error;
    }
  },
  
  assignCaregiverToShift: async (clientId, shiftIndex, caregiverId) => {
    try {
      const updatedClient = await clientService.assignCaregiverToShift(clientId, shiftIndex, caregiverId);
      
      // Refresh all lists to ensure data consistency
      get().fetchUnassignedClients();
      get().fetchStableClients();
      get().fetchUnstableClients();
      get().fetchAssignedCaregivers();
      
      return updatedClient;
    } catch (error) {
      set(state => ({
        clients: {
          ...state.clients,
          error: error.message || 'Failed to assign caregiver to shift'
        }
      }));
      throw error;
    }
  },
  
  deleteCaregiver: async (id) => {
    try {
      await caregiverService.delete(id);
      
      // Refresh all caregiver lists
      get().fetchNewApplicants();
      get().fetchAvailableCaregivers();
      get().fetchAssignedCaregivers();
    } catch (error) {
      set(state => ({
        caregivers: {
          ...state.caregivers,
          error: error.message || 'Failed to delete caregiver'
        }
      }));
      throw error;
    }
  },
  
  deleteClient: async (id) => {
    try {
      await clientService.delete(id);
      
      // Refresh all client lists
      get().fetchUnstableClients();
      get().fetchNewReferrals();
      get().fetchStableClients();
      get().fetchUnassignedClients();
    } catch (error) {
      set(state => ({
        clients: {
          ...state.clients,
          error: error.message || 'Failed to delete client'
        }
      }));
      throw error;
    }
  }
}));

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  caregivers: {
    newApplicants: [],
    availableCaregivers: [],
    assignedCaregivers: [],
    loading: false,
    error: null
  },
  
  // Get caregiver by ID
  getCaregiverById: (id) => {
    const { newApplicants, availableCaregivers, assignedCaregivers } = get().caregivers;
    const allCaregivers = [...newApplicants, ...availableCaregivers, ...assignedCaregivers];
    return allCaregivers.find(caregiver => caregiver.id === id) || null;
  },
  
  clients: {
    unstableClients: [],
    newReferrals: [],
    stableClients: [],
    unassignedClients: [],
    loading: false,
    error: null
  },
  
  // Caregiver actions
  fetchNewApplicants: async () => {
    try {
      set(state => ({
        caregivers: {
          ...state.caregivers,
          loading: true,
          error: null
        }
      }));
      
      const newApplicants = await caregiverService.getNewApplicants();
      
      set(state => ({
        caregivers: {
          ...state.caregivers,
          newApplicants,
          loading: false
        }
      }));
    } catch (error) {
      console.error('Error fetching new applicants:', error);
      set(state => ({
        caregivers: {
          ...state.caregivers,
          loading: false,
          error: error instanceof Error ? error.message : 'An error occurred'
        }
      }));
    }
  },
  
  fetchAvailableCaregivers: async () => {
    try {
      set(state => ({
        caregivers: {
          ...state.caregivers,
          loading: true,
          error: null
        }
      }));
      
      const availableCaregivers = await caregiverService.getAvailableCaregivers();
      
      set(state => ({
        caregivers: {
          ...state.caregivers,
          availableCaregivers,
          loading: false
        }
      }));
    } catch (error) {
      console.error('Error fetching available caregivers:', error);
      set(state => ({
        caregivers: {
          ...state.caregivers,
          loading: false,
          error: error instanceof Error ? error.message : 'An error occurred'
        }
      }));
    }
  },
  
  fetchAssignedCaregivers: async () => {
    try {
      set(state => ({
        caregivers: {
          ...state.caregivers,
          loading: true,
          error: null
        }
      }));
      
      const assignedCaregivers = await caregiverService.getAssignedCaregivers();
      
      set(state => ({
        caregivers: {
          ...state.caregivers,
          assignedCaregivers,
          loading: false
        }
      }));
    } catch (error) {
      console.error('Error fetching assigned caregivers:', error);
      set(state => ({
        caregivers: {
          ...state.caregivers,
          loading: false,
          error: error instanceof Error ? error.message : 'An error occurred'
        }
      }));
    }
  },
  
  createCaregiver: async (data) => {
    try {
      const newCaregiver = await caregiverService.create(data);
      
      // Update state based on status
      if (data.status === CaregiverStatus.NEW_APPLICANT) {
        set(state => ({
          caregivers: {
            ...state.caregivers,
            newApplicants: [newCaregiver, ...state.caregivers.newApplicants]
          }
        }));
      } else if (data.status === CaregiverStatus.AVAILABLE) {
        set(state => ({
          caregivers: {
            ...state.caregivers,
            availableCaregivers: [newCaregiver, ...state.caregivers.availableCaregivers]
          }
        }));
      } else if (data.status === CaregiverStatus.ASSIGNED) {
        set(state => ({
          caregivers: {
            ...state.caregivers,
            assignedCaregivers: [newCaregiver, ...state.caregivers.assignedCaregivers]
          }
        }));
      }
      
      return newCaregiver;
    } catch (error) {
      console.error('Error creating caregiver:', error);
      throw error;
    }
  },
  
  updateCaregiver: async (id, data) => {
    try {
      const updatedCaregiver = await caregiverService.update(id, data);
      
      // Update all lists that might contain this caregiver
      const updateList = (list: Caregiver[]) => {
        return list.map(item => {
          if (item.id === id) {
            return updatedCaregiver;
          }
          return item;
        });
      };
      
      set(state => ({
        caregivers: {
          ...state.caregivers,
          newApplicants: updateList(state.caregivers.newApplicants),
          availableCaregivers: updateList(state.caregivers.availableCaregivers),
          assignedCaregivers: updateList(state.caregivers.assignedCaregivers),
        }
      }));
      
      return updatedCaregiver;
    } catch (error) {
      console.error('Error updating caregiver:', error);
      throw error;
    }
  },
  
  updateCaregiverStatus: async (id, status) => {
    try {
      const updatedCaregiver = await caregiverService.updateStatus(id, status);
      
      // Remove from all lists
      set(state => {
        const newApplicants = state.caregivers.newApplicants.filter(c => c.id !== id);
        const availableCaregivers = state.caregivers.availableCaregivers.filter(c => c.id !== id);
        const assignedCaregivers = state.caregivers.assignedCaregivers.filter(c => c.id !== id);
        
        // Add to appropriate list based on new status
        if (status === CaregiverStatus.NEW_APPLICANT) {
          newApplicants.unshift(updatedCaregiver);
        } else if (status === CaregiverStatus.AVAILABLE) {
          availableCaregivers.unshift(updatedCaregiver);
        } else if (status === CaregiverStatus.ASSIGNED) {
          assignedCaregivers.unshift(updatedCaregiver);
        }
        
        return {
          caregivers: {
            ...state.caregivers,
            newApplicants,
            availableCaregivers,
            assignedCaregivers
          }
        };
      });
      
      return updatedCaregiver;
    } catch (error) {
      console.error('Error updating caregiver status:', error);
      throw error;
    }
  },
  
  deleteCaregiver: async (id) => {
    try {
      await caregiverService.delete(id);
      
      // Remove from all lists
      set(state => ({
        caregivers: {
          ...state.caregivers,
          newApplicants: state.caregivers.newApplicants.filter(c => c.id !== id),
          availableCaregivers: state.caregivers.availableCaregivers.filter(c => c.id !== id),
          assignedCaregivers: state.caregivers.assignedCaregivers.filter(c => c.id !== id)
        }
      }));
    } catch (error) {
      console.error('Error deleting caregiver:', error);
      throw error;
    }
  },
  
  // Client actions
  fetchUnstableClients: async () => {
    try {
      set(state => ({
        clients: {
          ...state.clients,
          loading: true,
          error: null
        }
      }));
      
      const unstableClients = await clientService.getUnstableClients();
      
      set(state => ({
        clients: {
          ...state.clients,
          unstableClients,
          loading: false
        }
      }));
    } catch (error) {
      console.error('Error fetching unstable clients:', error);
      set(state => ({
        clients: {
          ...state.clients,
          loading: false,
          error: error instanceof Error ? error.message : 'An error occurred'
        }
      }));
    }
  },
  
  fetchNewReferrals: async () => {
    try {
      set(state => ({
        clients: {
          ...state.clients,
          loading: true,
          error: null
        }
      }));
      
      const newReferrals = await clientService.getNewReferrals();
      
      set(state => ({
        clients: {
          ...state.clients,
          newReferrals,
          loading: false
        }
      }));
    } catch (error) {
      console.error('Error fetching new referrals:', error);
      set(state => ({
        clients: {
          ...state.clients,
          loading: false,
          error: error instanceof Error ? error.message : 'An error occurred'
        }
      }));
    }
  },
  
  fetchStableClients: async () => {
    try {
      set(state => ({
        clients: {
          ...state.clients,
          loading: true,
          error: null
        }
      }));
      
      const stableClients = await clientService.getStableClients();
      
      set(state => ({
        clients: {
          ...state.clients,
          stableClients,
          loading: false
        }
      }));
    } catch (error) {
      console.error('Error fetching stable clients:', error);
      set(state => ({
        clients: {
          ...state.clients,
          loading: false,
          error: error instanceof Error ? error.message : 'An error occurred'
        }
      }));
    }
  },
  
  fetchUnassignedClients: async () => {
    try {
      set(state => ({
        clients: {
          ...state.clients,
          loading: true,
          error: null
        }
      }));
      
      const unassignedClients = await clientService.getClientsWithUnassignedShifts();
      
      set(state => ({
        clients: {
          ...state.clients,
          unassignedClients,
          loading: false
        }
      }));
    } catch (error) {
      console.error('Error fetching unassigned clients:', error);
      set(state => ({
        clients: {
          ...state.clients,
          loading: false,
          error: error instanceof Error ? error.message : 'An error occurred'
        }
      }));
    }
  },
  
  createClient: async (data) => {
    try {
      const newClient = await clientService.create(data);
      
      // Update state based on status
      if (data.status === ClientStatus.NEW_REFERRAL) {
        set(state => ({
          clients: {
            ...state.clients,
            newReferrals: [newClient, ...state.clients.newReferrals]
          }
        }));
      } else if (data.status === ClientStatus.UNSTABLE) {
        set(state => ({
          clients: {
            ...state.clients,
            unstableClients: [newClient, ...state.clients.unstableClients]
          }
        }));
      } else if (data.status === ClientStatus.STABLE) {
        set(state => ({
          clients: {
            ...state.clients,
            stableClients: [newClient, ...state.clients.stableClients]
          }
        }));
      }
      
      // If client has unassigned shifts, add to unassignedClients
      if (newClient.shifts.some(shift => !shift.caregiverId)) {
        set(state => ({
          clients: {
            ...state.clients,
            unassignedClients: [newClient, ...state.clients.unassignedClients]
          }
        }));
      }
      
      return newClient;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  },
  
  createClientReferral: async (data) => {
    try {
      // Create a partial client with NEW_REFERRAL status
      const referralData = {
        ...data,
        status: ClientStatus.NEW_REFERRAL,
        assignedCaregivers: [],
        shifts: [],
      } as Omit<Client, 'id'>;
      
      const newReferral = await clientService.create(referralData);
      
      // Update the state
      set(state => ({
        clients: {
          ...state.clients,
          newReferrals: [newReferral, ...state.clients.newReferrals]
        }
      }));
      
      return newReferral;
    } catch (error) {
      console.error('Error creating client referral:', error);
      throw error;
    }
  },
  
  updateClient: async (id, data) => {
    try {
      const updatedClient = await clientService.update(id, data);
      
      // Update all lists that might contain this client
      const updateList = (list: Client[]) => {
        return list.map(item => {
          if (item.id === id) {
            return updatedClient;
          }
          return item;
        });
      };
      
      set(state => ({
        clients: {
          ...state.clients,
          newReferrals: updateList(state.clients.newReferrals),
          unstableClients: updateList(state.clients.unstableClients),
          stableClients: updateList(state.clients.stableClients),
          unassignedClients: updateList(state.clients.unassignedClients)
        }
      }));
      
      return updatedClient;
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  },
  
  updateClientStatus: async (id, status) => {
    try {
      const updatedClient = await clientService.updateStatus(id, status);
      
      // Remove from all status-specific lists
      set(state => {
        const newReferrals = state.clients.newReferrals.filter(c => c.id !== id);
        const unstableClients = state.clients.unstableClients.filter(c => c.id !== id);
        const stableClients = state.clients.stableClients.filter(c => c.id !== id);
        
        // Add to appropriate list based on new status
        if (status === ClientStatus.NEW_REFERRAL) {
          newReferrals.unshift(updatedClient);
        } else if (status === ClientStatus.UNSTABLE) {
          unstableClients.unshift(updatedClient);
        } else if (status === ClientStatus.STABLE) {
          stableClients.unshift(updatedClient);
        }
        
        // For unassigned clients, we need to check if the client still has unassigned shifts
        let unassignedClients = state.clients.unassignedClients;
        if (updatedClient.shifts.some(shift => !shift.caregiverId)) {
          // If not already in the list, add it
          if (!unassignedClients.some(c => c.id === id)) {
            unassignedClients = [updatedClient, ...unassignedClients];
          } else {
            // Otherwise update it
            unassignedClients = unassignedClients.map(c => c.id === id ? updatedClient : c);
          }
        } else {
          // If all shifts are assigned, remove from unassigned list
          unassignedClients = unassignedClients.filter(c => c.id !== id);
        }
        
        return {
          clients: {
            ...state.clients,
            newReferrals,
            unstableClients,
            stableClients,
            unassignedClients
          }
        };
      });
      
      return updatedClient;
    } catch (error) {
      console.error('Error updating client status:', error);
      throw error;
    }
  },
  
  deleteClient: async (id) => {
    try {
      await clientService.delete(id);
      
      // Remove from all lists
      set(state => ({
        clients: {
          ...state.clients,
          newReferrals: state.clients.newReferrals.filter(c => c.id !== id),
          unstableClients: state.clients.unstableClients.filter(c => c.id !== id),
          stableClients: state.clients.stableClients.filter(c => c.id !== id),
          unassignedClients: state.clients.unassignedClients.filter(c => c.id !== id)
        }
      }));
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  },
  
  assignCaregiverToShift: async (clientId, shiftIndex, caregiverId) => {
    try {
      const updatedClient = await clientService.assignCaregiverToShift(
        clientId,
        shiftIndex,
        caregiverId
      );
      
      // Update all client lists that might contain this client
      const updateList = (list: Client[]) => {
        return list.map(item => {
          if (item.id === clientId) {
            return updatedClient;
          }
          return item;
        });
      };
      
      set(state => {
        const updatedState = {
          clients: {
            ...state.clients,
            newReferrals: updateList(state.clients.newReferrals),
            unstableClients: updateList(state.clients.unstableClients),
            stableClients: updateList(state.clients.stableClients),
          }
        };
        
        // Check if client still has unassigned shifts
        if (updatedClient.shifts.some(shift => !shift.caregiverId)) {
          updatedState.clients.unassignedClients = updateList(state.clients.unassignedClients);
        } else {
          // If all shifts are now assigned, remove from unassigned clients
          updatedState.clients.unassignedClients = state.clients.unassignedClients.filter(
            c => c.id !== clientId
          );
        }
        
        return updatedState;
      });
      
      return updatedClient;
    } catch (error) {
      console.error('Error assigning caregiver to shift:', error);
      throw error;
    }
  }
}));
