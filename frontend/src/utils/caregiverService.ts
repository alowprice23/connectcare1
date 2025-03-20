import { LocalStorageService } from './localStorageService';
import { Caregiver, CaregiverStatus } from './models';
import { locationService } from './locationService';

export class CaregiverService extends LocalStorageService<Caregiver> {
  constructor() {
    super('caregivers');
  }

  /**
   * Get all new applicants
   */
  async getNewApplicants(): Promise<Caregiver[]> {
    // Get all caregivers and filter by status
    const allCaregivers = await this.getAll();
    
    // Sort by createdAt in descending order
    return allCaregivers
      .filter(caregiver => caregiver.status === CaregiverStatus.NEW_APPLICANT)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get all available caregivers
   */
  async getAvailableCaregivers(): Promise<Caregiver[]> {
    // Get all caregivers and filter by status
    const allCaregivers = await this.getAll();
    
    // Sort by createdAt in descending order
    return allCaregivers
      .filter(caregiver => caregiver.status === CaregiverStatus.AVAILABLE)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get caregivers in background check phase
   */
  async getBackgroundCheckCaregivers(): Promise<Caregiver[]> {
    // Get all caregivers and filter by status
    const allCaregivers = await this.getAll();
    
    return allCaregivers.filter(caregiver => caregiver.status === CaregiverStatus.BACKGROUND_CHECK);
  }

  /**
   * Get caregivers who are in training
   */
  async getTrainingCaregivers(): Promise<Caregiver[]> {
    // Get all caregivers and filter by status
    const allCaregivers = await this.getAll();
    
    return allCaregivers.filter(caregiver => caregiver.status === CaregiverStatus.TRAINING);
  }

  /**
   * Get caregivers who are assigned to clients
   */
  async getAssignedCaregivers(): Promise<Caregiver[]> {
    // Get all caregivers and filter by status
    const allCaregivers = await this.getAll();
    
    return allCaregivers.filter(caregiver => caregiver.status === CaregiverStatus.ASSIGNED);
  }

  /**
   * Get caregivers by available days
   */
  async getCaregiversByAvailableDays(days: string[]): Promise<Caregiver[]> {
    // This is a simplified approach - in a real app, we'd need a more complex query
    // or server-side filtering for array-contains-any with multiple values
    const allAvailable = await this.getAvailableCaregivers();
    
    return allAvailable.filter(caregiver => 
      days.some(day => caregiver.availableDays.includes(day))
    );
  }

  /**
   * Find caregivers available to work with a new client
   * This is a more complex query that considers multiple factors
   */
  async findAvailableCaregivers({
    requiredDays,
    location,
    hoursNeeded
  }: {
    requiredDays: string[],
    location: { latitude: number, longitude: number },
    hoursNeeded: number
  }): Promise<Caregiver[]> {
    // Get all available caregivers
    const availableCaregivers = await this.getAvailableCaregivers();
    
    // Filter by availability and capacity
    return availableCaregivers.filter(caregiver => {
      // Check if the caregiver has availability on the required days
      const hasRequiredDays = requiredDays.some(day => 
        caregiver.availableDays.includes(day)
      );
      
      // Check if the caregiver has capacity for more hours
      const hasCapacity = caregiver.currentHoursAssigned + hoursNeeded <= caregiver.preferredHoursPerWeek;
      
      // Check if the caregiver has capacity for another client
      const hasClientCapacity = caregiver.assignedClients.length < caregiver.maxClientsPerWeek;
      
      // For the distance check, we now handle this in the location service
      // This method filters by basic availability first, then location service will filter by distance
      
      return hasRequiredDays && hasCapacity && hasClientCapacity;
    });
  }

  /**
   * Create a new caregiver from application form data
   */
  async createFromApplication(applicationData: any): Promise<Caregiver> {
    // Transform application data to caregiver model
    const newCaregiver: Omit<Caregiver, 'id'> = {
      ...applicationData,
      status: CaregiverStatus.NEW_APPLICANT,
      assignedClients: [],
      currentHoursAssigned: 0,
      backgroundCheckPassed: false,
      trainingCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Geocode the caregiver address before saving
    try {
      const geocodedCaregiver = await locationService.geocodeCaregiverAddress(newCaregiver as Caregiver);
      if (geocodedCaregiver.location) {
        newCaregiver.location = geocodedCaregiver.location;
      }
    } catch (error) {
      console.error('Error geocoding caregiver address:', error);
      // Continue even if geocoding fails
    }
    
    return this.create(newCaregiver);
  }

  /**
   * Override the create method to include geocoding
   */
  async create(data: Omit<Caregiver, 'id'>): Promise<Caregiver> {
    // Geocode the caregiver address before saving if not already provided
    if (!data.location || !data.location.latitude || !data.location.longitude) {
      try {
        const geocodedCaregiver = await locationService.geocodeCaregiverAddress(data as Caregiver);
        if (geocodedCaregiver.location) {
          data = {
            ...data,
            location: geocodedCaregiver.location
          };
        }
      } catch (error) {
        console.error('Error geocoding caregiver address:', error);
        // Continue even if geocoding fails
      }
    }
    
    return super.create(data);
  }

  /**
   * Override the update method to include geocoding when address changes
   */
  async update(id: string, data: Partial<Caregiver>): Promise<Caregiver> {
    // Check if any address-related fields are being updated
    const addressFieldsUpdated = [
      'address', 'city', 'state', 'zip'
    ].some(field => field in data);

    if (addressFieldsUpdated) {
      // Get the current caregiver to merge with updates
      const currentCaregiver = await this.getById(id);
      if (currentCaregiver) {
        // Create merged caregiver object with updates
        const mergedCaregiver = {
          ...currentCaregiver,
          ...data
        };

        // Geocode the updated address
        try {
          const geocodedCaregiver = await locationService.geocodeCaregiverAddress(mergedCaregiver);
          if (geocodedCaregiver.location) {
            data = {
              ...data,
              location: geocodedCaregiver.location
            };
          }
        } catch (error) {
          console.error('Error geocoding updated caregiver address:', error);
          // Continue even if geocoding fails
        }
      }
    }

    return super.update(id, data);
  }

  /**
   * Update caregiver status
   */
  async updateStatus(id: string, status: CaregiverStatus): Promise<Caregiver> {
    return this.update(id, { status });
  }

  /**
   * Geocode all caregiver addresses
   * This can be used to batch update location data
   */
  /**
   * Geocode all caregiver addresses in batches
   * This is more efficient and avoids rate limiting
   */
  async geocodeAllCaregiverAddresses(): Promise<number> {
    const caregivers = await this.getAll();
    let updatedCount = 0;

    // Filter caregivers that need geocoding
    const caregiversToGeocode = caregivers.filter(
      caregiver => !caregiver.location || !caregiver.location.latitude || !caregiver.location.longitude
    );
    
    if (caregiversToGeocode.length === 0) {
      console.log('All caregivers already have location data');
      return 0;
    }
    
    console.log(`Geocoding ${caregiversToGeocode.length} caregivers in batches...`);
    
    // Process in batches of 5 to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < caregiversToGeocode.length; i += batchSize) {
      const batch = caregiversToGeocode.slice(i, i + batchSize);
      
      // Process batch in parallel with Promise.all
      const results = await Promise.all(batch.map(async (caregiver) => {
        try {
          const geocodedCaregiver = await locationService.geocodeCaregiverAddress(caregiver);
          if (geocodedCaregiver.location) {
            await this.update(caregiver.id, { location: geocodedCaregiver.location });
            return 1; // Count as successful update
          }
        } catch (error) {
          console.error(`Error geocoding caregiver ${caregiver.id}:`, error);
        }
        return 0; // Not updated
      }));
      
      // Sum the successful updates in this batch
      updatedCount += results.reduce((sum, count) => sum + count, 0);
      
      // Add a small delay between batches if there are more to process
      if (i + batchSize < caregiversToGeocode.length) {
        console.log(`Processed batch ${i/batchSize + 1}/${Math.ceil(caregiversToGeocode.length/batchSize)}, waiting before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Geocoding completed: ${updatedCount} caregivers updated`);
    return updatedCount;
  }
}
