import React from "react";
import { HelpTooltip } from "components/HelpTooltip";

interface AvailabilityStepProps {
  formData: {
    availableDays: string[];
    availableHours: {
      startTime: string;
      endTime: string;
    };
    maxClientsPerWeek: number;
    preferredHoursPerWeek: number;
  };
  updateFormData: (data: Partial<AvailabilityStepProps["formData"]>) => void;
}

export function AvailabilityStep({ formData, updateFormData }: AvailabilityStepProps) {
  // Days of week
  const daysOfWeek = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ];

  const handleDayToggle = (day: string) => {
    const updatedDays = formData.availableDays.includes(day)
      ? formData.availableDays.filter(d => d !== day)
      : [...formData.availableDays, day];
    
    updateFormData({ availableDays: updatedDays });
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateFormData({
      availableHours: {
        ...formData.availableHours,
        [name]: value
      }
    });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      updateFormData({ [name]: numValue });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        Availability
        <HelpTooltip text="Please indicate when you're available to work and your preferred workload." />
      </h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            Available Days
            <HelpTooltip text="Select all days when you are typically available for caregiving assignments." />
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {daysOfWeek.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => handleDayToggle(day)}
                className={`py-2 px-4 rounded-md border ${formData.availableDays.includes(day) 
                  ? 'bg-blue-100 border-blue-500 text-blue-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            Available Hours
            <HelpTooltip text="Select the time range during which you're typically available to work." />
          </label>
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm text-gray-500 mb-1">
                From
              </label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.availableHours.startTime}
                onChange={handleTimeChange}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="endTime" className="block text-sm text-gray-500 mb-1">
                To
              </label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={formData.availableHours.endTime}
                onChange={handleTimeChange}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="preferredHoursPerWeek" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              Preferred Hours Per Week
              <HelpTooltip text="How many hours would you like to work per week? Must be at least 32 hours." />
            </label>
            <div className="flex items-center">
              <input
                type="number"
                id="preferredHoursPerWeek"
                name="preferredHoursPerWeek"
                min="32"
                max="60"
                value={formData.preferredHoursPerWeek || ''}
                onChange={handleNumberChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-500">hours</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Must be at least 32 hours per week</p>
          </div>

          <div>
            <label htmlFor="maxClientsPerWeek" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              Maximum Clients Per Week
              <HelpTooltip text="What is the maximum number of different clients you can serve per week? Maximum is 2." />
            </label>
            <div className="flex items-center">
              <input
                type="number"
                id="maxClientsPerWeek"
                name="maxClientsPerWeek"
                min="1"
                max="2"
                value={formData.maxClientsPerWeek || ''}
                onChange={handleNumberChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-500">clients</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Maximum of 2 clients per week</p>
          </div>
        </div>
      </div>

      <div className="mt-6 px-4 py-3 bg-blue-50 rounded-md">
        <p className="text-sm text-blue-700">
          <span className="font-semibold">Note:</span> The maximum number of allowed clients per caregiver is 2, and you must be available for at least 32 hours per week to qualify.
        </p>
      </div>
    </div>
  );
}
