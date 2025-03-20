import { Caregiver, CaregiverStatus, Client, ClientStatus, ShiftType } from './models';
import { getCollection, saveCollection } from './localStorageDb';

/**
 * Sample data for testing and development
 * This data will be loaded into localStorage when the app starts
 */

// Sample caregivers with different statuses
const sampleCaregivers: Record<string, Omit<Caregiver, 'id'>> = {
  'caregiver1': {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '555-123-4567',
    address: '123 Main Street',
    city: 'Springfield',
    state: 'IL',
    zip: '62701',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15'),
    status: CaregiverStatus.AVAILABLE,
    dateOfBirth: '1985-05-15',
    yearsExperience: '5',
    education: 'Bachelor of Science in Nursing',
    certifications: ['CPR', 'First Aid', 'CNA'],
    skills: ['Medication Management', 'Mobility Assistance', 'Wound Care'],
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    availableHours: {
      startTime: '08:00',
      endTime: '17:00'
    },
    preferredHoursPerWeek: 40,
    maxClientsPerWeek: 2,
    serviceRadius: 15,
    transportation: 'Own vehicle',
    preferredLocations: ['Springfield', 'Shelbyville'],
    references: [
      {
        name: 'Dr. John Williams',
        relationship: 'Former Employer',
        phone: '555-987-6543',
        email: 'jwilliams@hospital.org'
      }
    ],
    assignedClients: [],
    currentHoursAssigned: 0,
    backgroundCheckPassed: true,
    trainingCompleted: true
  },
  'caregiver2': {
    firstName: 'Robert',
    lastName: 'Johnson',
    email: 'robert.j@example.com',
    phone: '555-321-7654',
    address: '456 Oak Avenue',
    city: 'Springfield',
    state: 'IL',
    zip: '62702',
    createdAt: new Date('2023-02-10'),
    updatedAt: new Date('2023-02-10'),
    status: CaregiverStatus.NEW_APPLICANT,
    dateOfBirth: '1990-08-21',
    yearsExperience: '2',
    education: 'Associate Degree in Healthcare',
    certifications: ['CPR'],
    skills: ['Companionship', 'Meal Preparation', 'Light Housekeeping'],
    availableDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
    availableHours: {
      startTime: '10:00',
      endTime: '18:00'
    },
    preferredHoursPerWeek: 32,
    maxClientsPerWeek: 2,
    serviceRadius: 10,
    transportation: 'Public transportation',
    preferredLocations: ['Springfield'],
    references: [
      {
        name: 'Sarah Chen',
        relationship: 'Former Supervisor',
        phone: '555-456-7890',
        email: 'schen@careagency.com'
      }
    ],
    assignedClients: [],
    currentHoursAssigned: 0,
    backgroundCheckPassed: false,
    trainingCompleted: false
  },
  'caregiver3': {
    firstName: 'Maria',
    lastName: 'Garcia',
    email: 'maria.g@example.com',
    phone: '555-789-1234',
    address: '789 Elm Street',
    city: 'Shelbyville',
    state: 'IL',
    zip: '62565',
    createdAt: new Date('2023-03-05'),
    updatedAt: new Date('2023-03-05'),
    status: CaregiverStatus.ASSIGNED,
    dateOfBirth: '1982-11-03',
    yearsExperience: '7',
    education: 'Bachelor of Arts in Psychology',
    certifications: ['CPR', 'First Aid', 'HHA'],
    skills: ['Dementia Care', 'Medication Management', 'Personal Care'],
    availableDays: ['Tuesday', 'Thursday', 'Saturday', 'Sunday'],
    availableHours: {
      startTime: '07:00',
      endTime: '19:00'
    },
    preferredHoursPerWeek: 36,
    maxClientsPerWeek: 2,
    serviceRadius: 20,
    transportation: 'Own vehicle',
    preferredLocations: ['Shelbyville', 'Springfield'],
    references: [
      {
        name: 'Michael Brown',
        relationship: 'Former Client',
        phone: '555-234-5678',
        email: 'mbrown@example.com'
      }
    ],
    assignedClients: ['client1'],
    currentHoursAssigned: 25,
    backgroundCheckPassed: true,
    trainingCompleted: true
  }
};

// Sample clients with different statuses
const sampleClients: Record<string, Omit<Client, 'id'>> = {
  'client1': {
    firstName: 'Eleanor',
    lastName: 'Wilson',
    email: 'ewilson@example.com',
    phone: '555-111-2222',
    address: '101 Pine Street',
    city: 'Springfield',
    state: 'IL',
    zip: '62704',
    createdAt: new Date('2023-01-20'),
    updatedAt: new Date('2023-01-20'),
    status: ClientStatus.STABLE,
    careNeeds: ['Medication Reminders', 'Meal Preparation', 'Light Housekeeping'],
    medicalConditions: ['Arthritis', 'Hypertension'],
    careLevel: 2,
    emergencyContact: {
      name: 'Thomas Wilson',
      relationship: 'Son',
      phone: '555-333-4444'
    },
    preferredCaregiverTraits: ['Patient', 'Experienced with seniors'],
    assignedCaregivers: ['caregiver3'],
    shifts: [
      {
        type: ShiftType.MORNING,
        dayOfWeek: 'Tuesday',
        startTime: '08:00',
        endTime: '12:00',
        caregiverId: 'caregiver3'
      },
      {
        type: ShiftType.MORNING,
        dayOfWeek: 'Thursday',
        startTime: '08:00',
        endTime: '12:00',
        caregiverId: 'caregiver3'
      },
      {
        type: ShiftType.AFTERNOON,
        dayOfWeek: 'Saturday',
        startTime: '13:00',
        endTime: '17:00',
        caregiverId: 'caregiver3'
      }
    ],
    notes: 'Prefers female caregivers. Enjoys reading and classical music.',
    location: {
      latitude: 39.78,
      longitude: -89.65
    }
  },
  'client2': {
    firstName: 'Frank',
    lastName: 'Miller',
    email: 'fmiller@example.com',
    phone: '555-555-6666',
    address: '202 Maple Drive',
    city: 'Springfield',
    state: 'IL',
    zip: '62703',
    createdAt: new Date('2023-02-15'),
    updatedAt: new Date('2023-02-15'),
    status: ClientStatus.UNSTABLE,
    careNeeds: ['Personal Care', 'Mobility Assistance', 'Medication Management'],
    medicalConditions: ['Parkinson\'s Disease', 'Diabetes'],
    careLevel: 4,
    emergencyContact: {
      name: 'Lisa Miller',
      relationship: 'Daughter',
      phone: '555-777-8888'
    },
    preferredCaregiverTraits: ['Strong', 'Experience with Parkinson\'s'],
    assignedCaregivers: [],
    shifts: [
      {
        type: ShiftType.MORNING,
        dayOfWeek: 'Monday',
        startTime: '07:00',
        endTime: '11:00'
      },
      {
        type: ShiftType.EVENING,
        dayOfWeek: 'Monday',
        startTime: '17:00',
        endTime: '21:00'
      },
      {
        type: ShiftType.MORNING,
        dayOfWeek: 'Wednesday',
        startTime: '07:00',
        endTime: '11:00'
      },
      {
        type: ShiftType.EVENING,
        dayOfWeek: 'Wednesday',
        startTime: '17:00',
        endTime: '21:00'
      },
      {
        type: ShiftType.MORNING,
        dayOfWeek: 'Friday',
        startTime: '07:00',
        endTime: '11:00'
      },
      {
        type: ShiftType.EVENING,
        dayOfWeek: 'Friday',
        startTime: '17:00',
        endTime: '21:00'
      }
    ],
    notes: 'Recently discharged from hospital. Needs close monitoring.',
    location: {
      latitude: 39.76,
      longitude: -89.63
    }
  },
  'client3': {
    firstName: 'David',
    lastName: 'Thompson',
    email: 'info@davidthompson.org',
    phone: '555-999-0000',
    address: '303 Cedar Lane',
    city: 'Shelbyville',
    state: 'IL',
    zip: '62565',
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2023-03-10'),
    status: ClientStatus.NEW_REFERRAL,
    careNeeds: ['Companionship', 'Transportation', 'Meal Preparation'],
    medicalConditions: ['Recovering from hip surgery'],
    careLevel: 3,
    emergencyContact: {
      name: 'Sarah Thompson',
      relationship: 'Wife',
      phone: '555-111-3333'
    },
    preferredCaregiverTraits: ['Punctual', 'Good driver'],
    assignedCaregivers: [],
    shifts: [],
    notes: 'Referred by Springfield General Hospital. Initial assessment pending.',
    location: {
      latitude: 39.41,
      longitude: -89.48
    }
  }
};

/**
 * Initialize the database with sample data
 */
export const initializeSampleData = () => {
  // Check if we already have data (don't overwrite user data)
  const caregivers = getCollection('caregivers');
  const clients = getCollection('clients');
  
  // Only initialize if empty
  if (Object.keys(caregivers).length === 0) {
    console.log('Initializing sample caregivers data...');
    saveCollection('caregivers', sampleCaregivers);
  }
  
  if (Object.keys(clients).length === 0) {
    console.log('Initializing sample clients data...');
    saveCollection('clients', sampleClients);
  }
};
