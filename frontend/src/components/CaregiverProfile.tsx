import React from 'react';
import { Caregiver } from 'utils/models';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CaregiverProfileHeader from 'components/CaregiverProfileHeader';
import CaregiverProfileOverview from 'components/CaregiverProfileOverview';
import CaregiverProfileQualifications from 'components/CaregiverProfileQualifications';
import CaregiverProfileAvailability from 'components/CaregiverProfileAvailability';
import CaregiverProfileClients from 'components/CaregiverProfileClients';

export interface Props {
  caregiver: Caregiver;
  onClose?: () => void;
}

const CaregiverProfile: React.FC<Props> = ({ caregiver, onClose }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-all animate-page-turn">
      <CaregiverProfileHeader caregiver={caregiver} onClose={onClose} />

      <Tabs defaultValue="overview" className="p-6">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="clients">Assigned Clients</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <CaregiverProfileOverview caregiver={caregiver} />
        </TabsContent>

        <TabsContent value="qualifications">
          <CaregiverProfileQualifications caregiver={caregiver} />
        </TabsContent>

        <TabsContent value="availability">
          <CaregiverProfileAvailability caregiver={caregiver} />
        </TabsContent>

        <TabsContent value="clients">
          <CaregiverProfileClients caregiver={caregiver} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CaregiverProfile;