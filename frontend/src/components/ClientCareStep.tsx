import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HelpTooltip } from './HelpTooltip';
import { Client } from '../utils/models';
import { X, Plus } from 'lucide-react';

interface ClientCareStepProps {
  formData: Partial<Client>;
  updateFormData: (data: Partial<Client>) => void;
}

export function ClientCareStep({ formData, updateFormData }: ClientCareStepProps) {
  const [newCareNeed, setNewCareNeed] = useState('');
  const [newMedicalCondition, setNewMedicalCondition] = useState('');
  const [newPreferredTrait, setNewPreferredTrait] = useState('');

  // Add care need
  const addCareNeed = () => {
    if (newCareNeed.trim()) {
      updateFormData({
        careNeeds: [...(formData.careNeeds || []), newCareNeed.trim()]
      });
      setNewCareNeed('');
    }
  };
  
  // Remove care need
  const removeCareNeed = (index: number) => {
    updateFormData({
      careNeeds: formData.careNeeds?.filter((_, i) => i !== index) || []
    });
  };
  
  // Add medical condition
  const addMedicalCondition = () => {
    if (newMedicalCondition.trim()) {
      updateFormData({
        medicalConditions: [...(formData.medicalConditions || []), newMedicalCondition.trim()]
      });
      setNewMedicalCondition('');
    }
  };
  
  // Remove medical condition
  const removeMedicalCondition = (index: number) => {
    updateFormData({
      medicalConditions: formData.medicalConditions?.filter((_, i) => i !== index) || []
    });
  };
  
  // Add preferred trait
  const addPreferredTrait = () => {
    if (newPreferredTrait.trim()) {
      updateFormData({
        preferredCaregiverTraits: [...(formData.preferredCaregiverTraits || []), newPreferredTrait.trim()]
      });
      setNewPreferredTrait('');
    }
  };
  
  // Remove preferred trait
  const removePreferredTrait = (index: number) => {
    updateFormData({
      preferredCaregiverTraits: formData.preferredCaregiverTraits?.filter((_, i) => i !== index) || []
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        Care Needs & Preferences
        <HelpTooltip text="Please specify the client's care needs, medical conditions, and preferences for caregivers." />
      </h2>

      {/* Care Level */}
      <div className="mb-6">
        <Label htmlFor="careLevel" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
          Care Level (1-5)
          <HelpTooltip text="1 = Minimal assistance, 5 = Intensive care required" />
        </Label>
        <Select 
          value={formData.careLevel?.toString()} 
          onValueChange={(value) => updateFormData({ careLevel: parseInt(value) })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select care level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 - Minimal (companionship, light housekeeping)</SelectItem>
            <SelectItem value="2">2 - Low (some ADL assistance, medication reminders)</SelectItem>
            <SelectItem value="3">3 - Moderate (regular ADL assistance, some mobility help)</SelectItem>
            <SelectItem value="4">4 - High (extensive ADL assistance, mobility transfers)</SelectItem>
            <SelectItem value="5">5 - Intensive (complete care, complex medical needs)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Care Needs */}
      <div className="mb-6">
        <Label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
          Care Needs
          <HelpTooltip text="List specific care needs the client requires assistance with." />
        </Label>
        <div className="flex space-x-2 mb-2">
          <Input
            value={newCareNeed}
            onChange={(e) => setNewCareNeed(e.target.value)}
            placeholder="Enter care need (e.g., Bathing, Meal Prep)"
            className="flex-grow"
            onKeyDown={(e) => e.key === 'Enter' && addCareNeed()}
          />
          <Button type="button" onClick={addCareNeed}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3">
          {formData.careNeeds?.map((need, index) => (
            <div key={index} className="flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1">
              <span>{need}</span>
              <button 
                type="button" 
                onClick={() => removeCareNeed(index)} 
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {(!formData.careNeeds || formData.careNeeds.length === 0) && (
            <div className="text-gray-500 text-sm">No care needs added yet</div>
          )}
        </div>
      </div>
      
      {/* Medical Conditions */}
      <div className="mb-6">
        <Label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
          Medical Conditions
          <HelpTooltip text="List any medical conditions that caregivers should be aware of." />
        </Label>
        <div className="flex space-x-2 mb-2">
          <Input
            value={newMedicalCondition}
            onChange={(e) => setNewMedicalCondition(e.target.value)}
            placeholder="Enter medical condition"
            className="flex-grow"
            onKeyDown={(e) => e.key === 'Enter' && addMedicalCondition()}
          />
          <Button type="button" onClick={addMedicalCondition}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3">
          {formData.medicalConditions?.map((condition, index) => (
            <div key={index} className="flex items-center bg-red-100 text-red-800 rounded-full px-3 py-1">
              <span>{condition}</span>
              <button 
                type="button" 
                onClick={() => removeMedicalCondition(index)} 
                className="ml-2 text-red-600 hover:text-red-800"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {(!formData.medicalConditions || formData.medicalConditions.length === 0) && (
            <div className="text-gray-500 text-sm">No medical conditions added yet</div>
          )}
        </div>
      </div>
      
      {/* Preferred Caregiver Traits */}
      <div className="mb-6">
        <Label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
          Preferred Caregiver Traits
          <HelpTooltip text="List any preferred characteristics or qualifications for caregivers." />
        </Label>
        <div className="flex space-x-2 mb-2">
          <Input
            value={newPreferredTrait}
            onChange={(e) => setNewPreferredTrait(e.target.value)}
            placeholder="Enter preferred trait (e.g., Female, Spanish-speaking)"
            className="flex-grow"
            onKeyDown={(e) => e.key === 'Enter' && addPreferredTrait()}
          />
          <Button type="button" onClick={addPreferredTrait}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3">
          {formData.preferredCaregiverTraits?.map((trait, index) => (
            <div key={index} className="flex items-center bg-green-100 text-green-800 rounded-full px-3 py-1">
              <span>{trait}</span>
              <button 
                type="button" 
                onClick={() => removePreferredTrait(index)} 
                className="ml-2 text-green-600 hover:text-green-800"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {(!formData.preferredCaregiverTraits || formData.preferredCaregiverTraits.length === 0) && (
            <div className="text-gray-500 text-sm">No caregiver preferences added yet</div>
          )}
        </div>
      </div>
      
      {/* Notes */}
      <div className="mb-6">
        <Label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
          Additional Notes
          <HelpTooltip text="Any additional information about the client's needs or preferences." />
        </Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes || ''}
          onChange={(e) => updateFormData({ notes: e.target.value })}
          rows={4}
          className="w-full"
        />
      </div>
    </div>
  );
}
