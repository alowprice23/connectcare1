import { LocalStorageService } from './localStorageService';
import { Client, ClientStatus, ShiftType } from './models';
import { locationService } from './locationService';
import { CaregiverService } from './caregiverService';
import { CaregiverStatus } from './models';

// Create an instance of CaregiverService
const caregiverService = new CaregiverService();

export class ClientService extends LocalStorageService<Client> {
  constructor() {
    super('clients');
  }

  /**
   * Get all unstable clients
   */
  async getUnstableClients(): Promise<Client[]> {
    // Get all clients and filter by status
    const allClients = await this.getAll();
    
    // Sort by createdAt in descending order
    return allClients
      .filter(client => client.status === ClientStatus.UNSTABLE)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get all new client referrals
   */
  async getNewReferrals(): Promise<Client[]> {
    // Get all clients and filter by status
    const allClients = await this.getAll();
    
    // Sort by createdAt in descending order
    return allClients
      .filter(client => client.status === ClientStatus.NEW_REFERRAL)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get all stable clients
   */
  async getStableClients(): Promise<Client[]> {
    // Get all clients and filter by status
    const allClients = await this.getAll();
    
    // Sort by createdAt in descending order
    return allClients
      .filter(client => client.status === ClientStatus.STABLE)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  /**
   * Get all inactive clients
   */
  async getInactiveClients(): Promise<Client[]> {
    // Get all clients and filter by status
    const allClients = await this.getAll();
    
    // Sort by createdAt in descending order
    return allClients
      .filter(client => client.status === ClientStatus.INACTIVE)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get clients by care level (1-5 scale of care intensity)
   */
  async getClientsByCareLevel(level: number): Promise<Client[]> {
    // Get all clients and filter by care level
    const allClients = await this.getAll();
    
    return allClients.filter(client => client.careLevel === level);
  }

  /**
   * Get clients without assigned caregivers for specific shifts
   */
  async getClientsWithUnassignedShifts(): Promise<Client[]> {
    // Get all active clients
    const allClients = await this.getAll();
    
    // Filter to find clients with active status and at least one unassigned shift
    return allClients.filter(client => 
      [ClientStatus.STABLE, ClientStatus.UNSTABLE, ClientStatus.NEW_REFERRAL].includes(client.status) &&
      client.shifts.some(shift => !shift.caregiverId)
    );
  }

  /**
   * Create a new client referral
   */
  async createReferral(referralData: Omit<Client, 'id' | 'status' | 'assignedCaregivers' | 'shifts'>): Promise<Client> {
    // Set up default values for a new referral
    const newClient: Omit<Client, 'id'> = {
      ...referralData,
      status: ClientStatus.NEW_REFERRAL,
      assignedCaregivers: [],
      shifts: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Geocode the client address before saving
    try {
      const geocodedClient = await locationService.geocodeClientAddress(newClient as Client);
      if (geocodedClient.location) {
        newClient.location = geocodedClient.location;
      }
    } catch (error) {
      console.error('Error geocoding client address:', error);
      // Continue even if geocoding fails
    }
    
    return this.create(newClient);
  }

  /**
   * Override the create method to include geocoding
   */
  async create(data: Omit<Client, 'id'>): Promise<Client> {
    // Geocode the client address before saving if not already provided
    if (!data.location || !data.location.latitude || !data.location.longitude) {
      try {
        const geocodedClient = await locationService.geocodeClientAddress(data as Client);
        if (geocodedClient.location) {
          data = {
            ...data,
            location: geocodedClient.location
          };
        }
      } catch (error) {
        console.error('Error geocoding client address:', error);
        // Continue even if geocoding fails
      }
    }
    
    return super.create(data);
  }

  /**
   * Override the update method to include geocoding when address changes
   */
  async update(id: string, data: Partial<Client>): Promise<Client> {
    // Check if any address-related fields are being updated
    const addressFieldsUpdated = [
      'address', 'city', 'state', 'zip'
    ].some(field => field in data);

    if (addressFieldsUpdated) {
      // Get the current client to merge with updates
      const currentClient = await this.getById(id);
      if (currentClient) {
        // Create merged client object with updates
        const mergedClient = {
          ...currentClient,
          ...data
        };

        // Geocode the updated address
        try {
          const geocodedClient = await locationService.geocodeClientAddress(mergedClient);
          if (geocodedClient.location) {
            data = {
              ...data,
              location: geocodedClient.location
            };
          }
        } catch (error) {
          console.error('Error geocoding updated client address:', error);
          // Continue even if geocoding fails
        }
      }
    }

    return super.update(id, data);
  }

  /**
   * Update client status
   */
  async updateStatus(id: string, status: ClientStatus): Promise<Client> {
    return this.update(id, { status });
  }

  /**
   * Add a shift to a client
   */
  async addShift(clientId: string, shift: Client['shifts'][0]): Promise<Client> {
    const client = await this.getById(clientId);
    if (!client) {
      throw new Error(`Client with ID ${clientId} not found`);
    }
    
    const updatedShifts = [...client.shifts, shift];
    return this.update(clientId, { shifts: updatedShifts });
  }

  /**
   * Assign a caregiver to a client's shift
   */
  async assignCaregiverToShift(
    clientId: string, 
    shiftIndex: number, 
    caregiverId: string
  ): Promise<Client> {
    const client = await this.getById(clientId);
    if (!client) {
      throw new Error(`Client with ID ${clientId} not found`);
    }
    
    if (shiftIndex < 0 || shiftIndex >= client.shifts.length) {
      throw new Error(`Invalid shift index: ${shiftIndex}`);
    }
    
    // Update the shift with the caregiver ID
    const updatedShifts = [...client.shifts];
    updatedShifts[shiftIndex] = {
      ...updatedShifts[shiftIndex],
      caregiverId
    };
    
    // Add caregiver to assigned caregivers if not already there
    let updatedAssignedCaregivers = [...client.assignedCaregivers];
    if (!updatedAssignedCaregivers.includes(caregiverId)) {
      updatedAssignedCaregivers.push(caregiverId);
    }
    
    // Update the client with assigned caregiver
    const updatedClient = await this.update(clientId, { 
      shifts: updatedShifts,
      assignedCaregivers: updatedAssignedCaregivers
    });
    
    // Also update caregiver status to ASSIGNED
    try {
      await caregiverService.updateStatus(caregiverId, CaregiverStatus.ASSIGNED);
    } catch (error) {
      console.error('Error updating caregiver status:', error);
      // Continue even if caregiver update fails
      // The store will refresh caregiver lists which should fix any inconsistencies
    }
    
    return updatedClient;;
  }

  /**
   * Geocode all client addresses
   * This can be used to batch update location data
   */
  /**
   * Geocode all client addresses in batches
   * This is more efficient and avoids rate limiting
   */
  async geocodeAllClientsAddresses(): Promise<number> {
    const clients = await this.getAll();
    let updatedCount = 0;

    // Filter clients that need geocoding
    const clientsToGeocode = clients.filter(
      client => !client.location || !client.location.latitude || !client.location.longitude
    );
    
    if (clientsToGeocode.length === 0) {
      console.log('All clients already have location data');
      return 0;
    }
    
    console.log(`Geocoding ${clientsToGeocode.length} clients in batches...`);
    
    // Process in batches of 5 to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < clientsToGeocode.length; i += batchSize) {
      const batch = clientsToGeocode.slice(i, i + batchSize);
      
      // Process batch in parallel with Promise.all
      const results = await Promise.all(batch.map(async (client) => {
        try {
          const geocodedClient = await locationService.geocodeClientAddress(client);
          if (geocodedClient.location) {
            await this.update(client.id, { location: geocodedClient.location });
            return 1; // Count as successful update
          }
        } catch (error) {
          console.error(`Error geocoding client ${client.id}:`, error);
        }
        return 0; // Not updated
      }));
      
      // Sum the successful updates in this batch
      updatedCount += results.reduce((sum, count) => sum + count, 0);
      
      // Add a small delay between batches if there are more to process
      if (i + batchSize < clientsToGeocode.length) {
        console.log(`Processed batch ${i/batchSize + 1}/${Math.ceil(clientsToGeocode.length/batchSize)}, waiting before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Geocoding completed: ${updatedCount} clients updated`);
    return updatedCount;
  }
}
