import React from 'react';
import { Caregiver } from 'utils/models';
import { Card } from "@/components/ui/card";
import { User, Mail, Phone, MapPin, Calendar, CircleCheck, Check, AlertTriangle } from "lucide-react";

interface Props {
  caregiver: Caregiver;
}

const CaregiverProfileOverview: React.FC<Props> = ({ caregiver }) => {
  return (
    <div className="space-y-6">
      <Card className="p-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <User className="mr-2 h-5 w-5 text-blue-500" /> Personal Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
          <div className="flex items-start">
            <Mail className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-gray-900">{caregiver.email}</p>
            </div>
          </div>
          <div className="flex items-start">
            <Phone className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Phone</p>
              <p className="text-gray-900">{caregiver.phone}</p>
            </div>
          </div>
          <div className="flex items-start">
            <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Address</p>
              <p className="text-gray-900">
                {caregiver.address}, {caregiver.city}, {caregiver.state} {caregiver.zip}
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <Calendar className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Date of Birth</p>
              <p className="text-gray-900">{caregiver.dateOfBirth}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <CircleCheck className="mr-2 h-5 w-5 text-blue-500" /> Status & Requirements
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-medium mb-2 text-gray-700">Background Check</h3>
            <div className="flex items-center">
              {caregiver.backgroundCheckPassed ? (
                <span className="flex items-center text-green-600">
                  <Check className="h-5 w-5 mr-1" /> Passed
                </span>
              ) : (
                <span className="flex items-center text-amber-600">
                  <AlertTriangle className="h-5 w-5 mr-1" /> Pending
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {caregiver.backgroundCheckPassed 
                ? "Background check has been completed and verified" 
                : "Background check is pending completion"}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-medium mb-2 text-gray-700">Training Status</h3>
            <div className="flex items-center">
              {caregiver.trainingCompleted ? (
                <span className="flex items-center text-green-600">
                  <Check className="h-5 w-5 mr-1" /> Completed
                </span>
              ) : (
                <span className="flex items-center text-amber-600">
                  <AlertTriangle className="h-5 w-5 mr-1" /> Pending
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {caregiver.trainingCompleted 
                ? "All required training modules have been completed" 
                : "Training is pending completion"}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CaregiverProfileOverview;