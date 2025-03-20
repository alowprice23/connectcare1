import React from 'react';
import { Caregiver, CaregiverStatus } from 'utils/models';
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

export interface Props {
  caregiver: Caregiver;
  onClose?: () => void;
}

const CaregiverProfileHeader: React.FC<Props> = ({ caregiver, onClose }) => {
  // Helper to render status badge with appropriate color
  const renderStatusBadge = (status: CaregiverStatus) => {
    let bgColor = "bg-gray-100";
    let textColor = "text-gray-800";
    
    switch (status) {
      case CaregiverStatus.NEW_APPLICANT:
        bgColor = "bg-yellow-100";
        textColor = "text-yellow-800";
        break;
      case CaregiverStatus.BACKGROUND_CHECK:
        bgColor = "bg-blue-100";
        textColor = "text-blue-800";
        break;
      case CaregiverStatus.TRAINING:
        bgColor = "bg-purple-100";
        textColor = "text-purple-800";
        break;
      case CaregiverStatus.AVAILABLE:
        bgColor = "bg-green-100";
        textColor = "text-green-800";
        break;
      case CaregiverStatus.ASSIGNED:
        bgColor = "bg-indigo-100";
        textColor = "text-indigo-800";
        break;
      case CaregiverStatus.INACTIVE:
        bgColor = "bg-red-100";
        textColor = "text-red-800";
        break;
    }
    
    return (
      <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}> 
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="p-6 bg-gradient-to-r from-blue-50 to-white border-b relative">
      <div className="absolute top-6 right-6 flex space-x-2">
        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <div className="flex items-center mb-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
          <User className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{caregiver.firstName} {caregiver.lastName}</h1>
          <div className="mt-1">{renderStatusBadge(caregiver.status)}</div>
        </div>
      </div>
    </div>
  );
};

export default CaregiverProfileHeader;