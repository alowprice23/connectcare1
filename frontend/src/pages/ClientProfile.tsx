import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Client, ClientStatus, ShiftType, Caregiver } from '../utils/models';
import { useClients, useCaregivers } from '../utils/dataHooks';
import { ArrowLeft, Edit, Calendar, MapPin, Phone, Mail, Heart, Clipboard, Users, MapPinned, Clock, AlertTriangle, UserX, CalendarX, FileText, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { locationService } from 'utils/locationService';
import { MapVisualization } from 'components/MapVisualization';
import { ClientService } from 'utils/clientService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const ClientProfile = () => {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('id');
  const navigate = useNavigate();
  const { clients, loading, error, fetchAllClients, markAsInactive } = useClients();
  const { availableCaregivers, fetchAllCaregivers } = useCaregivers();
  const [client, setClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<string>('info');
  const [matchedCaregivers, setMatchedCaregivers] = useState<Array<{caregiver: Caregiver; distance: number; duration: number}>>([]);
  const [loadingMatch, setLoadingMatch] = useState<boolean>(false);
  const [isDeactivating, setIsDeactivating] = useState<boolean>(false);
  const [showAuthorizationModal, setShowAuthorizationModal] = useState(false);
  const [authorizationForm, setAuthorizationForm] = useState({
    id: '',
    startDate: '',
    endDate: '',
    totalAuthorizedHours: '',
    isEditing: false
  });

  // Fetch client data
  useEffect(() => {
    if (!clientId) {
      toast.error('No client ID provided');
      navigate('/admin');
      return;
    }

    const fetchData = async () => {
      try {
        await fetchAllClients();
        await fetchAllCaregivers();
        
        // Use getById from ClientService instead of accessing clients directly
        // This avoids the timing issue where clients might be undefined
        const clientService = new ClientService();
        const foundClient = await clientService.getById(clientId);
        
        if (foundClient) {
          setClient(foundClient);
        } else {
          toast.error('Client not found');
          navigate('/admin');
        }
      } catch (error) {
        console.error('Error fetching client data:', error);
        toast.error('Failed to load client data');
        navigate('/admin');
      }
    };
    
    fetchData();
  }, [clientId, fetchAllClients, fetchAllCaregivers, navigate]);

  // Handle authorization form change
  const handleAuthFormChange = (e) => {
    const { name, value } = e.target;
    setAuthorizationForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Reset authorization form
  const resetAuthorizationForm = () => {
    setAuthorizationForm({
      id: '',
      startDate: '',
      endDate: '',
      totalAuthorizedHours: '',
      isEditing: false
    });
  };

  // Submit authorization
  const handleSubmitAuthorization = async () => {
    if (!client || !client.id) {
      toast.error('Client data is not available');
      return;
    }

    if (!authorizationForm.startDate || !authorizationForm.endDate || !authorizationForm.totalAuthorizedHours) {
      toast.error('Please fill in all authorization fields');
      return;
    }

    try {
      // Validate dates
      const startDate = new Date(authorizationForm.startDate);
      const endDate = new Date(authorizationForm.endDate);

      if (endDate < startDate) {
        toast.error('End date cannot be earlier than start date');
        return;
      }

      // Convert hours to number
      const totalHours = parseFloat(authorizationForm.totalAuthorizedHours);
      if (isNaN(totalHours) || totalHours <= 0) {
        toast.error('Total hours must be a positive number');
        return;
      }

      const currentAuthorizations = client.authorizations || [];

      // Create new authorization or update existing
      let updatedAuthorizations;
      if (authorizationForm.isEditing) {
        // Update existing authorization
        updatedAuthorizations = currentAuthorizations.map(auth => 
          auth.id === authorizationForm.id ? {
            ...auth,
            startDate: authorizationForm.startDate,
            endDate: authorizationForm.endDate,
            totalAuthorizedHours: totalHours,
            updatedAt: new Date()
          } : auth
        );
      } else {
        // Create new authorization
        const newAuthorization = {
          id: crypto.randomUUID(),
          startDate: authorizationForm.startDate,
          endDate: authorizationForm.endDate,
          totalAuthorizedHours: totalHours,
          active: true,
          createdAt: new Date()
        };
        updatedAuthorizations = [...currentAuthorizations, newAuthorization];
      }

      // Set most recent authorization as the legacy one for backward compatibility
      const sortedAuthorizations = [...updatedAuthorizations]
        .filter(auth => auth.active)
        .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

      const legacyAuthorization = sortedAuthorizations.length > 0 ? {
        startDate: sortedAuthorizations[0].startDate,
        endDate: sortedAuthorizations[0].endDate,
        totalAuthorizedHours: sortedAuthorizations[0].totalAuthorizedHours
      } : undefined;

      // Update client in storage
      const updatedClient = {
        ...client,
        authorizations: updatedAuthorizations,
        authorization: legacyAuthorization
      };

      const clientService = new ClientService();
      await clientService.update(client.id, updatedClient);

      // Update state
      setClient(updatedClient);
      setShowAuthorizationModal(false);
      resetAuthorizationForm();
      toast.success(authorizationForm.isEditing ? 'Authorization updated successfully' : 'Authorization added successfully');
    } catch (error) {
      console.error('Error saving authorization:', error);
      toast.error('Failed to save authorization');
    }
  };

  // Calculate weekly hours
  const calculateWeeklyHours = (startDate, endDate, totalHours) => {
    if (!startDate || !endDate || !totalHours) {
      return null;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Calculate total days between dates
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Calculate weekly hours
    const weeklyHours = (totalHours / (totalDays / 7));
    
    return weeklyHours.toFixed(1);
  };

  // Check if authorization is expired
  const isExpired = (authorization) => {
    if (!authorization?.endDate) return false;
    
    const endDate = new Date(authorization.endDate);
    const today = new Date();
    return endDate < today;
  };
  
  // Get color styling for authorization card based on expiration
  const getAuthCardStyle = (authorization) => {
    if (!authorization?.endDate) return 'border-gray-200';
    
    const endDate = new Date(authorization.endDate);
    const today = new Date();
    
    // Calculate days until end date
    const daysUntilEnd = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilEnd <= 0) {
      return 'border-red-500 bg-red-50'; // Expired - red
    } else if (daysUntilEnd <= 30) {
      return 'border-yellow-500 bg-yellow-50'; // Less than 30 days - yellow
    } else if (daysUntilEnd > 60) {
      return 'border-green-500 bg-green-50'; // More than 60 days - green
    } else {
      return 'border-blue-200 bg-blue-50'; // Between 30-60 days - blue
    }
  };
  
  // Edit an authorization
  const handleEditAuthorization = (authorization) => {
    setAuthorizationForm({
      id: authorization.id,
      startDate: authorization.startDate,
      endDate: authorization.endDate,
      totalAuthorizedHours: authorization.totalAuthorizedHours.toString(),
      isEditing: true
    });
    setShowAuthorizationModal(true);
  };
  
  // Deactivate an authorization
  const handleDeactivateAuthorization = async (authorizationId) => {
    if (!client || !client.id) {
      toast.error('Client data is not available');
      return;
    }
    
    if (!confirm('Are you sure you want to deactivate this authorization?')) {
      return;
    }
    
    try {
      // Get current authorizations
      const currentAuthorizations = client.authorizations || [];
      
      // Mark the specified authorization as inactive
      const updatedAuthorizations = currentAuthorizations.map(auth => 
        auth.id === authorizationId ? { ...auth, active: false } : auth
      );
      
      // For backward compatibility, also update the legacy authorization field
      // with the most recent active authorization
      const sortedAuthorizations = [...updatedAuthorizations]
        .filter(auth => auth.active)
        .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
      
      const legacyAuthorization = sortedAuthorizations.length > 0 ? {
        startDate: sortedAuthorizations[0].startDate,
        endDate: sortedAuthorizations[0].endDate,
        totalAuthorizedHours: sortedAuthorizations[0].totalAuthorizedHours
      } : undefined;
      
      const updatedClient = {
        ...client,
        authorizations: updatedAuthorizations,
        authorization: legacyAuthorization
      };
      
      // Update client in storage
      const clientService = new ClientService();
      await clientService.update(client.id, updatedClient);
      
      // Update state
      setClient(updatedClient);
      toast.success('Authorization deactivated successfully');
    } catch (error) {
      console.error('Error deactivating authorization:', error);
      toast.error('Failed to deactivate authorization');
    }
  };
  
  if (loading || !client) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  // Generate CSS class for status badge
  const getStatusBadgeClass = (status: ClientStatus) => {
    switch (status) {
      case ClientStatus.NEW_REFERRAL:
        return 'bg-purple-100 text-purple-800';
      case ClientStatus.UNSTABLE:
        return 'bg-red-100 text-red-800';
      case ClientStatus.STABLE:
        return 'bg-green-100 text-green-800';
      case ClientStatus.INACTIVE:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper to map shift type to a friendly name
  const getShiftTypeName = (type: ShiftType) => {
    switch (type) {
      case ShiftType.MORNING:
        return 'Morning';
      case ShiftType.AFTERNOON:
        return 'Afternoon';
      case ShiftType.EVENING:
        return 'Evening';
      default:
        return 'Unknown';
    }
  };

  // Find matching caregivers in service area
  const findMatchingCaregivers = async () => {
    if (!client || !client.location) {
      toast.error('Client must have location data to find matches');
      return;
    }

    setLoadingMatch(true);
    try {
      const matches = await locationService.findCaregiversNearClient(
        client,
        availableCaregivers || []
      );
      setMatchedCaregivers(matches);
      if (matches.length === 0) {
        toast.warning('No caregivers found within service area');
      } else {
        toast.success(`Found ${matches.length} potential caregivers`);
      }
    } catch (error) {
      console.error('Error finding matches:', error);
      toast.error('Error finding matches');
    } finally {
      setLoadingMatch(false);
    }
  };


  
  // Get authorization status for styling
  
  // Get authorization status for styling
  const getAuthorizationStatus = () => {
    if (!client?.authorization?.endDate) {
      return { status: 'none', isFlashing: false };
    }
    
    const endDate = new Date(client.authorization.endDate);
    const today = new Date();
    
    // Calculate days until end date
    const daysUntilEnd = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilEnd <= 30) {
      return { status: 'warning', isFlashing: true }; // Less than 30 days - flashing red
    } else if (daysUntilEnd > 60) {
      return { status: 'good', isFlashing: false }; // More than 60 days (2 months) - green
    } else {
      return { status: 'neutral', isFlashing: false }; // Between 30-60 days - neutral
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  const weeklyHours = calculateWeeklyHours();
  const authStatus = getAuthorizationStatus();

  // Handle client deactivation
  const handleDeactivate = async () => {
    if (!client) return;
    
    try {
      setIsDeactivating(true);
      await markAsInactive(client.id);
      toast.success(`${client.firstName} ${client.lastName} has been deactivated`);
      // Update the local client state
      setClient(prev => prev ? { ...prev, status: ClientStatus.INACTIVE } : null);
    } catch (error) {
      console.error('Error deactivating client:', error);
      toast.error('Failed to deactivate client');
    } finally {
      setIsDeactivating(false);
    }
  };

  // Navigate to client form with proper error handling
  const navigateToClientForm = () => {
    if (!clientId) {
      toast.error('Client ID is missing');
      return;
    }
    
    // Navigate using the clientId from search params instead of client.id
    // This is more reliable as it's what was used to load the page
    navigate(`/client-form?id=${clientId}`);
  };

  // Show deactivation confirmation dialog
  const confirmDeactivate = () => {
    if (window.confirm(`Are you sure you want to deactivate ${client?.firstName} ${client?.lastName}? This will mark them as inactive.`)) {
      handleDeactivate();
    }
  };
  
  // Handle authorization submission
  const handleAuthorizationSubmit = async () => {
    if (!client || !client.id) {
      toast.error('Client data is not available');
      return;
    }
    
    try {
      // Validate form inputs
      if (!authorizationForm.startDate || !authorizationForm.endDate || !authorizationForm.totalAuthorizedHours) {
        toast.error('Please fill all fields');
        return;
      }
      
      // Parse total hours as a number
      const totalHours = parseInt(authorizationForm.totalAuthorizedHours);
      if (isNaN(totalHours) || totalHours <= 0) {
        toast.error('Please enter a valid number of hours');
        return;
      }
      
      // Initialize authorizations array if it doesn't exist yet
      const currentAuthorizations = client.authorizations || [];
      
      // Check if we're exceeding the limit of 12 authorizations per year
      const startDate = new Date(authorizationForm.startDate);
      const year = startDate.getFullYear();
      const authorizationsThisYear = currentAuthorizations.filter(auth => {
        const authDate = new Date(auth.startDate);
        return authDate.getFullYear() === year && auth.active;
      });
      
      // If we're adding a new authorization and already at the limit, show error
      if (!authorizationForm.isEditing && authorizationsThisYear.length >= 12) {
        toast.error(`Maximum of 12 authorizations per year (${year}) reached`);
        return;
      }
      
      // Create the new authorization object
      const newAuthorization = {
        id: authorizationForm.isEditing ? authorizationForm.id : crypto.randomUUID(),
        startDate: authorizationForm.startDate,
        endDate: authorizationForm.endDate,
        totalAuthorizedHours: totalHours,
        active: true,
        createdAt: authorizationForm.isEditing 
          ? currentAuthorizations.find(a => a.id === authorizationForm.id)?.createdAt || new Date() 
          : new Date()
      };
      
      // Create updated client object with authorizations
      let updatedAuthorizations;
      if (authorizationForm.isEditing) {
        // Replace the existing authorization with the updated one
        updatedAuthorizations = currentAuthorizations.map(auth => 
          auth.id === authorizationForm.id ? newAuthorization : auth
        );
      } else {
        // Add the new authorization to the array
        updatedAuthorizations = [...currentAuthorizations, newAuthorization];
      }
      
      // For backward compatibility, also update the legacy authorization field
      // with the most recent active authorization
      const sortedAuthorizations = [...updatedAuthorizations]
        .filter(auth => auth.active)
        .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
      
      const legacyAuthorization = sortedAuthorizations.length > 0 ? {
        startDate: sortedAuthorizations[0].startDate,
        endDate: sortedAuthorizations[0].endDate,
        totalAuthorizedHours: sortedAuthorizations[0].totalAuthorizedHours
      } : undefined;
      
      const updatedClient = {
        ...client,
        authorizations: updatedAuthorizations,
        authorization: legacyAuthorization
      };
      
      // Update client in storage
      const clientService = new ClientService();
      await clientService.update(client.id, updatedClient);
      
      // Update state
      setClient(updatedClient);
      setShowAuthorizationModal(false);
      toast.success(`Authorization ${authorizationForm.isEditing ? 'updated' : 'added'} successfully`);
      
      // Reset form
      setAuthorizationForm({
        id: '',
        startDate: '',
        endDate: '',
        totalAuthorizedHours: '',
        isEditing: false
      });
    } catch (error) {
      console.error('Error updating authorization:', error);
      toast.error(`Failed to ${authorizationForm.isEditing ? 'update' : 'add'} authorization`);
    }
  };
  
  // Handle changes to authorization form inputs
  const handleAuthorizationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAuthorizationForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Get the days of the week
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Create a schedule grid with all shifts
  const renderScheduleGrid = () => {
    // Initialize schedule grid
    const scheduleGrid: Record<string, Record<string, Array<{
      startTime: string;
      endTime: string;
      type: ShiftType;
      caregiverId?: string;
    }>>> = {};
    
    // Initialize days
    daysOfWeek.forEach(day => {
      scheduleGrid[day] = {};
    });
    
    // Add shifts to grid
    client.shifts?.forEach(shift => {
      if (!scheduleGrid[shift.dayOfWeek]) {
        scheduleGrid[shift.dayOfWeek] = {};
      }
      
      if (!scheduleGrid[shift.dayOfWeek][shift.type]) {
        scheduleGrid[shift.dayOfWeek][shift.type] = [];
      }
      
      scheduleGrid[shift.dayOfWeek][shift.type].push({
        startTime: shift.startTime,
        endTime: shift.endTime,
        type: shift.type,
        caregiverId: shift.caregiverId
      });
    });
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border">
          <thead>
            <tr>
              <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Shift</th>
              {daysOfWeek.map(day => (
                <th key={day} className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Variable shifts as needed */}
            {Object.values(ShiftType).map(shiftType => (
              <tr key={shiftType}>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border">
                  {getShiftTypeName(shiftType)}
                </td>
                {daysOfWeek.map(day => (
                  <td key={`${day}-${shiftType}`} className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 border">
                    {scheduleGrid[day][shiftType]?.map((shift, idx) => (
                      <div key={idx} className="flex flex-col mb-1 last:mb-0">
                        <span>
                          {shift.startTime} - {shift.endTime}
                        </span>
                        {shift.caregiverId && (
                          <span className="text-xs text-blue-600">
                            Assigned: {shift.caregiverId}
                          </span>
                        )}
                      </div>
                    )) || <span className="text-gray-400">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate('/admin')} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h1 className="text-3xl font-bold">
            {client.firstName} {client.lastName}
          </h1>
          <Badge className={`ml-3 ${getStatusBadgeClass(client.status)}`}>
            {client.status.replace('_', ' ')}
          </Badge>
        </div>
        <div className="flex gap-2">
          {client.status !== ClientStatus.INACTIVE && (
            <Button 
              variant="outline" 
              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={confirmDeactivate}
              disabled={isDeactivating}
            >
              <UserX className="h-4 w-4 mr-2" /> 
              {isDeactivating ? 'Deactivating...' : 'Deactivate Client'}
            </Button>
          )}
          <Button onClick={navigateToClientForm}>
            <Edit className="h-4 w-4 mr-2" /> Edit Client
          </Button>
        </div>
      </div>

      <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">Client Information</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="matching">Caregiver Matching</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Basic Info */}
            <div className="md:col-span-1">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Client Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Contact</h3>
                    <div className="mt-1 flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{client.phone}</span>
                    </div>
                    <div className="mt-1 flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{client.email}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Address</h3>
                    <div className="mt-1 flex items-start">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                      <div>
                        <div>{client.address}</div>
                        <div>{client.city}, {client.state} {client.zip}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Emergency Contact</h3>
                    <div className="mt-1">
                      <div>{client.emergencyContact?.name}</div>
                      <div className="text-sm text-gray-500">{client.emergencyContact?.relationship}</div>
                      <div className="text-sm">{client.emergencyContact?.phone}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Transportation</h3>
                    <div className="mt-1 space-y-1">
                      {client.transportation?.hasCar && (
                        <Badge variant="outline" className="mr-2">Has Car</Badge>
                      )}
                      {client.transportation?.onBusLine && (
                        <Badge variant="outline" className="mr-2">On Bus Line</Badge>
                      )}
                      {client.transportation?.needsTransportation && (
                        <Badge variant="outline" className="mr-2">Needs Transportation</Badge>
                      )}
                      {client.transportation?.transportationNotes && (
                        <div className="text-sm mt-1">{client.transportation.transportationNotes}</div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            
            {/* Right Column - Care Needs & Schedule */}
            <div className="md:col-span-2">
              <Card className="p-6 mb-6">
                <div className="flex items-center mb-4">
                  <Heart className="h-5 w-5 mr-2 text-red-500" />
                  <h2 className="text-xl font-semibold">Care Needs</h2>
                </div>
                
                {/* Authorization Section */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-blue-500" />
                      <h2 className="text-xl font-semibold">Authorizations</h2>
                    </div>
                    <Button 
                      onClick={() => setShowAuthorizationModal(true)} 
                      variant="outline" 
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Authorization
                    </Button>
                  </div>
                  
                  {/* Show active authorizations */}
                  {client.authorizations && client.authorizations.length > 0 ? (
                    <div className="space-y-4">
                      {client.authorizations
                        .filter(auth => auth.active)
                        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                        .map(auth => (
                          <div 
                            key={auth.id}
                            className={`rounded-md overflow-hidden border p-4 ${getAuthCardStyle(auth)}`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold flex items-center">
                                  <Clock className="h-4 w-4 mr-2 text-blue-500" />
                                  Authorization {isExpired(auth) && (
                                    <span className="ml-2">
                                      <AlertTriangle className="h-4 w-4 text-red-500" />
                                    </span>
                                  )}
                                </h3>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                                  <div>
                                    <span className="text-sm text-gray-500">Start Date:</span>
                                    <div className="font-medium">{formatDate(auth.startDate)}</div>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-500">End Date:</span>
                                    <div className={`font-medium ${isExpired(auth) ? 'text-red-600 font-bold' : ''}`}>
                                      {formatDate(auth.endDate)}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-500">Total Hours:</span>
                                    <div className="font-medium">{auth.totalAuthorizedHours}</div>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-500">Weekly Hours:</span>
                                    <div className="font-medium">
                                      {calculateWeeklyHours(auth.startDate, auth.endDate, auth.totalAuthorizedHours)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditAuthorization(auth)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeactivateAuthorization(auth.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  ) : client.authorization ? (
                    // Legacy authorization display (backward compatibility)
                    <div className={`rounded-md overflow-hidden border ${authStatus.status === 'warning' ? 'border-red-500' : authStatus.status === 'good' ? 'border-green-500' : 'border-gray-200'}`}>
                      <div className={`p-4 ${authStatus.status === 'warning' ? 'bg-red-50' : authStatus.status === 'good' ? 'bg-green-50' : 'bg-white'} ${authStatus.isFlashing ? 'animate-pulse' : ''}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg flex items-center">
                              <Clock className="h-5 w-5 mr-2 text-blue-500" />
                              Authorization
                              {authStatus.status === 'warning' && (
                                <span className="ml-2">
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                </span>
                              )}
                            </h3>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                              <div>
                                <span className="text-sm text-gray-500">Start Date:</span>
                                <div className="font-medium">{formatDate(client.authorization.startDate)}</div>
                              </div>
                              <div>
                                <span className="text-sm text-gray-500">End Date:</span>
                                <div className={`font-medium ${authStatus.status === 'warning' ? 'text-red-600 font-bold' : ''}`}>
                                  {formatDate(client.authorization.endDate)}
                                </div>
                              </div>
                              <div>
                                <span className="text-sm text-gray-500">Total Hours:</span>
                                <div className="font-medium">{client.authorization.totalAuthorizedHours}</div>
                              </div>
                              <div>
                                <span className="text-sm text-gray-500">Weekly Hours:</span>
                                <div className="font-medium">
                                  {client.authorization.calculatedWeeklyHours || 
                                    calculateWeeklyHours(
                                      client.authorization.startDate, 
                                      client.authorization.endDate, 
                                      client.authorization.totalAuthorizedHours
                                    )
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Button to convert legacy to new format */}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleConvertLegacyAuthorization}
                          >
                            Convert to New Format
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 border rounded-md bg-gray-50">
                      <CalendarX className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500 mb-2">No authorizations added yet</p>
                      <Button 
                        onClick={() => setShowAuthorizationModal(true)} 
                        variant="outline" 
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Authorization
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Care Level</h3>
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${(client.careLevel / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm font-medium">{client.careLevel}/5</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Care Needs</h3>
                    <div className="flex flex-wrap gap-1">
                      {client.careNeeds?.length > 0 ? (
                        client.careNeeds.map((need, index) => (
                          <Badge key={index} variant="secondary" className="mr-1 mb-1">{need}</Badge>
                        ))
                      ) : (
                        <span className="text-gray-400">No care needs specified</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Medical Conditions</h3>
                    <div className="flex flex-wrap gap-1">
                      {client.medicalConditions?.length > 0 ? (
                        client.medicalConditions.map((condition, index) => (
                          <Badge key={index} variant="outline" className="mr-1 mb-1">{condition}</Badge>
                        ))
                      ) : (
                        <span className="text-gray-400">No medical conditions specified</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Preferred Caregiver Traits</h3>
                  <div className="flex flex-wrap gap-1">
                    {client.preferredCaregiverTraits?.length > 0 ? (
                      client.preferredCaregiverTraits.map((trait, index) => (
                        <Badge key={index} className="bg-green-100 text-green-800 mr-1 mb-1">{trait}</Badge>
                      ))
                    ) : (
                      <span className="text-gray-400">No preferred traits specified</span>
                    )}
                  </div>
                </div>
                
                {client.notes && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                    <div className="text-sm bg-gray-50 p-3 rounded-md">
                      {client.notes}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="mt-6">
          <Card className="p-6">
            <div className="flex items-center mb-6">
              <Calendar className="h-5 w-5 mr-2 text-blue-500" />
              <h2 className="text-xl font-semibold">Weekly Schedule</h2>
            </div>
            
            {client.shifts && client.shifts.length > 0 ? (
              renderScheduleGrid()
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Clipboard className="h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No shifts scheduled</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This client doesn't have any shifts scheduled yet.
                </p>
                <Button 
                  onClick={navigateToClientForm} 
                  variant="outline" 
                  className="mt-4"
                >
                  <Calendar className="h-4 w-4 mr-2" /> Add Schedule
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="matching" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Visualization */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
                  <h3 className="text-lg font-medium">Proximity Map</h3>
                  <Button 
                    onClick={findMatchingCaregivers}
                    disabled={loadingMatch}
                  >
                    {loadingMatch ? 'Finding matches...' : 'Find Caregivers in Service Area'}
                  </Button>
                </div>
                <MapVisualization
                  clients={client ? [client] : []}
                  caregivers={availableCaregivers}
                  height="500px"
                  showDistances={true}
                  filterByRadius={false}
                />
              </Card>
            </div>
            
            {/* Matched caregivers list */}
            <div className="lg:col-span-1">
              <Card className="p-4">
                <h3 className="text-lg font-bold mb-3">Caregivers Within Service Radius</h3>
                
                {loadingMatch ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : matchedCaregivers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Click "Find Caregivers" to view nearby caregivers</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {matchedCaregivers.map(({ caregiver, distance, duration }) => (
                      <div key={caregiver.id} className="p-3 border rounded hover:bg-gray-50">
                        <div className="flex justify-between items-center">
                          <p className="font-medium">{caregiver.firstName} {caregiver.lastName}</p>
                          <span className="text-sm text-blue-600 font-semibold">{distance.toFixed(1)} mi</span>
                        </div>
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <span>{duration.toFixed(0)} min drive</span>
                          <span className="mx-2">•</span>
                          <span>{caregiver.preferredHoursPerWeek - caregiver.currentHoursAssigned} hrs available</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {caregiver.skills.slice(0, 3).map((skill, i) => (
                            <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{skill}</span>
                          ))}
                          {caregiver.skills.length > 3 && (
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">+{caregiver.skills.length - 3} more</span>
                          )}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-sm"
                            onClick={() => {
                              toast.success(`Viewing caregiver ${caregiver.firstName} ${caregiver.lastName}'s profile`);
                              navigate(`/caregiver-profile?id=${caregiver.id}`);
                            }}
                          >
                            View Profile
                          </Button>
                          <Button 
                            size="sm" 
                            className="text-sm"
                            onClick={() => {
                              toast.success(`Caregiver ${caregiver.firstName} ${caregiver.lastName} selected for assignment`);
                              // In a real app, we would open an assignment dialog
                            }}
                          >
                            Assign
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <MapPinned className="h-5 w-5 mr-2 text-blue-500" />
                <h2 className="text-xl font-semibold">Caregiver Matching</h2>
              </div>
              {client.location ? (
                <Button 
                  onClick={findMatchingCaregivers}
                  disabled={loadingMatch}
                >
                  {loadingMatch ? 'Finding Matches...' : 'Find Matching Caregivers'}
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={navigateToClientForm}
                >
                  Add Location Data
                </Button>
              )}
            </div>

            {client.location ? (
              <div className="space-y-6">
                <div className="h-[400px] w-full rounded-md overflow-hidden border">
                  <MapVisualization
                    clients={[client]}
                    caregivers={availableCaregivers || []}
                    height="400px"
                    filterByRadius={true}
                  />
                </div>

                {matchedCaregivers.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Matching Caregivers</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {matchedCaregivers.map((match) => (
                        <div key={match.caregiver.id} className="border rounded-md p-4 hover:bg-gray-50">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="font-medium">{match.caregiver.firstName} {match.caregiver.lastName}</h4>
                              <p className="text-sm text-gray-500">{match.caregiver.phone}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="mb-1">
                                {match.distance.toFixed(1)} mi
                              </Badge>
                              <p className="text-xs text-gray-500">{Math.round(match.duration)} min drive</p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm"><span className="text-gray-500">Service Radius:</span> {match.caregiver.serviceRadius} miles</p>
                            <p className="text-sm"><span className="text-gray-500">Experience:</span> {match.caregiver.yearsExperience}</p>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {match.caregiver.skills.slice(0, 3).map((skill, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                            ))}
                            {match.caregiver.skills.length > 3 && (
                              <Badge variant="secondary" className="text-xs">+{match.caregiver.skills.length - 3} more</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <MapPin className="h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No location data</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add location data to this client to find matching caregivers.
                </p>
                <Button 
                  onClick={navigateToClientForm} 
                  variant="outline" 
                  className="mt-4"
                >
                  <MapPin className="h-4 w-4 mr-2" /> Add Location Data
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Authorization Modal */}
      <Dialog open={showAuthorizationModal} onOpenChange={setShowAuthorizationModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Authorization</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">Start Date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={authorizationForm.startDate}
                onChange={handleAuthorizationInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">End Date</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={authorizationForm.endDate}
                onChange={handleAuthorizationInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="totalHours" className="text-right">Total Hours</Label>
              <Input
                id="totalHours"
                name="totalAuthorizedHours"
                type="number"
                value={authorizationForm.totalAuthorizedHours}
                onChange={handleAuthorizationInputChange}
                className="col-span-3"
                min="1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAuthorizationModal(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleAuthorizationSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientProfile;
