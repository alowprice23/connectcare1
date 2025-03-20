import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "utils/auth";
import { Button } from "components/Button";
import { Users, ChevronLeft, ChevronRight, Settings, Puzzle, Calendar, Clock, UserPlus, HeartPulse, FileText, PlusCircle, MapPin, BrainCircuit } from "lucide-react";
import { AdminWrapper } from "utils/user-routes";
import CaregiverForm from "components/CaregiverForm";
import { CaregiverTable, ClientTable } from "components/AdminTables";
import { useDataInit } from "utils/dataHooks";
import { Caregiver, CaregiverStatus, Client, ClientStatus, ShiftType } from "utils/models";
import { useCaregivers, useClients } from "utils/dataHooks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { LocationMatchingPanel } from "components/LocationMatchingPanel";
import { clientService } from "utils/clientService";
import { CaregiverService } from "utils/caregiverService";
import { BruceChat } from "components/BruceChat";

function AdminContent() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [loading, setLoading] = useState<boolean>(false);
  const [showCaregiverForm, setShowCaregiverForm] = useState<boolean>(false);
  
  // Initialize data
  useDataInit();
  
  // Services for data interaction
  const { newApplicants, availableCaregivers, fetchAllCaregivers, createCaregiver, geocodeAllCaregiverAddresses } = useCaregivers();
  const clientService = useClients();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Puzzle className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold">CareConnect <span className="text-blue-600">Tetris</span></span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a href="#" className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </a>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <p className="text-sm text-gray-600 mr-4">Logged in as: {user?.email}</p>
              </div>
              <div className="ml-3 relative">
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  className="text-sm"
                >
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto py-10">
          <header>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center">
                <Button variant="outline" size="sm" onClick={() => navigate("/")} className="mr-4">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back to Home
                </Button>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              </div>
            </div>
          </header>
          <main>
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
              <div className="px-4 py-8 sm:px-0">
                <Tabs defaultValue="overview" onValueChange={setActiveTab} className="mb-6">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="caregivers" onClick={() => {
                    // Prevent data loading when tab is clicked to avoid freezing
                    // Data will load naturally when component mounts
                    console.log('Caregivers tab clicked');
                  }}>Caregivers</TabsTrigger>
                  <TabsTrigger value="clients">Clients</TabsTrigger>
                  <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
                  <TabsTrigger value="location">Location Matching</TabsTrigger>
                  <TabsTrigger value="assistant">Bruce Assistant</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
                    {/* New Applicants Card */}
                    <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-yellow-400 hover:shadow-lg transition-shadow">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                            <UserPlus className="h-6 w-6 text-yellow-600" />
                          </div>
                          <div className="ml-5 flex-1">
                            <div className="flex justify-between">
                              <h3 className="text-lg font-medium text-gray-900">New Applicants</h3>
                              <span className="text-lg font-bold text-yellow-600">{newApplicants?.length || 0}</span>
                            </div>
                            <p className="text-gray-500">Manage new caregiver applications</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 px-5 py-3">
                        <div className="text-sm">
                          <button 
                            onClick={() => { setActiveTab("caregivers"); }}
                            className="font-medium text-blue-600 hover:text-blue-500 flex items-center"
                          >
                            View applicants <ChevronRight className="h-4 w-4 ml-1" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Available Caregivers Card */}
                    <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-green-400 hover:shadow-lg transition-shadow">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                            <Users className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="ml-5 flex-1">
                            <div className="flex justify-between">
                              <h3 className="text-lg font-medium text-gray-900">Available Caregivers</h3>
                              <span className="text-lg font-bold text-green-600">{availableCaregivers?.length || 0}</span>
                            </div>
                            <p className="text-gray-500">Ready for assignment</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 px-5 py-3">
                        <div className="text-sm">
                          <button 
                            onClick={() => { setActiveTab("caregivers"); }}
                            className="font-medium text-blue-600 hover:text-blue-500 flex items-center"
                          >
                            View available caregivers <ChevronRight className="h-4 w-4 ml-1" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Unstable Clients Card */}
                    <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-red-400 hover:shadow-lg transition-shadow">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                            <HeartPulse className="h-6 w-6 text-red-600" />
                          </div>
                          <div className="ml-5 flex-1">
                            <div className="flex justify-between">
                              <h3 className="text-lg font-medium text-gray-900">Unstable Clients</h3>
                              <span className="text-lg font-bold text-red-600">{clientService.unstableClients?.length || 0}</span>
                            </div>
                            <p className="text-gray-500">High-priority care needs</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 px-5 py-3">
                        <div className="text-sm">
                          <button 
                            onClick={() => { 
                              setActiveTab("clients"); 
                              navigate('/client-application');
                            }}
                            className="font-medium text-blue-600 hover:text-blue-500 flex items-center"
                          >
                            View unstable clients <ChevronRight className="h-4 w-4 ml-1" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* New Client Referrals Card */}
                    <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-purple-400 hover:shadow-lg transition-shadow">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                            <FileText className="h-6 w-6 text-purple-600" />
                          </div>
                          <div className="ml-5 flex-1">
                            <div className="flex justify-between">
                              <h3 className="text-lg font-medium text-gray-900">New Referrals</h3>
                              <span className="text-lg font-bold text-purple-600">{clientService.newReferrals?.length || 0}</span>
                            </div>
                            <p className="text-gray-500">New client intake</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 px-5 py-3">
                        <div className="text-sm">
                          <button 
                            onClick={() => { 
                              setActiveTab("clients"); 
                              navigate('/client-application');
                            }}
                            className="font-medium text-blue-600 hover:text-blue-500 flex items-center"
                          >
                            View new referrals <ChevronRight className="h-4 w-4 ml-1" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg border border-blue-100">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                      <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Next Optimization Run</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">The scheduling system re-optimizes every 5 minutes.</p>
                      </div>
                      <div className="flex items-center bg-blue-50 px-4 py-2 rounded-md">
                        <Clock className="h-5 w-5 text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-blue-700">Next run in: 4:32</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Caregivers Tab */}
                <TabsContent value="caregivers">
                  <Card className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">Caregiver Management</h2>
                      <Button 
                        onClick={() => setShowCaregiverForm(true)}
                        className="flex items-center"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Caregiver
                      </Button>
                    </div>
                    {/* Caregiver Form Modal */}
                    <CaregiverForm 
                      open={showCaregiverForm} 
                      onOpenChange={setShowCaregiverForm}
                      onSubmit={async (data) => {
                        try {
                          await createCaregiver(data);
                          fetchAllCaregivers();
                          return Promise.resolve();
                        } catch (error) {
                          return Promise.reject(error);
                        }
                      }}
                      isLoading={loading}
                    />
                    
                    <CaregiverTable />
                  </Card>
                </TabsContent>
                
                {/* Clients Tab */}
                <TabsContent value="clients">
                  <Card className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">Client Management</h2>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => navigate('/client-form')}
                          variant="default"
                        >
                          <PlusCircle className="mr-2 h-4 w-4" /> Add New Client
                        </Button>
                        <div className="flex gap-2 ml-2">
                          <Button 
                            onClick={() => navigate('/location-matching')}
                            variant="outline"
                          >
                            <MapPin className="mr-2 h-4 w-4" /> Location Matching
                          </Button>
                          <Button 
                            onClick={() => {
                              // Mock data for demonstration
                              const newClient: Omit<Client, 'id'> = {
                                firstName: "Jane",
                                lastName: "Smith",
                                email: `jane.smith${Math.floor(Math.random() * 1000)}@example.com`,
                                phone: "555-987-6543",
                                address: "456 Elm St",
                                city: "Boston",
                                state: "MA",
                                zip: "02109",
                                status: ClientStatus.NEW_REFERRAL,
                                careNeeds: ["Medication Management", "Daily Activities Assistance"],
                                medicalConditions: ["Diabetes", "Hypertension"],
                                careLevel: 3,
                                emergencyContact: {
                                  name: "Bob Smith",
                                  relationship: "Son",
                                  phone: "555-789-0123"
                                },
                                preferredCaregiverTraits: ["Patient", "Experienced"],
                                assignedCaregivers: [],
                                shifts: [
                                  {
                                    type: ShiftType.MORNING,
                                    dayOfWeek: "Monday",
                                    startTime: "08:00",
                                    endTime: "12:00"
                                  },
                                  {
                                    type: ShiftType.AFTERNOON,
                                    dayOfWeek: "Wednesday",
                                    startTime: "13:00",
                                    endTime: "17:00"
                                  }
                                ],
                                notes: "Needs help with daily activities and medication management.",
                                location: {
                                  latitude: 42.3601,
                                  longitude: -71.0589
                                },
                                createdAt: new Date(),
                                updatedAt: new Date()
                              };
                              
                              clientService.createClient(newClient)
                                .then(() => {
                                  toast.success("Sample client created");
                                  clientService.fetchAllClients();
                                })
                                .catch(err => {
                                  toast.error("Error creating client");
                                  console.error(err);
                                });
                            }}
                            variant="outline"
                            className="flex items-center"
                          >
                            <HeartPulse className="mr-2 h-4 w-4" />
                            Add Sample Client
                          </Button>
                        </div>
                      </div>
                    </div>
                    <ClientTable />
                  </Card>
                </TabsContent>
                
                {/* Scheduling Tab */}
                <TabsContent value="edit">
                  <Card className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">Edit Section</h2>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold mb-4">Content Management</h3>
                        <p className="text-gray-600 mb-4">Use this section to edit and manage content across the application.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="border rounded-md p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
                            <h4 className="font-medium mb-2">Page Content</h4>
                            <p className="text-sm text-gray-500">Edit text, images, and content displayed on application pages</p>
                          </div>
                          <div className="border rounded-md p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
                            <h4 className="font-medium mb-2">Help Text</h4>
                            <p className="text-sm text-gray-500">Modify help texts and tooltips throughout the application</p>
                          </div>
                          <div className="border rounded-md p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
                            <h4 className="font-medium mb-2">System Messages</h4>
                            <p className="text-sm text-gray-500">Customize notification and system messages</p>
                          </div>
                          <div className="border rounded-md p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
                            <h4 className="font-medium mb-2">Form Fields</h4>
                            <p className="text-sm text-gray-500">Edit input fields and validation rules for application forms</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
                
                <TabsContent value="settings">
                  <Card className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">System Settings</h2>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold mb-4">Application Configuration</h3>
                        <p className="text-gray-600 mb-4">Manage system-wide settings and preferences.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="border rounded-md p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
                            <h4 className="font-medium mb-2">General Settings</h4>
                            <p className="text-sm text-gray-500">Configure application name, timezone, and display preferences</p>
                          </div>
                          <div className="border rounded-md p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
                            <h4 className="font-medium mb-2">API Configuration</h4>
                            <p className="text-sm text-gray-500">Manage API keys and external service connections</p>
                          </div>
                          <div className="border rounded-md p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
                            <h4 className="font-medium mb-2">Optimization Settings</h4>
                            <p className="text-sm text-gray-500">Adjust parameters for the scheduling optimization system</p>
                          </div>
                          <div className="border rounded-md p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
                            <h4 className="font-medium mb-2">User Management</h4>
                            <p className="text-sm text-gray-500">Manage staff accounts and access permissions</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
                
                <TabsContent value="assistant">
                  <Card className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">Bruce Assistant</h2>
                    </div>
                    <BruceChat />
                  </Card>
                </TabsContent>
                
                <TabsContent value="location">
                  <Card className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">Location Matching</h2>
                      <div className="flex gap-3">
                        <Button 
                          variant="outline"
                          onClick={async () => {
                            // Trigger geocoding of all client and caregiver addresses
                            toast.success("Starting batch geocoding of all addresses...");
                            setLoading(true);
                            try {
                              // Geocode all client addresses
                              const clientsUpdated = await clientService.geocodeAllClientsAddresses();
                              
                              // Geocode all caregiver addresses
                              const caregiversUpdated = await geocodeAllCaregiverAddresses();
                              
                              // Refresh data
                              await clientService.fetchAllClients();
                              await fetchAllCaregivers();
                              
                              toast.success(`Geocoding complete! Updated ${clientsUpdated} clients and ${caregiversUpdated} caregivers.`);
                            } catch (error) {
                              console.error('Error geocoding addresses:', error);
                              toast.error("Error geocoding addresses");
                            } finally {
                              setLoading(false);
                            }
                          }}
                          className="flex items-center"
                          disabled={loading}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          {loading ? 'Geocoding...' : 'Geocode All Addresses'}
                        </Button>
                      </div>
                    </div>
                    <LocationMatchingPanel />
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
  );
}

export default function Admin() {
  return (
    <AdminWrapper>
      <AdminContent />
    </AdminWrapper>
  );
}
