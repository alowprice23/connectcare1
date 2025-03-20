import React from 'react';
import { Caregiver } from 'utils/models';
import { Card } from "@/components/ui/card";
import { Briefcase, Award, FileText, Phone, Mail } from "lucide-react";

interface Props {
  caregiver: Caregiver;
}

const CaregiverProfileQualifications: React.FC<Props> = ({ caregiver }) => {
  return (
    <div className="space-y-6">
      <Card className="p-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Briefcase className="mr-2 h-5 w-5 text-blue-500" /> Experience & Education
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
          <div className="flex items-start">
            <Briefcase className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Years of Experience</p>
              <p className="text-gray-900">{caregiver.yearsExperience} years</p>
            </div>
          </div>
          <div className="flex items-start">
            <Award className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Education</p>
              <p className="text-gray-900">{caregiver.education}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Award className="mr-2 h-5 w-5 text-blue-500" /> Skills & Certifications
        </h2>

        <div className="mb-6">
          <h3 className="text-gray-700 font-medium mb-2">Certifications</h3>
          <div className="flex flex-wrap gap-2">
            {caregiver.certifications.map((cert, index) => (
              <span key={index} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                {cert}
              </span>
            ))}
            {caregiver.certifications.length === 0 && (
              <p className="text-gray-500 text-sm">No certifications listed</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-gray-700 font-medium mb-2">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {caregiver.skills.map((skill, index) => (
              <span key={index} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                {skill}
              </span>
            ))}
            {caregiver.skills.length === 0 && (
              <p className="text-gray-500 text-sm">No skills listed</p>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FileText className="mr-2 h-5 w-5 text-blue-500" /> References
        </h2>

        {caregiver.references.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {caregiver.references.map((reference, index) => (
              <div key={index} className={index > 0 ? 'pt-4 mt-4' : ''}>
                <h3 className="font-medium text-gray-900">{reference.name}</h3>
                <p className="text-sm text-gray-500">{reference.relationship}</p>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-1" />
                    <span>{reference.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-1" />
                    <span>{reference.email}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No references provided</p>
        )}
      </Card>
    </div>
  );
};

export default CaregiverProfileQualifications;