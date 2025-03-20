import { Caregiver, Client } from '../utils/models';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapVisualization } from 'components/MapVisualization';
import { LocationMatchingPanel } from 'components/LocationMatchingPanel';
import { useState, useEffect } from 'react';
import { useClients, useCaregivers } from '../utils/dataHooks';
import { MapPin, Users, Search, RefreshCw, BookOpen, Puzzle } from 'lucide-react';
import { locationService } from '../utils/locationService';
import { toast } from 'sonner';

// Styles for animations and effects
const pageStyles = `
  @keyframes pageAppear {
    0% { opacity: 0; transform: translateY(20px) scale(0.95); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  
  .page-animation {
    animation: pageAppear 0.5s ease-out forwards;
  }
  
  .tab-animation {
    transition: all 0.3s ease;
    transform-origin: top center;
  }
  
  .pulse-glow {
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); }
    70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
    100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
  }
  
  @keyframes bounce-slow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
  
  .animate-bounce-slow {
    animation: bounce-slow 2s ease-in-out infinite;
  }
`;

export default function LocationMatching() {
  const [activeTab, setActiveTab] = useState<string>('map');
  const [filterByRadius, setFilterByRadius] = useState<boolean>(false);
  const [selectedCaregiverId, setSelectedCaregiverId] = useState<string>('');
  const [loadingLocations, setLoadingLocations] = useState<boolean>(false);
  const [processProgress, setProcessProgress] = useState<number>(0);
  
  // Track whether to show tooltips
  const [showTooltips, setShowTooltips] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [pageLoaded, setPageLoaded] = useState(false);
  
  // Show page animation on load
  useEffect(() => {
    setPageLoaded(true);
  }, []);
  
  const { unstableClients, stableClients, newReferrals } = useClients();
  const { availableCaregivers } = useCaregivers();
  
  // Combine all client lists
  const allClients = [...(stableClients || []), ...(unstableClients || []), ...(newReferrals || [])];
  
  // Process locations for all entities
  const processLocations = async () => {
    if (!hasMissingLocationData && !confirm('All entities already have location data. Do you want to refresh locations anyway?')) {
      return;
    }
    setLoadingLocations(true);
    setProcessProgress(0);
    toast.info('Processing location data for clients and caregivers...');
    
    try {
      // Process clients without location data
      const clientsWithoutLocation = allClients.filter(
        client => !client.location || !client.location.latitude || !client.location.longitude
      );
      
      // Process caregivers without location data
      const caregiversWithoutLocation = (availableCaregivers || []).filter(
        caregiver => !caregiver.location || !caregiver.location.latitude || !caregiver.location.longitude
      );
      
      let processedCount = 0;
      const totalToProcess = clientsWithoutLocation.length + caregiversWithoutLocation.length;
      
      if (totalToProcess === 0) {
        toast.success('All entities already have location data');
        setProcessProgress(100);
        setLoadingLocations(false);
        return;
      }
      
      // Process clients in batches of 5
      for (let i = 0; i < clientsWithoutLocation.length; i += 5) {
        const batch = clientsWithoutLocation.slice(i, i + 5);
        await Promise.all(batch.map(async (client) => {
          await locationService.geocodeClientAddress(client);
          processedCount++;
          setProcessProgress(Math.round((processedCount / totalToProcess) * 100));
        }));
        
        // Add a small delay between batches
        if (i + 5 < clientsWithoutLocation.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Process caregivers in batches of 5
      for (let i = 0; i < caregiversWithoutLocation.length; i += 5) {
        const batch = caregiversWithoutLocation.slice(i, i + 5);
        await Promise.all(batch.map(async (caregiver) => {
          await locationService.geocodeCaregiverAddress(caregiver);
          processedCount++;
          setProcessProgress(Math.round((processedCount / totalToProcess) * 100));
        }));
        
        // Add a small delay between batches
        if (i + 5 < caregiversWithoutLocation.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      if (processedCount > 0) {
        toast.success(`Processed location data for ${processedCount} entities`);
      } else {
        toast.success('All entities already have location data');
      }
    } catch (error) {
      console.error('Error processing locations:', error);
      toast.error('Error processing location data');
    } finally {
      setLoadingLocations(false);
      setProcessProgress(100);
    }
  };
  
  const getSelectedCaregiver = () => {
    if (!selectedCaregiverId || !availableCaregivers) return null;
    return availableCaregivers.find(c => c.id === selectedCaregiverId) || null;
  };

  // Check if any entities are missing location data
  const entitiesWithoutLocation = [
    ...allClients.filter(client => !client.location || !client.location.latitude || !client.location.longitude),
    ...(availableCaregivers || []).filter(caregiver => !caregiver.location || !caregiver.location.latitude || !caregiver.location.longitude)
  ];
  
  const hasMissingLocationData = entitiesWithoutLocation.length > 0;
  
  return (
    <div className="container mx-auto py-8">
      <style jsx>{pageStyles}</style>
      <style jsx>{`\n        @keyframes pageAppear {\n          0% { opacity: 0; transform: translateY(20px) scale(0.95); }\n          100% { opacity: 1; transform: translateY(0) scale(1); }\n        }\n        \n        .page-animation {\n          animation: pageAppear 0.5s ease-out forwards;\n        }\n        \n        .tab-animation {\n          transition: all 0.3s ease;\n          transform-origin: top center;\n        }\n        \n        .pulse-glow {\n          animation: pulse 2s infinite;\n        }\n        \n        @keyframes pulse {\n          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); }\n          70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }\n          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }\n        }\n      `}</style>
      <div className={`flex justify-between items-center mb-6 transition-opacity duration-500 ${pageLoaded ? 'opacity-100' : 'opacity-0'} relative`}>
        {/* Tetris decoration */}
        <div className="tetrominoe tetrominoe-t" style={{ top: '-10px', left: '200px' }}></div>
        <div className="tetrominoe tetrominoe-o" style={{ bottom: '-5px', right: '150px' }}></div>
        <div>
          <h1 className="text-3xl font-bold">Location Matching</h1>
          <p className="text-gray-500 mt-1">Match clients with caregivers based on location and service radius</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={processLocations}
            disabled={loadingLocations}
          >
            {loadingLocations ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                Process Location Data{hasMissingLocationData ? ` (${entitiesWithoutLocation.length})` : ''}
              </>
            )}
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className={`w-full page-animation ${pageLoaded ? 'opacity-100' : 'opacity-0'}`} style={{animationDelay: '0.1s'}}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="map" onClick={() => {
            const element = document.getElementById('map-view');
            if (element) {
              element.classList.add('pulse-glow');
              setTimeout(() => {
                element.classList.remove('pulse-glow');
              }, 1000);
            }
          }}>
            <MapPin className="h-4 w-4 mr-2" />
            Interactive Map
          </TabsTrigger>
          <TabsTrigger value="panel" onClick={() => {
            const element = document.getElementById('panel-view');
            if (element) {
              element.classList.add('pulse-glow');
              setTimeout(() => {
                element.classList.remove('pulse-glow');
              }, 1000);
            }
          }}>
            <Users className="h-4 w-4 mr-2" />
            Matching Panel
          </TabsTrigger>
        </TabsList>
        
        {loadingLocations && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-100 relative overflow-hidden">
            {/* Tetris block decorations */}
            <div className="tetrominoe tetrominoe-i" style={{ top: '5px', right: '20px', transform: 'rotate(15deg)' }}></div>
            <div className="tetrominoe tetrominoe-l" style={{ bottom: '10px', right: '50px', transform: 'rotate(-10deg)' }}></div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-blue-800">Processing location data...</span>
              <span className="text-sm text-blue-800">{processProgress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
              <div className="progress-tetris h-full rounded-full" style={{ width: `${processProgress}%` }}></div>
              {/* Replaced with progress-tetris above */}
            </div>
            <p className="text-xs text-blue-600 mt-2">Please wait while we geocode addresses and calculate distances.</p>
          </div>
        )}
        
        <TabsContent value="map" className="mt-6">
          <div id="map-view" className="grid grid-cols-1 md:grid-cols-4 gap-6 tab-animation">
            <div className="md:col-span-3 relative">
              <Card className="overflow-hidden tab-animation">
                {/* Help tooltip button */}
                <div className="absolute top-3 right-3 z-10">
                  <button 
                    className="rounded-full bg-blue-100 text-blue-600 h-6 w-6 flex items-center justify-center text-sm font-bold hover:bg-blue-200 transition-colors"
                    onClick={() => setActiveTooltip(activeTooltip === 'map' ? null : 'map')}
                  >
                    ?
                  </button>
                </div>
                
                {activeTooltip === 'map' && (
                  <div className="absolute top-12 right-3 bg-blue-50 border border-blue-200 p-3 rounded-lg shadow-md max-w-xs text-sm z-10 animate-bounce-slow relative overflow-hidden">
                {/* Tetris block decorations */}
                <div className="tetrominoe tetrominoe-i" style={{ top: '5px', right: '10px', transform: 'rotate(25deg)', opacity: 0.4 }}></div>
                <div className="tetrominoe tetrominoe-o" style={{ bottom: '5px', left: '10px', transform: 'rotate(-15deg)', opacity: 0.4 }}></div>
                    <h4 className="font-bold text-blue-800 mb-1">Map Visualization</h4>
                    <p>The map shows clients and caregivers with their locations. Use the filters to find ideal matches based on service radius.</p>
                    <button 
                      className="text-xs bg-white border border-blue-300 text-blue-600 px-2 py-1 rounded hover:bg-blue-50 mt-2"
                      onClick={() => setActiveTooltip(null)}
                    >
                      Got it
                    </button>
                  </div>
                )}
                <CardHeader className="py-3 px-4 bg-gray-50 border-b flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-lg font-medium">Location Map</CardTitle>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="filter-radius"
                        checked={filterByRadius}
                        onCheckedChange={setFilterByRadius}
                      />
                      <Label htmlFor="filter-radius" className="cursor-pointer">
                        Filter by service radius
                      </Label>
                    </div>
                  </div>
                </CardHeader>
                
                {filterByRadius && (
                  <div className="bg-blue-50 p-3 border-b">
                    <Select
                      value={selectedCaregiverId}
                      onValueChange={setSelectedCaregiverId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a caregiver to filter by radius" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCaregivers?.map(caregiver => (
                          <SelectItem key={caregiver.id} value={caregiver.id}>
                            {caregiver.firstName} {caregiver.lastName} - {caregiver.serviceRadius} mile radius
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <CardContent className="p-0">
                  <MapVisualization
                    clients={allClients}
                    caregivers={availableCaregivers}
                    height="600px"
                    showDistances={true}
                    filterByRadius={filterByRadius}
                    selectedCaregiver={getSelectedCaregiver()}
                  />
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-1">
              <div className="space-y-6">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base font-medium">Clients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Clients</span>
                        <Badge variant="outline">{allClients.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-sm">Stable</span>
                        </div>
                        <Badge variant="outline">{stableClients?.length || 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                          <span className="text-sm">Unstable</span>
                        </div>
                        <Badge variant="outline">{unstableClients?.length || 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-purple-500 mr-2"></div>
                          <span className="text-sm">New Referrals</span>
                        </div>
                        <Badge variant="outline">{newReferrals?.length || 0}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base font-medium">Caregivers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Available Caregivers</span>
                        <Badge variant="outline">{availableCaregivers?.length || 0}</Badge>
                      </div>
                      
                      {filterByRadius && selectedCaregiverId && (
                        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                          <p className="text-sm font-medium text-blue-800">Radius Filter Active</p>
                          <p className="text-xs text-blue-700 mt-1">
                            Showing clients within {getSelectedCaregiver()?.serviceRadius} miles of selected caregiver
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base font-medium">How To Use</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex">
                        <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold mr-2 tetris-block tetris-block-distance">1</div>
                        <p>Click "Process Location Data" to geocode missing locations</p>
                      </div>
                      <div className="flex">
                        <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold mr-2 tetris-block tetris-block-hours">2</div>
                        <p>Enable "Filter by service radius" to see which clients are within a caregiver's service area</p>
                      </div>
                      <div className="flex">
                        <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold mr-2 tetris-block tetris-block-skills">3</div>
                        <p>Use the matching panel tab for a detailed view of potential matches</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="panel" className="mt-6">
          <div id="panel-view" className="relative tab-animation">
            {/* Help tooltip button */}
            <div className="absolute top-3 right-3 z-10">
              <button 
                className="rounded-full bg-blue-100 text-blue-600 h-6 w-6 flex items-center justify-center text-sm font-bold hover:bg-blue-200 transition-colors"
                onClick={() => setActiveTooltip(activeTooltip === 'tetris' ? null : 'tetris')}
              >
                ?
              </button>
            </div>
            
            {activeTooltip === 'tetris' && (
              <div className="absolute top-12 right-3 bg-green-50 border border-green-200 p-3 rounded-lg shadow-md max-w-xs text-sm z-10 animate-bounce-slow relative overflow-hidden page-turn-in">
                {/* Tetris block decorations */}
                <div className="tetrominoe tetrominoe-l" style={{ top: '10px', right: '15px', transform: 'rotate(15deg)', opacity: 0.4 }}></div>
                <div className="tetrominoe tetrominoe-t" style={{ bottom: '10px', left: '15px', transform: 'rotate(-10deg)', opacity: 0.4 }}></div>
                <div className="tetrominoe tetrominoe-i" style={{ top: '50px', right: '40px', transform: 'rotate(90deg)', opacity: 0.3 }}></div>
                <div className="tetrominoe tetrominoe-o" style={{ bottom: '40px', right: '30px', opacity: 0.3 }}></div>
                <h4 className="font-bold text-green-800 mb-1">Tetris Matching System</h4>
                <p>Our matching algorithm works like Tetris, fitting caregiver blocks into client shift patterns:</p>
                <ul className="list-disc pl-4 mt-2 space-y-1">
                  <li className="flex items-center">
                    <div className="h-3 w-3 bg-blue-400 mr-1 tetris-block tetris-block-distance"></div>
                    <span>Location proximity (40%)</span>
                  </li>
                  <li className="flex items-center">
                    <div className="h-3 w-3 bg-amber-400 mr-1 tetris-block tetris-block-hours"></div>
                    <span>Hours availability (25%)</span>
                  </li>
                  <li className="flex items-center">
                    <div className="h-3 w-3 bg-purple-400 mr-1 tetris-block tetris-block-skills"></div>
                    <span>Skills matching (25%)</span>
                  </li>
                  <li className="flex items-center">
                    <div className="h-3 w-3 bg-green-400 mr-1 tetris-block tetris-block-location"></div>
                    <span>Location preferences (10%)</span>
                  </li>
                </ul>
                <p className="mt-2 italic text-xs">Just like in Tetris, we find the perfect fit by aligning all these pieces together!</p>
                <button 
                  className="text-xs bg-white border border-green-300 text-green-600 px-2 py-1 rounded hover:bg-green-50 mt-2"
                  onClick={() => setActiveTooltip(null)}
                >
                  Got it
                </button>
              </div>
            )}
            
            <LocationMatchingPanel />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}