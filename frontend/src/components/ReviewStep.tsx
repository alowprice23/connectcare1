import React from "react";
import { HelpTooltip } from "components/HelpTooltip";

interface ReviewStepProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    yearsExperience: string;
    certifications: string[];
    education: string;
    skills: string[];
    availableDays: string[];
    availableHours: {
      startTime: string;
      endTime: string;
    };
    maxClientsPerWeek: number;
    preferredHoursPerWeek: number;
    serviceRadius: number;
    preferredLocations: string[];
    transportation: string;
    references: {
      name: string;
      relationship: string;
      phone: string;
      email: string;
    }[];
  };
  updateFormData: (data: Partial<ReviewStepProps["formData"]>) => void;
}

export function ReviewStep({ formData }: ReviewStepProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        Review & Submit
        <HelpTooltip text="Please review all your information before submitting your application." />
      </h2>

      <div className="space-y-6">
        {/* Personal Information Section */}
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Personal Information</h3>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
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
            <div className="flex">
              <span className="font-medium text-gray-500 w-1/3">Date of Birth:</span>
              <span className="text-gray-900">{formData.dateOfBirth}</span>
            </div>
            <div className="flex col-span-2">
              <span className="font-medium text-gray-500 w-1/6">Address:</span>
              <span className="text-gray-900">{formData.address}, {formData.city}, {formData.state} {formData.zip}</span>
            </div>
          </div>
        </div>

        {/* Experience Section */}
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Experience & Qualifications</h3>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex">
              <span className="font-medium text-gray-500 w-1/3">Years of Experience:</span>
              <span className="text-gray-900">{formData.yearsExperience}</span>
            </div>
            <div className="flex">
              <span className="font-medium text-gray-500 w-1/3">Education:</span>
              <span className="text-gray-900">{formData.education}</span>
            </div>
            <div className="flex">
              <span className="font-medium text-gray-500 w-1/3">Certifications:</span>
              <div className="flex-1">
                {formData.certifications.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {formData.certifications.map((cert, idx) => (
                      <li key={idx} className="text-gray-900">{cert}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-500">No certifications provided</span>
                )}
              </div>
            </div>
            <div className="flex">
              <span className="font-medium text-gray-500 w-1/3">Skills:</span>
              <div className="flex-1">
                {formData.skills.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {formData.skills.map((skill, idx) => (
                      <li key={idx} className="text-gray-900">{skill}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-500">No additional skills provided</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Availability Section */}
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Availability</h3>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex">
              <span className="font-medium text-gray-500 w-1/3">Available Days:</span>
              <span className="text-gray-900">{formData.availableDays.join(", ")}</span>
            </div>
            <div className="flex">
              <span className="font-medium text-gray-500 w-1/3">Available Hours:</span>
              <span className="text-gray-900">
                {formData.availableHours.startTime} to {formData.availableHours.endTime}
              </span>
            </div>
            <div className="flex">
              <span className="font-medium text-gray-500 w-1/3">Preferred Hours/Week:</span>
              <span className="text-gray-900">{formData.preferredHoursPerWeek} hours</span>
            </div>
            <div className="flex">
              <span className="font-medium text-gray-500 w-1/3">Max Clients/Week:</span>
              <span className="text-gray-900">{formData.maxClientsPerWeek} clients</span>
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Service Location</h3>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex">
              <span className="font-medium text-gray-500 w-1/3">Service Radius:</span>
              <span className="text-gray-900">{formData.serviceRadius} miles</span>
            </div>
            <div className="flex">
              <span className="font-medium text-gray-500 w-1/3">Transportation:</span>
              <span className="text-gray-900">{formData.transportation}</span>
            </div>
            <div className="flex">
              <span className="font-medium text-gray-500 w-1/3">Preferred Locations:</span>
              <div className="flex-1">
                {formData.preferredLocations.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {formData.preferredLocations.map((location, idx) => (
                      <li key={idx} className="text-gray-900">{location}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-500">No preferred locations specified</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* References Section */}
        <div className="pb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">References</h3>
          <div className="space-y-4">
            {formData.references.map((reference, idx) => (
              <div key={idx} className="bg-gray-50 p-3 rounded">
                <h4 className="font-medium mb-2">Reference {idx + 1}</h4>
                <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
                  <div className="flex">
                    <span className="font-medium text-gray-500 w-1/3">Name:</span>
                    <span className="text-gray-900">{reference.name || "Not provided"}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-gray-500 w-1/3">Relationship:</span>
                    <span className="text-gray-900">{reference.relationship || "Not provided"}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-gray-500 w-1/3">Phone:</span>
                    <span className="text-gray-900">{reference.phone || "Not provided"}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-gray-500 w-1/3">Email:</span>
                    <span className="text-gray-900">{reference.email || "Not provided"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 px-4 py-3 bg-blue-50 rounded-md">
        <p className="text-sm text-blue-700">
          <span className="font-semibold">Before submitting:</span> Please verify that all information provided is accurate. After submission, our team will review your application and contact you for the next steps.
        </p>
      </div>
    </div>
  );
}
