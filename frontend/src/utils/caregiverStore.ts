import { create } from 'zustand';
import { Caregiver } from './models';
import { CaregiverService } from './caregiverService';

const caregiverService = new CaregiverService();

export interface CaregiverStore {
  caregivers: Caregiver[];
  loading: boolean;
  error: string | null;
  
  // Getters
  getCaregiverById: (id: string) => Caregiver | null;
  
  // Actions
  fetchAllCaregivers: () => Promise<void>;
  updateCaregiver: (id: string, data: Partial<Caregiver>) => Promise<Caregiver>;
}

export const useCaregiverStore = create<CaregiverStore>((set, get) => ({
  caregivers: [],
  loading: false,
  error: null,
  
  getCaregiverById: (id) => {
    return get().caregivers.find(caregiver => caregiver.id === id) || null;
  },
  
  fetchAllCaregivers: async () => {
    try {
      set({ loading: true, error: null });
      
      // Get all caregivers
      const allCaregivers = await caregiverService.getAll();
      set({ caregivers: allCaregivers, loading: false });
      
    } catch (error) {
      console.error('Error fetching caregivers:', error);
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'An error occurred' 
      });
    }
  },
  
  updateCaregiver: async (id, data) => {
    try {
      const updatedCaregiver = await caregiverService.update(id, data);
      
      // Update in state
      set(state => ({
        caregivers: state.caregivers.map(caregiver => 
          caregiver.id === id ? updatedCaregiver : caregiver
        )
      }));
      
      return updatedCaregiver;
    } catch (error) {
      console.error('Error updating caregiver:', error);
      throw error;
    }
  }
}));
