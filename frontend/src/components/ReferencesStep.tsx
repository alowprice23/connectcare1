import React, { useState } from "react";
import { HelpTooltip } from "components/HelpTooltip";
import { PlusCircle, XCircle } from "lucide-react";
import { Button } from "components/Button";

interface ReferencesStepProps {
  formData: {
    references: {
      name: string;
      relationship: string;
      phone: string;
      email: string;
    }[];
  };
  updateFormData: (data: Partial<ReferencesStepProps["formData"]>) => void;
}

export function ReferencesStep({ formData, updateFormData }: ReferencesStepProps) {
  const addReference = () => {
    const updatedReferences = [...formData.references];
    updatedReferences.push({
      name: "",
      relationship: "",
      phone: "",
      email: "",
    });
    updateFormData({ references: updatedReferences });
  };

  const removeReference = (index: number) => {
    const updatedReferences = [...formData.references];
    updatedReferences.splice(index, 1);
    updateFormData({ references: updatedReferences });
  };

  const updateReference = (index: number, field: string, value: string) => {
    const updatedReferences = [...formData.references];
    updatedReferences[index] = { ...updatedReferences[index], [field]: value };
    updateFormData({ references: updatedReferences });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        References
        <HelpTooltip text="Please provide professional references who can vouch for your caregiving skills and character." />
      </h2>

      {formData.references.map((reference, index) => (
        <div key={index} className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Reference {index + 1}</h3>
            {formData.references.length > 1 && (
              <button
                type="button"
                onClick={() => removeReference(index)}
                className="text-red-500 hover:text-red-700"
              >
                <XCircle className="h-5 w-5" />
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor={`name-${index}`} className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                Full Name
                <HelpTooltip text="The complete name of your reference." />
              </label>
              <input
                type="text"
                id={`name-${index}`}
                value={reference.name}
                onChange={(e) => updateReference(index, "name", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
              />
            </div>
            
            <div>
              <label htmlFor={`relationship-${index}`} className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                Relationship
                <HelpTooltip text="How does this person know you professionally? (e.g., Former Employer, Supervisor, Colleague)" />
              </label>
              <input
                type="text"
                id={`relationship-${index}`}
                value={reference.relationship}
                onChange={(e) => updateReference(index, "relationship", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Former Employer"
              />
            </div>
            
            <div>
              <label htmlFor={`phone-${index}`} className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                Phone Number
                <HelpTooltip text="A current phone number where we can reach your reference." />
              </label>
              <input
                type="tel"
                id={`phone-${index}`}
                value={reference.phone}
                onChange={(e) => updateReference(index, "phone", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>
            
            <div>
              <label htmlFor={`email-${index}`} className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                Email Address
                <HelpTooltip text="A current email address where we can contact your reference." />
              </label>
              <input
                type="email"
                id={`email-${index}`}
                value={reference.email}
                onChange={(e) => updateReference(index, "email", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="johndoe@example.com"
              />
            </div>
          </div>
        </div>
      ))}

      <div className="mt-4">
        <Button 
          type="button" 
          onClick={addReference}
          variant="outline"
          className="flex items-center text-blue-600 hover:text-blue-800"
          disabled={formData.references.length >= 3}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Another Reference
        </Button>
        {formData.references.length >= 3 && (
          <p className="text-sm text-gray-500 mt-2">Maximum of 3 references allowed.</p>
        )}
      </div>

      <div className="mt-6 px-4 py-3 bg-blue-50 rounded-md">
        <p className="text-sm text-blue-700">
          <span className="font-semibold">Note:</span> We recommend providing at least two professional references who can speak to your caregiving abilities. We will contact your references during the verification process.
        </p>
      </div>
    </div>
  );
}
