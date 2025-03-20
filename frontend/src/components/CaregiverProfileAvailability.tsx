import React from 'react';
import { Caregiver, CaregiverStatus } from 'utils/models';
import { Card } from "@/components/ui/card";
import { Clock, MapPin, Car } from "lucide-react";

interface Props {
  caregiver: Caregiver;
}

const CaregiverProfileAvailability: React.FC<Props> = ({ caregiver }) => {
  return (
    <div className="space-y-6">
      <Card className="p-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Clock className="mr-2 h-5 w-5 text-blue-500" /> Schedule & Preferences
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Available Days</h3>
            <div className="flex flex-wrap gap-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <span 
                  key={day} 
                  className={`px-3 py-1 rounded-full text-sm ${caregiver.availableDays.includes(day) 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-400'}`}
                >
                  {day}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-2">Available Hours</h3>
            <p className="text-gray-900">
              {caregiver.availableHours.startTime} - {caregiver.availableHours.endTime}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Preferred Hours Per Week</h3>
            <div className="flex items-center">
              <div className="mr-4">
                <span className="text-xl font-semibold text-gray-900">{caregiver.preferredHoursPerWeek}</span>
                <span className="text-gray-500 text-sm ml-1">hours</span>
              </div>
              {caregiver.status === CaregiverStatus.ASSIGNED && (
                <div className="bg-blue-50 px-3 py-1 rounded-md">
                  <span className="text-sm text-blue-700">
                    Currently assigned: <span className="font-medium">{caregiver.currentHoursAssigned}</span> hours
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-2">Maximum Clients</h3>
            <div className="flex items-center">
              <div className="mr-4">
                <span className="text-xl font-semibold text-gray-900">{caregiver.maxClientsPerWeek}</span>
                <span className="text-gray-500 text-sm ml-1">clients</span>
              </div>
              {caregiver.status === CaregiverStatus.ASSIGNED && (
                <div className="bg-blue-50 px-3 py-1 rounded-md">
                  <span className="text-sm text-blue-700">
                    Currently assigned: <span className="font-medium">{caregiver.assignedClients.length}</span> clients
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <MapPin className="mr-2 h-5 w-5 text-blue-500" /> Location & Transportation
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Service Radius</h3>
            <div className="flex items-center">
              <span className="text-xl font-semibold text-gray-900">{caregiver.serviceRadius}</span>
              <span className="text-gray-500 text-sm ml-1">miles</span>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-2">Transportation</h3>
            <div className="flex items-center">
              <Car className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-900">{caregiver.transportation}</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-medium text-gray-700 mb-2">Preferred Locations</h3>
          <div className="flex flex-wrap gap-2">
            {caregiver.preferredLocations.map((location, index) => (
              <span key={index} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                {location}
              </span>
            ))}
            {caregiver.preferredLocations.length === 0 && (
              <p className="text-gray-500 text-sm">No preferred locations specified</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CaregiverProfileAvailability;