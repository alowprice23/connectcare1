import React from 'react';
import { HelpTooltip } from './HelpTooltip';
import { Client, ClientStatus, ShiftType } from '../utils/models';
import { format } from 'date-fns';

interface ClientReviewStepProps {
  formData: Partial<Client>;
  updateFormData: (data: Partial<Client>) => void;
  isEditing: boolean;
}

export function ClientReviewStep({ formData, updateFormData, isEditing }: ClientReviewStepProps) {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const getStatusLabel = (status: string | undefined) => {
    switch (status) {
      case ClientStatus.NEW_REFERRAL:
        return 'New Referral';
      case ClientStatus.UNSTABLE:
        return 'Unstable';
      case ClientStatus.STABLE:
        return 'Stable';
      case ClientStatus.INACTIVE:
        return 'Inactive';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case ClientStatus.NEW_REFERRAL:
        return 'bg-yellow-100 text-yellow-800';
      case ClientStatus.UNSTABLE:
        return 'bg-red-100 text-red-800';
      case ClientStatus.STABLE:
        return 'bg-green-100 text-green-800';
      case ClientStatus.INACTIVE:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getShiftTypeLabel = (type: string | undefined) => {
    switch (type) {
      case ShiftType.MORNING:
        return 'Morning';
      case ShiftType.AFTERNOON:
        return 'Afternoon';
      case ShiftType.EVENING:
        return 'Evening';
      case ShiftType.OVERNIGHT:
        return 'Overnight';
      default:
        return type || 'Unknown';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        Review {isEditing ? 'Client Information' : 'Application'}
        <HelpTooltip text="Please review all client information before submitting." />
      </h2>

      <div className="space-y-8">
        {/* Status Badge */}
        <div className="flex items-center justify-center mb-6">
          <span className={`px-4 py-2 rounded-full ${getStatusColor(formData.status)}`}>
            {getStatusLabel(formData.status)}
          </span>
        </div>

        {/* Personal Information Section */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex">
              <span className="font-medium text-gray-500 w-1/3">Name:</span>
              <span className="text-gray-900">{formData.firstName} {formData.lastName}</span>
            </div>
            <div className="flex">
              <span className="font-medium text-gray-500 w-1/3">Email:</span>
              <span className="text-gray-900">{formData.email}</span>
            </div>
            <div className="flex">
              <span className="font-medium text-gray-500 w-1/3">Phone:</span>
              <span className="text-gray-900">{formData.phone}</span>
            </div>
            <div className="flex md:col-span-2">
              <span className="font-medium text-gray-500 w-1/3 md:w-1/6">Address:</span>
              <span className="text-gray-900">{formData.address}, {formData.city}, {formData.state} {formData.zip}</span>
            </div>
          </div>
        </div>

        {/* Transportation Section */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Transportation</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-center">
              <span className="font-medium text-gray-500 mr-2">Has Car:</span>
              <span className="text-gray-900">{formData.transportation?.hasCar ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium text-gray-500 mr-2">On Bus Line:</span>
              <span className="text-gray-900">{formData.transportation?.onBusLine ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium text-gray-500 mr-2">Needs Transportation:</span>
              <span className="text-gray-900">{formData.transportation?.needsTransportation ? 'Yes' : 'No'}</span>
            </div>
            {formData.transportation?.transportationNotes && (
              <div className="flex md:col-span-3">
                <span className="font-medium text-gray-500 w-1/3 md:w-1/6">Notes:</span>
                <span className="text-gray-900">{formData.transportation?.transportationNotes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Care Needs Section */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Care Needs & Preferences</h3>
          <div className="space-y-4">
            <div className="flex">
              <span className="font-medium text-gray-500 w-1/3 md:w-1/6">Care Level:</span>
              <span className="text-gray-900">{formData.careLevel}/5</span>
            </div>
            
            <div>
              <span className="font-medium text-gray-500 block mb-2">Care Needs:</span>
              <div className="flex flex-wrap gap-2">
                {formData.careNeeds && formData.careNeeds.length > 0 ? (
                  formData.careNeeds.map((need, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm">
                      {need}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">None specified</span>
                )}
              </div>
            </div>
            
            <div>
              <span className="font-medium text-gray-500 block mb-2">Medical Conditions:</span>
              <div className="flex flex-wrap gap-2">
                {formData.medicalConditions && formData.medicalConditions.length > 0 ? (
                  formData.medicalConditions.map((condition, index) => (
                    <span key={index} className="bg-red-100 text-red-800 rounded-full px-3 py-1 text-sm">
                      {condition}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">None specified</span>
                )}
              </div>
            </div>
            
            <div>
              <span className="font-medium text-gray-500 block mb-2">Preferred Caregiver Traits:</span>
              <div className="flex flex-wrap gap-2">
                {formData.preferredCaregiverTraits && formData.preferredCaregiverTraits.length > 0 ? (
                  formData.preferredCaregiverTraits.map((trait, index) => (
                    <span key={index} className="bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm">
                      {trait}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">None specified</span>
                )}
              </div>
            </div>
            
            {formData.notes && (
              <div>
                <span className="font-medium text-gray-500 block mb-2">Additional Notes:</span>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{formData.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Schedule Section */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule & Authorization</h3>
          
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">Authorization Details</h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 bg-gray-50 p-3 rounded-md">
              <div>
                <span className="font-medium text-gray-500 block">Start Date:</span>
                <span className="text-gray-900">{formatDate(formData.authorization?.startDate)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-500 block">End Date:</span>
                <span className="text-gray-900">{formatDate(formData.authorization?.endDate)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-500 block">Authorized Hours:</span>
                <span className="text-gray-900">{formData.authorization?.totalAuthorizedHours || 0}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Weekly Schedule</h4>
            {formData.shifts && formData.shifts.length > 0 ? (
              <div className="overflow-hidden border rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.shifts.map((shift, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{shift.dayOfWeek}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{getShiftTypeLabel(shift.type)}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{shift.startTime} - {shift.endTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No shifts scheduled</p>
            )}
          </div>
        </div>

        {/* Emergency Contact Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <span className="font-medium text-gray-500 block">Name:</span>
                <span className="text-gray-900">{formData.emergencyContact?.name || 'Not provided'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-500 block">Relationship:</span>
                <span className="text-gray-900">{formData.emergencyContact?.relationship || 'Not specified'}</span>
              </div>
              <div className="md:col-span-2">
                <span className="font-medium text-gray-500 block">Phone:</span>
                <span className="text-gray-900">{formData.emergencyContact?.phone || 'Not provided'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
