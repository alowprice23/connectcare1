import { getCollection, saveCollection } from './localStorageDb';

/**
 * LocalStorage data service for WordPress deployment
 * Provides CRUD operations for data persistence using browser's localStorage
 */
export class LocalStorageService<T extends { id?: string }> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  /**
   * Create a new document in the collection
   */
  async create(data: Omit<T, 'id'>): Promise<T> {
    const timestamp = new Date();
    const id = this.generateId();
    
    // Add timestamps
    const dataToSave = {
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Get current collection data
    const collectionData = getCollection(this.collectionName);
    
    // Add new document
    collectionData[id] = dataToSave;
    
    // Save back to localStorage
    saveCollection(this.collectionName, collectionData);
    
    return { id, ...data } as T;
  }

  /**
   * Create a document with a specific ID
   */
  async createWithId(id: string, data: Omit<T, 'id'>): Promise<T> {
    const timestamp = new Date();
    
    // Add timestamps
    const dataToSave = {
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Get current collection data
    const collectionData = getCollection(this.collectionName);
    
    // Add new document with specified ID
    collectionData[id] = dataToSave;
    
    // Save back to localStorage
    saveCollection(this.collectionName, collectionData);
    
    return { id, ...data } as T;
  }

  /**
   * Get a document by ID
   */
  async getById(id: string): Promise<T | null> {
    const collectionData = getCollection(this.collectionName);
    
    if (collectionData[id]) {
      return { id, ...collectionData[id] } as T;
    }
    
    return null;
  }

  /**
   * Update a document by ID
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    const collectionData = getCollection(this.collectionName);
    
    if (!collectionData[id]) {
      throw new Error(`Document with ID ${id} not found`);
    }
    
    // Add updated timestamp
    const dataToUpdate = {
      ...collectionData[id],
      ...data,
      updatedAt: new Date(),
    };
    
    // Update document
    collectionData[id] = dataToUpdate;
    
    // Save back to localStorage
    saveCollection(this.collectionName, collectionData);
    
    return { id, ...dataToUpdate } as T;
  }

  /**
   * Delete a document by ID
   */
  async delete(id: string): Promise<void> {
    const collectionData = getCollection(this.collectionName);
    
    if (collectionData[id]) {
      delete collectionData[id];
      saveCollection(this.collectionName, collectionData);
    }
  }

  /**
   * Get all documents in the collection
   */
  async getAll(): Promise<T[]> {
    const collectionData = getCollection(this.collectionName);
    
    return Object.entries(collectionData).map(([id, data]) => ({
      id,
      ...data,
    })) as T[];
  }

  /**
   * Query documents with filters
   * This is a simplified query implementation for localStorage
   * It supports basic filtering but not complex queries
   */
  async query(filters: Record<string, any>): Promise<T[]> {
    const collectionData = getCollection(this.collectionName);
    
    // Convert the collection object to an array
    const documents = Object.entries(collectionData).map(([id, data]) => ({
      id,
      ...data,
    }));
    
    // Filter documents based on filter criteria
    return documents.filter(doc => {
      // Check if document matches all filter criteria
      return Object.entries(filters).every(([field, value]) => {
        return doc[field] === value;
      });
    }) as T[];
  }
  
  /**
   * Generate a random ID for new records
   */
  private generateId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 20; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
