import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HelpTooltip } from './HelpTooltip';
import { Client, ClientStatus } from '../utils/models';

interface ClientEmergencyStepProps {
  formData: Partial<Client>;
  updateFormData: (data: Partial<Client>) => void;
}

export function ClientEmergencyStep({ formData, updateFormData }: ClientEmergencyStepProps) {
  // Handle emergency contact changes
  const handleEmergencyContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateFormData({
      emergencyContact: {
        ...formData.emergencyContact,
        [name]: value
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        Emergency Contact & Status
        <HelpTooltip text="Provide emergency contact information and set the client's status." />
      </h2>

      {/* Emergency Contact */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          Emergency Contact
          <HelpTooltip text="Provide information for the primary emergency contact." />
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="emergencyName" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </Label>
            <Input
              id="emergencyName"
              name="name"
              value={formData.emergencyContact?.name || ''}
              onChange={handleEmergencyContactChange}
              className="w-full"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="emergencyRelationship" className="block text-sm font-medium text-gray-700 mb-1">
              Relationship
            </Label>
            <Input
              id="emergencyRelationship"
              name="relationship"
              value={formData.emergencyContact?.relationship || ''}
              onChange={handleEmergencyContactChange}
              className="w-full"
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <Label htmlFor="emergencyPhone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </Label>
            <Input
              id="emergencyPhone"
              name="phone"
              value={formData.emergencyContact?.phone || ''}
              onChange={handleEmergencyContactChange}
              className="w-full"
              required
            />
          </div>
        </div>
      </div>

      {/* Client Status */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          Client Status
          <HelpTooltip text="Set the client's current status in the system." />
        </h3>
        <div className="max-w-md">
          <Label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Current Status
          </Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => updateFormData({ status: value as ClientStatus })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ClientStatus.NEW_REFERRAL}>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
                  New Referral
                </div>
              </SelectItem>
              <SelectItem value={ClientStatus.UNSTABLE}>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  Unstable
                </div>
              </SelectItem>
              <SelectItem value={ClientStatus.STABLE}>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  Stable
                </div>
              </SelectItem>
              <SelectItem value={ClientStatus.INACTIVE}>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
                  Inactive
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <div className="mt-4 bg-gray-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Status Definitions:</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <div className="w-3 h-3 rounded-full bg-yellow-400 mt-1 mr-2"></div>
                <span><strong>New Referral:</strong> Recently added, awaiting initial assessment</span>
              </li>
              <li className="flex items-start">
                <div className="w-3 h-3 rounded-full bg-red-500 mt-1 mr-2"></div>
                <span><strong>Unstable:</strong> High priority, needs immediate caregiver matching</span>
              </li>
              <li className="flex items-start">
                <div className="w-3 h-3 rounded-full bg-green-500 mt-1 mr-2"></div>
                <span><strong>Stable:</strong> Needs met, caregiver assigned and shifts filled</span>
              </li>
              <li className="flex items-start">
                <div className="w-3 h-3 rounded-full bg-gray-400 mt-1 mr-2"></div>
                <span><strong>Inactive:</strong> Not currently receiving services</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
