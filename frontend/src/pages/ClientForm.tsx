import React, { useEffect, useState } from 'react';



import { useNavigate, useSearchParams } from 'react-router-dom';
import { ClientForm } from '../components/ClientForm';
import { useClients } from '../utils/dataHooks';
import { Client } from '../utils/models';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ClientService } from '../utils/clientService';

const ClientFormPage = () => {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('id');
  const navigate = useNavigate();
  const { loading, error } = useClients();
  const [clientData, setClientData] = useState<Partial<Client> | undefined>(undefined);
  const [pageLoading, setPageLoading] = useState(true);
  
  // Fetch client data if editing
  useEffect(() => {
    const fetchData = async () => {
      if (clientId) {
        try {
          // Use ClientService directly instead of going through clients state
          const clientService = new ClientService();
          const foundClient = await clientService.getById(clientId);
          
          if (foundClient) {
            setClientData(foundClient);
          } else {
            toast.error('Client not found');
            navigate('/admin');
          }
        } catch (error) {
          console.error('Error fetching client data:', error);
          toast.error('Error loading client data');
          navigate('/admin');
        }
      }
      setPageLoading(false);
    };
    
    fetchData();
  }, [clientId, navigate]);
  
  if (loading || pageLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }
  
  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Dashboard
        </Button>
        <h1 className="text-3xl font-bold">
          {clientId ? 'Edit Client' : 'Add New Client'}
        </h1>
        <p className="mt-2 text-gray-600">
          For a more guided experience with animated page transitions,
          try our <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/client-application')}>new client referral form</Button>.
        </p>
      </div>
      
      <ClientForm 
        initialData={clientData} 
        onSuccess={() => navigate('/admin')}
        onCancel={() => navigate('/admin')}
      />
    </div>
  );
};

export default ClientFormPage;
