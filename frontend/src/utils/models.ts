// Base user type with shared fields
export interface Location {
  latitude: number;
  longitude: number;
}

export interface BaseUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  createdAt: Date;
  updatedAt: Date;
}

// Status tracks where in the lifecycle a caregiver is
export enum CaregiverStatus {
  NEW_APPLICANT = 'new_applicant',
  BACKGROUND_CHECK = 'background_check',
  TRAINING = 'training',
  AVAILABLE = 'available',
  ASSIGNED = 'assigned',
  INACTIVE = 'inactive',
}

// Caregiver model
export interface Caregiver extends BaseUser {
  status: CaregiverStatus;
  dateOfBirth: string;
  yearsExperience: string;
  education: string;
  certifications: string[];
  skills: string[];
  availableDays: string[];
  availableHours: {
    startTime: string;
    endTime: string;
  };
  preferredHoursPerWeek: number;
  maxClientsPerWeek: number;
  serviceRadius: number;
  transportation: string;
  preferredLocations: string[];
  references: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
  }[];
  assignedClients: string[];
  currentHoursAssigned: number;
  backgroundCheckPassed: boolean;
  trainingCompleted: boolean;
  location?: Location;
}

// Client status to track their stability and needs
export enum ClientStatus {
  STABLE = 'stable',
  UNSTABLE = 'unstable',
  NEW_REFERRAL = 'new_referral',
  INACTIVE = 'inactive',
}

// Shift types
export enum ShiftType {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
}

// Client model
export interface Client extends BaseUser {
  transportation?: {
    hasCar: boolean;
    onBusLine: boolean;
    needsTransportation: boolean;
    transportationNotes: string;
  };

  status: ClientStatus;
  medicalConditions: string[];
  careLevel: number; // 1-5 scale of care intensity
  careNeeds: string[]; // Skills needed for care
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  
  // Client properties
  preferredCaregiverTraits: string[];
  assignedCaregivers: string[];
  shifts: {
    type: ShiftType;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    caregiverId?: string; // Optional, as it may not be assigned yet
  }[];
  notes: string;
  
  // Authorization details
  authorization?: {
    startDate: string;
    endDate: string;
    totalAuthorizedHours: number;
    calculatedWeeklyHours?: number; // Derived field
  };
  
  // Multiple authorizations support (up to 12 per year)
  authorizations?: {
    id: string;
    startDate: string;
    endDate: string;
    totalAuthorizedHours: number;
    calculatedWeeklyHours?: number; // Derived field
    active: boolean; // To mark if authorization is active or deleted/archived
    createdAt: Date; // To track when it was added
  }[];
  
  // Location data
  location?: Location;
}
