import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { HelpTooltip } from './HelpTooltip';
import { Client } from '../utils/models';

interface ClientPersonalStepProps {
  formData: Partial<Client>;
  updateFormData: (data: Partial<Client>) => void;
}

export function ClientPersonalStep({ formData, updateFormData }: ClientPersonalStepProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  const handleTransportationChange = (name: string, value: boolean | string) => {
    updateFormData({
      transportation: {
        ...formData.transportation,
        [name]: value
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        Personal Information
        <HelpTooltip text="Please provide the client's basic personal information. This will be used to create their profile and match with appropriate caregivers." />
      </h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            First Name
            <HelpTooltip text="Enter the client's legal first name." />
          </Label>
          <Input
            id="firstName"
            name="firstName"
            value={formData.firstName || ''}
            onChange={handleChange}
            className="w-full"
            required
          />
        </div>

        <div>
          <Label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            Last Name
            <HelpTooltip text="Enter the client's legal last name." />
          </Label>
          <Input
            id="lastName"
            name="lastName"
            value={formData.lastName || ''}
            onChange={handleChange}
            className="w-full"
            required
          />
        </div>

        <div>
          <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            Email Address
            <HelpTooltip text="Enter a valid email address for the client or their representative." />
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email || ''}
            onChange={handleChange}
            className="w-full"
            required
          />
        </div>

        <div>
          <Label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            Phone Number
            <HelpTooltip text="Enter the primary contact phone number for the client." />
          </Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
            className="w-full"
            required
          />
        </div>
      </div>

      <h3 className="text-xl font-semibold mt-8 mb-4 flex items-center">
        Address Information
        <HelpTooltip text="Enter the client's residential address where care will be provided." />
      </h3>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Street Address
          </Label>
          <Input
            id="address"
            name="address"
            value={formData.address || ''}
            onChange={handleChange}
            className="w-full"
            required
          />
        </div>

        <div>
          <Label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            City
          </Label>
          <Input
            id="city"
            name="city"
            value={formData.city || ''}
            onChange={handleChange}
            className="w-full"
            required
          />
        </div>

        <div>
          <Label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
            State
          </Label>
          <Input
            id="state"
            name="state"
            value={formData.state || ''}
            onChange={handleChange}
            className="w-full"
            required
          />
        </div>

        <div>
          <Label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">
            ZIP Code
          </Label>
          <Input
            id="zip"
            name="zip"
            value={formData.zip || ''}
            onChange={handleChange}
            className="w-full"
            required
          />
        </div>
      </div>

      <h3 className="text-xl font-semibold mt-8 mb-4 flex items-center">
        Transportation
        <HelpTooltip text="Information about the client's transportation situation and needs." />
      </h3>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex items-center space-x-2">
          <Switch 
            id="hasCar" 
            checked={formData.transportation?.hasCar || false}
            onCheckedChange={(checked) => handleTransportationChange('hasCar', checked)}
          />
          <Label htmlFor="hasCar" className="cursor-pointer">Has Car</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="onBusLine" 
            checked={formData.transportation?.onBusLine || false}
            onCheckedChange={(checked) => handleTransportationChange('onBusLine', checked)}
          />
          <Label htmlFor="onBusLine" className="cursor-pointer">On Bus Line</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="needsTransportation" 
            checked={formData.transportation?.needsTransportation || false}
            onCheckedChange={(checked) => handleTransportationChange('needsTransportation', checked)}
          />
          <Label htmlFor="needsTransportation" className="cursor-pointer">Needs Transportation</Label>
        </div>

        <div className="md:col-span-3">
          <Label htmlFor="transportationNotes" className="block text-sm font-medium text-gray-700 mb-1">
            Transportation Notes
          </Label>
          <Input
            id="transportationNotes"
            value={formData.transportation?.transportationNotes || ''}
            onChange={(e) => handleTransportationChange('transportationNotes', e.target.value)}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
