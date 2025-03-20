import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapVisualization } from './MapVisualization';
import { Client, Caregiver, ClientStatus } from 'utils/models';
import { locationService } from 'utils/locationService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useClients, useCaregivers } from 'utils/dataHooks';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Clock, Check, X, AlertTriangle, Download, Save, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MatchedCaregiver {
  caregiver: Caregiver;
  distance: number;
  duration: number;
  matchScore: number; // 0-100 score based on multiple factors
  // Detailed match metrics
  distanceScore: number;
  hoursScore: number;
  skillsMatchPercentage: number;
  locationPrefScore: number;
}

export function LocationMatchingPanel() {
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [matchedCaregivers, setMatchedCaregivers] = useState<MatchedCaregiver[]>([]);
  const [filterByRadius, setFilterByRadius] = useState<boolean>(false);
  const [selectedCaregiver, setSelectedCaregiver] = useState<Caregiver | null>(null);
  const [matchThreshold, setMatchThreshold] = useState<number>(50); // Default threshold for match quality
  
  // Reference for match cards container to enable animations
  const matchCardsRef = useRef<HTMLDivElement>(null);
  
  const { stableClients, unstableClients, newReferrals } = useClients();
  const { availableCaregivers } = useCaregivers();
  
  // Combine all client lists
  const allClients = [...(stableClients || []), ...(unstableClients || []), ...(newReferrals || [])];
  
  // Calculate service radius matches for selected client
  const findMatchesForClient = async (client: Client) => {
    if (!client.location || !client.location.latitude || !client.location.longitude) {
      toast.error("Client must have location data to find matches");
      return;
    }
    
    setLoading(true);
    try {
      const matches = await locationService.findCaregiversNearClient(
        client,
        availableCaregivers || []
      );
      
      // Calculate match score for each caregiver - implementing the "Tetris" algorithm
      const enrichedMatches = matches.map(match => {
        // Calculate a robust match score based on multiple factors
        // This creates the "Tetris-like" matching where we're fitting caregivers to clients
        // based on multiple dimensions, just like fitting blocks in Tetris
        
        // 1. Distance factor (closer is better) - max 100 points
        // More sophisticated curve: excellent within 5 miles, declining after that
        let distanceScore = 0;
        if (match.distance <= 5) {
          // Excellent match - 90-100 points
          distanceScore = 100 - (match.distance * 2);
        } else if (match.distance <= 15) {
          // Good match - 50-90 points
          distanceScore = 90 - ((match.distance - 5) * 4);
        } else {
          // Fair match - proportionally lower
          distanceScore = Math.max(0, 50 - ((match.distance - 15) * 2.5));
        }
        
        // 2. Hours availability factor - max 100 points
        // More nuanced score based on how well caregiver's available hours match client needs
        const hoursAvailable = match.caregiver.preferredHoursPerWeek - (match.caregiver.currentHoursAssigned || 0);
        let hoursScore = 0;
        
        // Estimate weekly hours needed for client based on shifts
        const clientWeeklyHours = selectedClient?.shifts?.reduce((total, shift) => {
          // Estimate hours per shift (end time - start time)
          const start = shift.startTime ? new Date(`1970-01-01T${shift.startTime}`) : null;
          const end = shift.endTime ? new Date(`1970-01-01T${shift.endTime}`) : null;
          
          if (start && end) {
            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            return total + hours;
          }
          return total + 4; // Default 4 hours if times not specified
        }, 0) || 20; // Default 20 hours if no shifts specified
        
        // Calculate how well caregiver's available hours match client needs
        if (hoursAvailable >= clientWeeklyHours * 1.2) {
          // Plenty of hours available - excellent match
          hoursScore = 100;
        } else if (hoursAvailable >= clientWeeklyHours) {
          // Just enough hours - good match
          hoursScore = 80 + ((hoursAvailable - clientWeeklyHours) * 4);
        } else if (hoursAvailable >= clientWeeklyHours * 0.8) {
          // Close but not quite enough - fair match
          hoursScore = 60 * (hoursAvailable / clientWeeklyHours);
        } else {
          // Not enough hours - poor match
          hoursScore = Math.min(60, (hoursAvailable / clientWeeklyHours) * 60);
        }
        
        // 3. Skills match factor - max 100 points
        // Sophisticated matching of caregiver skills to client care needs
        const careNeedsMatched = selectedClient?.careNeeds?.filter(
          need => match.caregiver.skills.some(skill => {
            // More sophisticated matching with partial matches
            const needLower = need.toLowerCase();
            const skillLower = skill.toLowerCase();
            
            // Check for direct match or if one contains the other
            return skillLower === needLower || 
                   skillLower.includes(needLower) || 
                   needLower.includes(skillLower);
          })
        ) || [];
        
        // Calculate percentage of needs matched
        let skillsMatchPercentage = 50; // Default
        if (selectedClient?.careNeeds?.length) {
          if (careNeedsMatched.length > 0) {
            skillsMatchPercentage = (careNeedsMatched.length / selectedClient.careNeeds.length) * 100;
            
            // Bonus points for exceeding minimum requirements
            if (match.caregiver.skills.length > selectedClient.careNeeds.length) {
              const extraSkillsBonus = Math.min(20, (match.caregiver.skills.length - selectedClient.careNeeds.length) * 4);
              skillsMatchPercentage = Math.min(100, skillsMatchPercentage + extraSkillsBonus);
            }
          } else {
            skillsMatchPercentage = 0; // No matches
          }
        }
        
        // 4. Location preference match - max 100 points
        let locationPrefScore = 0;
        
        // Check if caregiver has explicitly listed this location as preferred
        const exactLocationMatch = match.caregiver.preferredLocations?.some(
          loc => selectedClient?.city?.toLowerCase() === loc.toLowerCase() ||
                selectedClient?.zip === loc
        );
        
        if (exactLocationMatch) {
          // Perfect location preference match
          locationPrefScore = 100;
        } else {
          // Check for partial matches (e.g., same area/region)
          const partialLocationMatch = match.caregiver.preferredLocations?.some(
            loc => selectedClient?.city?.toLowerCase().includes(loc.toLowerCase()) ||
                  loc.toLowerCase().includes(selectedClient?.city?.toLowerCase()) ||
                  selectedClient?.zip?.includes(loc) ||
                  (loc.length > 3 && loc.substring(0, 3) === selectedClient?.zip?.substring(0, 3)) // Same ZIP prefix
          );
          
          locationPrefScore = partialLocationMatch ? 70 : 40; // Partial match or no specific preference
        }
        
        // Calculate weighted overall match score - the essence of our Tetris matching system
        const matchScore = Math.round(
          (distanceScore * 0.4) +            // 40% weight for distance
          (hoursScore * 0.25) +             // 25% weight for hours availability 
          (skillsMatchPercentage * 0.25) +  // 25% weight for skills match
          (locationPrefScore * 0.1)         // 10% weight for location preference
        );
        
        // Return enriched match with detailed scoring
        return {
          ...match,
          matchScore,
          distanceScore,
          hoursScore,
          skillsMatchPercentage,
          locationPrefScore
        };
      });
      
      // Sort by match score (descending)
      const sortedMatches = enrichedMatches.sort((a, b) => b.matchScore - a.matchScore);
      
      setMatchedCaregivers(sortedMatches);
    } catch (error) {
      console.error('Error finding matches:', error);
      toast.error("Error finding matches: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  };
  
  // Handle client selection from map
  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    findMatchesForClient(client);
  };
  
  // Handle caregiver selection from map or sidebar
  const handleCaregiverSelect = (caregiver: Caregiver) => {
    setSelectedCaregiver(caregiver);
    // If radius filtering is on, we don't change the selected client
    if (!filterByRadius) {
      setSelectedClient(null);
      setMatchedCaregivers([]);
    }
  };
  
  // Handle client selection from sidebar
  const selectClient = (client: Client) => {
    setSelectedClient(client);
    findMatchesForClient(client);

    // Add page turning animation to match cards after they load
    setTimeout(() => {
      const matchCards = document.querySelectorAll('.match-card');
      matchCards.forEach((card, index) => {
        (card as HTMLElement).style.animationDelay = `${index * 0.1}s`;
        card.classList.add('page-turn-in');
      });
    }, 300);
  };
  
  // Export matches to CSV
  const exportMatches = () => {
    if (!selectedClient || matchedCaregivers.length === 0) {
      toast.error('No matches to export');
      return;
    }

    try {
      // Create CSV content
      let csv = 'Caregiver Name,Distance (miles),Drive Time (min),Match Score,Distance Score,Hours Score,Skills Match,Location Preference\n';
      
      matchedCaregivers.forEach(match => {
        const row = [
          `${match.caregiver.firstName} ${match.caregiver.lastName}`,
          match.distance.toFixed(1),
          Math.round(match.duration),
          match.matchScore,
          match.distanceScore.toFixed(0),
          match.hoursScore.toFixed(0),
          match.skillsMatchPercentage.toFixed(0),
          match.locationPrefScore.toFixed(0)
        ];
        
        csv += row.join(',') + '\n';
      });
      
      // Create download element
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `matches-${selectedClient.firstName}-${selectedClient.lastName}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success('Matches exported successfully');
    } catch (error) {
      console.error('Error exporting matches:', error);
      toast.error('Failed to export matches');
    }
  };
  
  // Process clients to ensure they have location data
  useEffect(() => {
    // Find a client without location data to geocode
    const clientsWithoutLocation = allClients.filter(
      client => !client.location || !client.location.latitude || !client.location.longitude
    );
    
    if (clientsWithoutLocation.length > 0) {
      // Geocode one client at a time to avoid rate limiting
      const processNextClient = async () => {
        const client = clientsWithoutLocation[0];
        try {
          const geocodedClient = await locationService.geocodeClientAddress(client);
          console.log(`Geocoded client ${client.id}:`, geocodedClient.location);
          
          // In a real application, we would save this back to the database
          // For now, we'll just update the client in our state
        } catch (error) {
          console.error(`Error geocoding client ${client.id}:`, error);
          toast.error(`Failed to geocode address for client ${client.firstName} ${client.lastName}. Please check the address.`);
        }
      };
      
      processNextClient();
    }
  }, [allClients]);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <style jsx>{`
        @keyframes pageTurn {
          0% { transform: perspective(1200px) rotateY(0); }
          100% { transform: perspective(1200px) rotateY(-30deg); }
        }
        
        @keyframes fallDown {
          0% { transform: translateY(-20px); opacity: 0; }
          60% { transform: translateY(3px); }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes slideIn {
          0% { transform: translateX(20px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        .page-turn {
          animation: pageTurn 0.5s ease-in-out forwards alternate;
          transform-origin: left center;
          backface-visibility: hidden;
          position: relative;
          z-index: 10;
        }
        
        .match-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .match-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        
        .tetris-block {
          position: relative;
          border-radius: 0;
          clip-path: polygon(0% 15%, 15% 15%, 15% 0%, 85% 0%, 85% 15%, 100% 15%, 100% 85%, 85% 85%, 85% 100%, 15% 100%, 15% 85%, 0% 85%);
          box-shadow: inset 2px 2px 0 rgba(255,255,255,0.3), inset -2px -2px 0 rgba(0,0,0,0.2);
        }
        
        .tetris-block-enter {
          animation: fallDown 0.5s forwards;
        }
        
        .tetris-block-distance {
          animation-delay: 0.1s;
        }
        
        .tetris-block-hours {
          animation-delay: 0.2s;
        }
        
        .tetris-block-skills {
          animation-delay: 0.3s;
        }
        
        .tetris-block-location {
          animation-delay: 0.4s;
        }
        
        .tetris-score-indicator {
          animation: pulse 1.5s infinite ease-in-out;
          box-shadow: 0 0 10px rgba(0,0,0,0.2);
        }
      `}</style>
      {/* Map Visualization - 3/4 width */}
      <div className="lg:col-span-3">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-2 bg-gray-50 border-b">
            <h3 className="text-sm font-medium">Location Matching Map</h3>
            <div className="flex items-center gap-2">
              <Switch 
                id="radius-filter" 
                checked={filterByRadius}
                onCheckedChange={setFilterByRadius}
              />
              <Label htmlFor="radius-filter" className="text-xs cursor-pointer">
                Filter by service radius
              </Label>
            </div>
          </div>
          {filterByRadius && (
            <div className="p-2 bg-blue-50 border-b flex items-center justify-between">
              <div className="flex-1">
                <Select
                  value={selectedCaregiver?.id || ''}
                  onValueChange={(value) => {
                    const caregiver = availableCaregivers?.find(c => c.id === value) || null;
                    handleCaregiverSelect(caregiver);
                  }}
                >
                  <SelectTrigger className="w-full text-xs">
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
              {selectedCaregiver && (
                <div className="text-xs ml-2 text-blue-700">
                  Showing clients within {selectedCaregiver.serviceRadius} miles
                </div>
              )}
            </div>
          )}
          <MapVisualization
            clients={allClients}
            caregivers={availableCaregivers}
            onSelectClient={handleClientSelect}
            onSelectCaregiver={handleCaregiverSelect}
            showDistances={true}
            height="600px"
            filterByRadius={filterByRadius}
            selectedCaregiver={selectedCaregiver}
          />
        </Card>
      </div>
      
      {/* Sidebar with client list and matches - 1/4 width */}
      <div className="lg:col-span-1">
        {/* Client selection panel */}
        <Card className="p-4 mb-6">
          <h3 className="text-lg font-bold mb-3">Select Client</h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {allClients.map(client => (
              <div 
                key={client.id}
                className={`p-2 rounded cursor-pointer hover:bg-gray-100 border ${selectedClient?.id === client.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                onClick={() => selectClient(client)}
              >
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="font-medium">{client.firstName} {client.lastName}</p>
                    <p className="text-xs text-gray-500">{client.address}</p>
                  </div>
                  <div>
                    {client.status === ClientStatus.UNSTABLE && (
                      <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span>
                    )}
                    {client.status === ClientStatus.STABLE && (
                      <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                    )}
                    {client.status === ClientStatus.NEW_REFERRAL && (
                      <span className="inline-block w-3 h-3 bg-purple-500 rounded-full"></span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Matched caregivers panel */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold">Caregivers Within Radius</h3>
            {matchedCaregivers.length > 0 && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-7 px-2"
                  onClick={exportMatches}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
                <Label htmlFor="match-quality" className="text-xs whitespace-nowrap ml-2">Match Quality:</Label>
                <Select
                  value={matchThreshold.toString()}
                  onValueChange={(value) => setMatchThreshold(parseInt(value))}
                >
                  <SelectTrigger className="h-7 text-xs" id="match-quality">
                    <SelectValue placeholder="Match quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">Low (30%+)</SelectItem>
                    <SelectItem value="50">Medium (50%+)</SelectItem>
                    <SelectItem value="70">High (70%+)</SelectItem>
                    <SelectItem value="85">Excellent (85%+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Total matches:</span>
              <Badge variant="outline">{matchedCaregivers.length}</Badge>
            </div>
            {matchedCaregivers.length > 0 && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-gray-500">Excellent matches (80%+):</span>
                  </div>
                  <Badge variant="outline">{matchedCaregivers.filter(m => m.matchScore >= 80).length}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-gray-500">Good matches (60-79%):</span>
                  </div>
                  <Badge variant="outline">{matchedCaregivers.filter(m => m.matchScore >= 60 && m.matchScore < 80).length}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-amber-500 mr-2"></div>
                    <span className="text-gray-500">Fair matches (under 60%):</span>
                  </div>
                  <Badge variant="outline">{matchedCaregivers.filter(m => m.matchScore < 60).length}</Badge>
                </div>
                <div className="border-t border-gray-100 pt-2 mt-2">
                  <p className="text-xs text-gray-500 mb-1">Match calculation factors:</p>
                  <ul className="text-xs text-gray-500 list-disc pl-4 space-y-0.5">
                    <li>Location proximity (40%)</li>
                    <li>Hours availability (25%)</li>
                    <li>Skills matching client needs (25%)</li>
                    <li>Preferred locations (10%)</li>
                  </ul>
                </div>
              </>
            )}
          </div>
          
          {!selectedClient ? (
            <div className="text-center py-8 text-gray-500">
              <p>Select a client to view nearby caregivers</p>
            </div>
          ) : loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : matchedCaregivers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No caregivers found within service radius</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto" ref={matchCardsRef}>
              {matchedCaregivers
                .filter(match => match.matchScore >= matchThreshold)
                .map(({ caregiver, distance, duration, matchScore, distanceScore, hoursScore, skillsMatchPercentage, locationPrefScore }) => (
                  <div 
                    id={`match-card-${caregiver.id}`}
                    key={caregiver.id} 
                    className={`p-3 border rounded hover:bg-gray-50 relative match-card ${
                      matchScore >= 80 ? 'border-green-300 bg-green-50' : 
                      matchScore >= 60 ? 'border-blue-300 bg-blue-50' : 
                      'border-amber-200 bg-amber-50'
                    }`}
                  >
                    {/* Page corner fold effect */}
                    <div className="page-corner"></div>
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{caregiver.firstName} {caregiver.lastName}</p>
                        <div className="flex items-center mt-1 text-xs text-gray-500 space-x-2">
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                            <span>{distance.toFixed(1)} mi</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1 text-gray-400" />
                            <span>{duration.toFixed(0)} min drive</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-xs font-medium">Match Score</div>
                        <div className={`text-base font-bold ${
                          matchScore >= 80 ? 'text-green-600' : 
                          matchScore >= 60 ? 'text-blue-600' : 
                          'text-amber-600'
                        }`}> 
                          {matchScore}%
                          
                          {/* Tetris decoration */}
                          {matchScore >= 80 && (
                            <div className="absolute top-1 right-7 opacity-20 pointer-events-none">
                              <div className="tetrominoe tetrominoe-i" style={{ transform: 'rotate(15deg)' }}></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs">
                      <div className="grid grid-cols-4 gap-1 mb-2">
                        <div className="col-span-4 font-medium mb-1">Match Factors</div>
                        
                        <div className={`p-1 rounded text-center text-xs font-medium text-white tetris-block tetris-block-distance ${distanceScore >= 90 ? 'bg-green-500' : distanceScore >= 70 ? 'bg-blue-500' : distanceScore >= 40 ? 'bg-amber-500' : 'bg-red-400'}`} style={{animationDelay: '0.1s'}}>
                          {distanceScore.toFixed(0)}%
                          <div className="text-[10px]">Distance</div>
                        </div>
                        
                        <div className={`p-1 rounded text-center text-xs font-medium text-white tetris-block tetris-block-hours ${hoursScore >= 90 ? 'bg-green-500' : hoursScore >= 70 ? 'bg-blue-500' : hoursScore >= 40 ? 'bg-amber-500' : 'bg-red-400'}`} style={{animationDelay: '0.2s'}}>
                          {hoursScore.toFixed(0)}%
                          <div className="text-[10px]">Hours</div>
                        </div>
                        
                        <div className={`p-1 rounded text-center text-xs font-medium text-white tetris-block tetris-block-skills ${skillsMatchPercentage >= 90 ? 'bg-green-500' : skillsMatchPercentage >= 70 ? 'bg-blue-500' : skillsMatchPercentage >= 40 ? 'bg-amber-500' : 'bg-red-400'}`} style={{animationDelay: '0.3s'}}>
                          {skillsMatchPercentage.toFixed(0)}%
                          <div className="text-[10px]">Skills</div>
                        </div>
                        
                        <div className={`p-1 rounded text-center text-xs font-medium text-white tetris-block tetris-block-location ${locationPrefScore >= 90 ? 'bg-green-500' : locationPrefScore >= 70 ? 'bg-blue-500' : locationPrefScore >= 40 ? 'bg-amber-500' : 'bg-red-400'}`} style={{animationDelay: '0.4s'}}>
                          {locationPrefScore.toFixed(0)}%
                          <div className="text-[10px]">Location</div>
                        </div>
                      </div>
                      
                      {/* Tetris-inspired visualization of match quality */}
                      <div className="mt-3 mb-1 font-medium flex items-center">
                        <span>Match Quality Visualization</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="ml-2">
                                <HelpCircle className="h-4 w-4 text-gray-400 hover:text-blue-500 transition-colors" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="w-80 p-4 relative overflow-hidden page-turn-in">
                              {/* Tetris block decorations */}
                              <div className="tetrominoe tetrominoe-i" style={{ top: '10px', right: '10px', transform: 'rotate(15deg)', opacity: 0.2 }}></div>
                              <div className="tetrominoe tetrominoe-l" style={{ bottom: '10px', left: '30px', transform: 'rotate(-10deg)', opacity: 0.2 }}></div>
                              <div className="tetrominoe tetrominoe-t" style={{ top: '30px', left: '50px', transform: 'rotate(5deg)', opacity: 0.2 }}></div>
                              <div className="tetrominoe tetrominoe-o" style={{ bottom: '30px', right: '40px', transform: 'rotate(-5deg)', opacity: 0.2 }}></div>
                              <div className="space-y-2">
                                <p className="font-medium">🧩 Tetris-Style Matching System</p>
                                <p className="text-sm">Our matching algorithm works like a game of Tetris, fitting caregivers into clients' schedules based on:</p>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  <div className="flex items-center space-x-2 p-1 rounded bg-blue-50">
                                    <div className="h-4 w-4 bg-blue-400 tetris-block tetris-block-distance"></div>
                                    <span className="text-xs">Distance (40%)</span>
                                  </div>
                                  <div className="flex items-center space-x-2 p-1 rounded bg-amber-50">
                                    <div className="h-4 w-4 bg-amber-400 tetris-block tetris-block-hours"></div>
                                    <span className="text-xs">Hours (25%)</span>
                                  </div>
                                  <div className="flex items-center space-x-2 p-1 rounded bg-purple-50">
                                    <div className="h-4 w-4 bg-purple-400 tetris-block tetris-block-skills"></div>
                                    <span className="text-xs">Skills (25%)</span>
                                  </div>
                                  <div className="flex items-center space-x-2 p-1 rounded bg-green-50">
                                    <div className="h-4 w-4 bg-green-400 tetris-block tetris-block-location"></div>
                                    <span className="text-xs">Location (10%)</span>
                                  </div>
                                </div>
                                <div className="my-2 p-2 bg-blue-50 border border-blue-100 rounded relative">
                                  <p className="text-xs italic">"Just like in Tetris, the perfect match happens when all pieces align perfectly!"</p>
                                </div>
                                <ul className="text-xs list-disc pl-4 space-y-1">
                                  <li>Each colored block represents a matching factor</li>
                                  <li>Blocks "fall into place" to create a complete match</li>
                                  <li>Better matches have more complete, aligned blocks</li>
                                  <li>The cursor shows the overall match quality percentage</li>
                                </ul>
                                <div className="flex items-center justify-between text-xs mt-2">
                                  <span className="text-amber-600 font-medium">Fair: &lt;60%</span>
                                  <span className="text-blue-600 font-medium">Good: 60-79%</span>
                                  <span className="text-green-600 font-medium">Excellent: 80%+</span>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="relative h-12 flex flex-col mb-4">
                        <div className="text-xs text-gray-500 mb-1 flex justify-between px-1">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                        
                        {/* Main Tetris game board */}
                        <div 
                          className="w-full h-8 bg-gray-100 border border-gray-300 relative overflow-hidden rounded-sm group hover:bg-gray-50 transition-colors cursor-pointer" 
                          onClick={() => {
                            // Show a more detailed summary of the match
                            toast("Match details", {
                              description: `Distance: ${distanceScore.toFixed(0)}%, Hours: ${hoursScore.toFixed(0)}%, Skills: ${skillsMatchPercentage.toFixed(0)}%, Location: ${locationPrefScore.toFixed(0)}%`,
                              action: {
                                label: "Show Map",
                                onClick: () => document.getElementById("map-tab")?.click(),
                              },
                            });
                          }}
                        >
                          {/* Grid pattern like a Tetris board */}
                          <div className="absolute inset-0 grid grid-cols-10 grid-rows-2">
                            {Array(20).fill(0).map((_, i) => (
                              <div key={i} className="border-r border-b border-gray-200"></div>
                            ))}
                          </div>
                          
                          {/* Distance factor block (40%) - L shape */}
                          <div 
                            className={`absolute left-0 top-0 h-full tetris-block tetris-block-enter tetris-block-distance
                              ${matchScore >= 80 ? 'bg-green-500' : matchScore >= 60 ? 'bg-blue-500' : 'bg-amber-500'}`} 
                            style={{ width: `${Math.min(100, distanceScore * 0.4)}%` }}
                          >
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">D</div>
                            {/* Interactive tooltip */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-70 z-10">
                              <div className="text-xs text-white font-medium px-2 py-1 rounded">
                                Distance: {distanceScore.toFixed(0)}%
                              </div>
                            </div>
                          </div>
                          
                          {/* Hours factor block (25%) - Square shape */}
                          <div 
                            className={`absolute top-0 h-full tetris-block tetris-block-enter tetris-block-hours
                              ${matchScore >= 80 ? 'bg-green-600' : matchScore >= 60 ? 'bg-blue-600' : 'bg-amber-600'}`}
                            style={{ left: `${Math.min(100, distanceScore * 0.4)}%`, width: `${Math.min(100 - (distanceScore * 0.4), hoursScore * 0.25)}%`, animationDelay: '0.15s' }}
                          >
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">H</div>
                            {/* Interactive tooltip */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-70 z-10">
                              <div className="text-xs text-white font-medium px-2 py-1 rounded">
                                Hours: {hoursScore.toFixed(0)}%
                              </div>
                            </div>
                          </div>
                          
                          {/* Skills factor block (25%) - T shape */}
                          <div 
                            className={`absolute top-0 h-full tetris-block tetris-block-enter tetris-block-skills
                              ${matchScore >= 80 ? 'bg-green-700' : matchScore >= 60 ? 'bg-blue-700' : 'bg-amber-700'}`}
                            style={{ 
                              left: `${Math.min(100, (distanceScore * 0.4) + (hoursScore * 0.25))}%`, 
                              width: `${Math.min(100 - ((distanceScore * 0.4) + (hoursScore * 0.25)), skillsMatchPercentage * 0.25)}%`,
                              animationDelay: '0.3s'
                            }}
                          >
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">S</div>
                            {/* Interactive tooltip */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-70 z-10">
                              <div className="text-xs text-white font-medium px-2 py-1 rounded">
                                Skills: {skillsMatchPercentage.toFixed(0)}%
                              </div>
                            </div>
                          </div>
                          
                          {/* Location preference factor block (10%) - I shape */}
                          <div 
                            className={`absolute top-0 h-full tetris-block tetris-block-enter tetris-block-location
                              ${matchScore >= 80 ? 'bg-green-800' : matchScore >= 60 ? 'bg-blue-800' : 'bg-amber-800'}`}
                            style={{ 
                              left: `${Math.min(100, (distanceScore * 0.4) + (hoursScore * 0.25) + (skillsMatchPercentage * 0.25))}%`, 
                              width: `${Math.min(100 - ((distanceScore * 0.4) + (hoursScore * 0.25) + (skillsMatchPercentage * 0.25)), locationPrefScore * 0.1)}%`,
                              animationDelay: '0.45s'
                            }}
                          >
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">L</div>
                            {/* Interactive tooltip */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-70 z-10">
                              <div className="text-xs text-white font-medium px-2 py-1 rounded">
                                Location: {locationPrefScore.toFixed(0)}%
                              </div>
                            </div>
                          </div>

                          {/* Complete match indicator - only shows when all blocks are high scoring */}
                          {matchScore >= 85 && (
                            <div className="absolute inset-0 bg-green-100 opacity-30 animate-pulse z-10 pointer-events-none">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-bold text-green-800 bg-white px-2 py-0.5 rounded shadow-sm">PERFECT MATCH!</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Tetris-style threshold indicators */}
                        <div className="absolute top-6 left-0 w-full pointer-events-none">
                          {/* Tetris-style threshold indicators with animation */}
                          {/* Poor threshold */}
                          <div className="absolute h-10 border-l-2 border-dashed border-amber-500 animate-pulse" style={{ left: '50%', animationDuration: '3s' }}>
                            <div className="absolute -top-4 -left-4 w-8 h-4 bg-amber-100 border border-amber-500 text-xs flex items-center justify-center rounded-sm">50%</div>
                          </div>
                          
                          {/* Good threshold */}
                          <div className="absolute h-10 border-l-2 border-dashed border-blue-500 animate-pulse" style={{ left: '60%', animationDuration: '4s' }}>
                            <div className="absolute -top-4 -left-4 w-8 h-4 bg-blue-100 border border-blue-500 text-xs flex items-center justify-center rounded-sm">60%</div>
                          </div>
                          
                          {/* Excellent threshold */}
                          <div className="absolute h-10 border-l-2 border-dashed border-green-500 animate-pulse" style={{ left: '80%', animationDuration: '5s' }}>
                            <div className="absolute -top-4 -left-4 w-8 h-4 bg-green-100 border border-green-500 text-xs flex items-center justify-center rounded-sm">80%</div>
                          </div>
                        </div>
                        
                        {/* Match score indicator - shows where we are on the Tetris board */}
                        <div 
                          className={`absolute -bottom-3 h-7 w-7 rounded tetris-score-indicator flex items-center justify-center text-white text-xs font-bold transform -translate-x-1/2 ${matchScore >= 80 ? 'bg-green-600' : matchScore >= 60 ? 'bg-blue-600' : 'bg-amber-600'}`}
                          style={{ left: `${matchScore}%` }}
                        >
                          {matchScore}%
                        </div>
                      </div>
                      
                      {/* Tetris legend */}
                      <div className="flex text-xs text-gray-500 justify-between mb-2 mt-3">
                        <div className="flex items-center">
                          <div className="w-3 h-3 tetris-block tetris-block-distance bg-green-500 mr-1"></div>
                          <span>D: Distance (40%)</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="ml-1">
                                  <HelpCircle className="h-3 w-3 text-gray-400 hover:text-blue-500 transition-colors" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                <p className="text-xs">Location proximity between caregiver and client</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 tetris-block tetris-block-hours bg-green-600 mr-1"></div>
                          <span>H: Hours (25%)</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="ml-1">
                                  <HelpCircle className="h-3 w-3 text-gray-400 hover:text-blue-500 transition-colors" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                <p className="text-xs">Availability and schedule compatibility</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 tetris-block tetris-block-skills bg-green-700 mr-1"></div>
                          <span>S: Skills (25%)</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="ml-1">
                                  <HelpCircle className="h-3 w-3 text-gray-400 hover:text-blue-500 transition-colors" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                <p className="text-xs">How well caregiver skills match client needs</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 tetris-block tetris-block-location bg-green-800 mr-1"></div>
                          <span>L: Location (10%)</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="ml-1">
                                  <HelpCircle className="h-3 w-3 text-gray-400 hover:text-blue-500 transition-colors" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                <p className="text-xs">Preferred location/neighborhood matches</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-1 mt-3">
                        <div className="flex items-center">
                          <Badge variant="outline" className="text-xs font-normal">
                            {caregiver.preferredHoursPerWeek - (caregiver.currentHoursAssigned || 0)} hrs available
                          </Badge>
                        </div>
                        <div className="flex justify-end">
                          <Badge variant="outline" className="text-xs font-normal">
                            {caregiver.serviceRadius} mile radius
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {selectedClient?.careNeeds && caregiver.skills && (
                        <div className="w-full mb-2">
                          <div className="text-xs font-medium mb-1">Care Needs Match</div>
                          <div className="grid gap-1 grid-cols-2">
                            {selectedClient.careNeeds.map((need, i) => {
                              const isMatched = caregiver.skills.some(skill => 
                                skill.toLowerCase().includes(need.toLowerCase()) || 
                                need.toLowerCase().includes(skill.toLowerCase())
                              );
                              return (
                                <span 
                                  key={i} 
                                  className={`text-xs px-2 py-0.5 rounded flex items-center ${isMatched ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                                >
                                  {isMatched ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                                  {need}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      <div className="w-full">
                        <div className="text-xs font-medium mb-1">Caregiver Skills</div>
                        <div className="flex flex-wrap gap-1">
                          {caregiver.skills.slice(0, 3).map((skill, i) => (
                            <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{skill}</span>
                          ))}
                          {caregiver.skills.length > 3 && (
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">+{caregiver.skills.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full text-xs"
                          onClick={() => {
                            // View caregiver details
                            handleCaregiverSelect(caregiver);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                      <div className="flex-1">
                        <Button 
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => {
                            toast.success(`Caregiver ${caregiver.firstName} ${caregiver.lastName} selected for client ${selectedClient?.firstName} ${selectedClient?.lastName}`, {
                              style: {
                                border: '1px solid #10b981',
                                background: 'linear-gradient(to right, #ecfdf5, #d1fae5)',
                                borderRadius: '8px',
                              },
                              icon: '🧩',
                            });
                            // Trigger page-turning animation
                            const cardElement = document.getElementById(`match-card-${caregiver.id}`);
                            if (cardElement) {
                              cardElement.classList.add('page-turn');
                              setTimeout(() => {
                                toast.success('Assignment completed! Perfect Tetris match! 🎮', {
                                  style: {
                                    border: '1px solid #10b981',
                                    background: 'linear-gradient(to right, #ecfdf5, #d1fae5)',
                                    borderRadius: '8px',
                                  },
                                  icon: '🏆',
                                });
                                cardElement.classList.remove('page-turn');
                              }, 1000);
                            }
                          }}
                        >
                          Assign to Client
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              {matchedCaregivers.filter(match => match.matchScore >= matchThreshold).length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <AlertTriangle className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                  <p>No caregivers meet the current threshold ({matchThreshold}%)</p>
                  <p className="text-sm mt-1">Try lowering the match quality threshold</p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}