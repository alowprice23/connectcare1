import React from 'react';
import { Caregiver } from 'utils/models';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { useNavigate } from 'react-router-dom';

interface Props {
  caregiver: Caregiver;
}

const CaregiverProfileClients: React.FC<Props> = ({ caregiver }) => {
  const navigate = useNavigate();
  
  return (
    <Card className="p-6 animate-fade-in">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <User className="mr-2 h-5 w-5 text-blue-500" /> Assigned Clients
      </h2>

      {caregiver.assignedClients.length > 0 ? (
        <div className="divide-y divide-gray-200">
          {caregiver.assignedClients.map((clientId, index) => (
            <div key={clientId} className={`${index > 0 ? 'pt-4 mt-4' : ''} flex justify-between items-center`}>
              <div>
                <h3 className="font-medium text-gray-900">Client ID: {clientId}</h3>
                <p className="text-sm text-gray-500">View client details for full information</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/client-profile?id=${clientId}`)}
              >
                View Client
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Assigned Clients</h3>
          <p className="text-gray-500">
            This caregiver is not currently assigned to any clients.
          </p>
        </div>
      )}
    </Card>
  );
};

export default CaregiverProfileClients;