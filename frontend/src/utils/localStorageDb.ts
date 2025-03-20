// LocalStorage implementation for data persistence in WordPress deployment
// This service provides a simple data persistence layer using localStorage

// Config to indicate this is a WordPress deployment
const appConfig = {
  // Using Google Maps API key from requirements
  mapsApiKey: "AIzaSyDJGHOUR0YMdnndXOSRZ06CdUj3obDx2jE",
  deploymentType: "wordpress",
  useMockDatabase: true
};

/**
 * Initialize localStorage database
 * This creates the localStorage structure if it doesn't exist
 */
export const initializeLocalStorage = () => {
  // Create storage collections if they don't exist
  const collections = ['caregivers', 'clients', 'schedules'];
  
  collections.forEach(collection => {
    if (!localStorage.getItem(collection)) {
      localStorage.setItem(collection, JSON.stringify({}));
    }
  });
  
  console.log('LocalStorage database initialized successfully');
  return { appConfig };
};

// Initialize right away to ensure the local storage is ready
initializeLocalStorage();

// Export storage configuration
export const db = {
  appConfig
};

// Helper function to get collection data from localStorage
export const getCollection = (collection: string) => {
  const data = localStorage.getItem(collection);
  return data ? JSON.parse(data) : {};
};

// Helper function to save collection data to localStorage
export const saveCollection = (collection: string, data: Record<string, any>) => {
  localStorage.setItem(collection, JSON.stringify(data));
};
