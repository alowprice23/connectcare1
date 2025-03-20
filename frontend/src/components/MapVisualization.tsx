import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Circle } from '@react-google-maps/api';
import { Client, Caregiver, CaregiverStatus, ClientStatus } from 'utils/models';
import { locationService, DistanceResult } from 'utils/locationService';
import { FaMapMarkerAlt, FaUser, FaHome } from 'react-icons/fa';
import { Skeleton } from '@/components/ui/skeleton';

// Google Maps API key
const GOOGLE_API_KEY = 'AIzaSyDJGHOUR0YMdnndXOSRZ06CdUj3obDx2jE';

// Map container styles
const containerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '0.5rem',
};

// Default map center (Boston)
const defaultCenter = {
  lat: 42.3601,
  lng: -71.0589
};

interface Props {
  clients?: Client[];
  caregivers?: Caregiver[];
  onSelectClient?: (client: Client) => void;
  onSelectCaregiver?: (caregiver: Caregiver) => void;
  height?: string;
  width?: string;
  showDistances?: boolean;
  filterByRadius?: boolean;
  selectedCaregiver?: Caregiver | null;
}

export function MapVisualization({
  clients = [],
  caregivers = [],
  onSelectClient,
  onSelectCaregiver,
  height = '500px',
  width = '100%',
  showDistances = false,
  filterByRadius = false,
  selectedCaregiver: initialSelectedCaregiver = null
}: Props) {
  // Load Google Maps JavaScript API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_API_KEY
  });

  // State for map instance
  const [map, setMap] = useState<google.maps.Map | null>(null);
  
  // State for selected markers
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [internalSelectedCaregiver, setInternalSelectedCaregiver] = useState<Caregiver | null>(initialSelectedCaregiver);
  
  // Use this for all references to the selected caregiver
  const selectedCaregiver = initialSelectedCaregiver || internalSelectedCaregiver;
  
  // State for distance information
  const [distances, setDistances] = useState<Record<string, Record<string, DistanceResult>>>({});
  
  // We don't need to track bounds as state

  // Filter clients by selected caregiver's radius if needed
  const filteredClients = useMemo(() => {
    if (!filterByRadius || !selectedCaregiver || !selectedCaregiver.location || !selectedCaregiver.serviceRadius) {
      return clients;
    }
    
    // Only show clients within the selected caregiver's service radius
    return clients.filter(client => {
      if (!client.location) return false;
      
      // Calculate distance between caregiver and client
      const distanceInMiles = locationService.calculateDistanceInMiles(
        { latitude: selectedCaregiver.location.latitude, longitude: selectedCaregiver.location.longitude },
        { latitude: client.location.latitude, longitude: client.location.longitude }
      );
      
      // Return true if client is within service radius
      return distanceInMiles <= selectedCaregiver.serviceRadius;
    });
  }, [clients, selectedCaregiver, filterByRadius]);



  // Map load callback
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  // Map unmount callback
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Calculate distances between clients and caregivers
  useEffect(() => {
    if (showDistances && clients.length > 0 && caregivers.length > 0) {
      const distanceMap: Record<string, Record<string, DistanceResult>> = {};
      
      // For each client, calculate distance to each caregiver
      const fetchDistances = async () => {
        // Only calculate for available caregivers to reduce calculations
        const availableCaregivers = caregivers.filter(caregiver => 
          caregiver.status === CaregiverStatus.AVAILABLE
        );
        
        // Filter clients and caregivers with location data
        const clientsWithLocation = clients.filter(
          client => client.location && client.location.latitude && client.location.longitude
        );
        
        // Get caregivers that need geocoding
        const caregiversToGeocode = availableCaregivers.filter(
          caregiver => !caregiver.location || !caregiver.location.latitude || !caregiver.location.longitude
        );
        
        // Process geocoding in smaller batches to avoid rate limiting
        if (caregiversToGeocode.length > 0) {
          console.log(`Geocoding ${caregiversToGeocode.length} caregivers for distance calculation...`);
          const batchSize = 5;
          
          for (let i = 0; i < caregiversToGeocode.length; i += batchSize) {
            const batch = caregiversToGeocode.slice(i, i + batchSize);
            
            // Process batch in parallel
            await Promise.all(batch.map(async (caregiver) => {
              try {
                const fullAddress = `${caregiver.address}, ${caregiver.city}, ${caregiver.state} ${caregiver.zip}`;
                const geocodingResult = await locationService.geocodeAddress(fullAddress);
                
                if (geocodingResult) {
                  // Update caregiver with location data (in memory only)
                  caregiver.location = {
                    latitude: geocodingResult.latitude,
                    longitude: geocodingResult.longitude
                  };
                }
              } catch (error) {
                console.error(`Error geocoding caregiver:`, error);
              }
            }));
            
            // Add a small delay between batches
            if (i + batchSize < caregiversToGeocode.length) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        }
        
        // Now calculate distances using fast Haversine formula
        // Process in batches for better UI responsiveness
        const totalCalculations = clientsWithLocation.length * availableCaregivers.length;
        console.log(`Calculating ${totalCalculations} distances...`);
        
        // Initialize distance map for all clients
        clientsWithLocation.forEach(client => {
          distanceMap[client.id] = {};
        });
        
        // Calculate distances in smaller chunks to prevent UI freezing
        const chunkSize = 50; // Process 50 calculations at a time
        let calculationsDone = 0;
        
        for (const client of clientsWithLocation) {
          for (let i = 0; i < availableCaregivers.length; i += chunkSize) {
            const caregiverChunk = availableCaregivers.slice(i, i + chunkSize);
            
            // Process this batch
            caregiverChunk.forEach(caregiver => {
              // Skip caregivers without location data
              if (!caregiver.location || !caregiver.location.latitude || !caregiver.location.longitude) {
                calculationsDone++;
                return;
              }
              
              // Use fast haversine calculation
              const distance = locationService.calculateDistanceInMiles(
                client.location,
                caregiver.location
              );
              
              distanceMap[client.id][caregiver.id] = {
                distance: distance,
                duration: Math.round(distance * 2) // Estimate 2 minutes per mile
              };
              
              calculationsDone++;
            });
            
            // Allow UI to update between chunks
            if (i + chunkSize < availableCaregivers.length) {
              await new Promise(resolve => setTimeout(resolve, 0));
            }
          }
        }
        
        console.log(`Distance calculations complete: ${calculationsDone} distances calculated`);
        setDistances(distanceMap);
      };
      
      fetchDistances();
    }
  }, [clients, caregivers, showDistances]);

  // Update bounds when relevant data changes, using a ref to prevent infinite loops
  const prevBoundsDataRef = React.useRef<{clientsLength: number; caregiversLength: number; selectedCaregiverId?: string; boundsUpdateTime: number}>(
    {clientsLength: 0, caregiversLength: 0, boundsUpdateTime: 0}
  );
  
  useEffect(() => {
    // Check if data has actually changed to avoid unnecessary updates
    const currentData = {
      clientsLength: filteredClients.length,
      caregiversLength: caregivers.length,
      selectedCaregiverId: selectedCaregiver?.id,
      boundsUpdateTime: Date.now() // Add timestamp to prevent rapid updates
    };
    
    const prevData = prevBoundsDataRef.current;
    const timeSinceLastUpdate = currentData.boundsUpdateTime - prevData.boundsUpdateTime;
    
    // Only update if data has changed AND at least 500ms have passed since last update
    const hasChanged = (prevData.clientsLength !== currentData.clientsLength ||
      prevData.caregiversLength !== currentData.caregiversLength ||
      prevData.selectedCaregiverId !== currentData.selectedCaregiverId) &&
      (timeSinceLastUpdate > 500); // Throttle updates to max once per 500ms
    
    if (map && hasChanged) {
      // Update ref with current values
      prevBoundsDataRef.current = currentData;
      
      // Reset bounds
      const newBounds = new window.google.maps.LatLngBounds();
      let hasValidMarkers = false;
      let markersAdded = 0;
      
      // Add client markers to bounds
      for (const client of filteredClients) {
        if (client.location && client.location.latitude && client.location.longitude) {
          newBounds.extend({
            lat: client.location.latitude,
            lng: client.location.longitude
          });
          hasValidMarkers = true;
          markersAdded++;
        }
      }
      
      // Add caregiver markers to bounds - limit to visible ones if many markers
      const maxMarkersForSmooth = 100; // To prevent performance issues with too many markers
      const shouldLimitMarkers = filteredClients.length + caregivers.length > maxMarkersForSmooth;
      
      for (const caregiver of caregivers) {
        // If we have too many markers, only add selected caregiver or available ones
        if (shouldLimitMarkers && 
            caregiver.id !== selectedCaregiver?.id && 
            caregiver.status !== CaregiverStatus.AVAILABLE) {
          continue;
        }
        
        if (caregiver.location && caregiver.location.latitude && caregiver.location.longitude) {
          newBounds.extend({
            lat: caregiver.location.latitude,
            lng: caregiver.location.longitude
          });
          hasValidMarkers = true;
          markersAdded++;
        }
      }
      
      // Only fit bounds if we have markers
      if (hasValidMarkers) {
        // Add a small padding to bounds
        map.fitBounds(newBounds, 20); // 20px padding
        
        // If we have only one marker, zoom in closer
        if (markersAdded === 1) {
          map.setZoom(14); // Closer zoom for single marker
        }
      } else {
        // Center on default location if no markers
        map.setCenter(defaultCenter);
        map.setZoom(10);
      }
    }
  }, [map, filteredClients, caregivers, selectedCaregiver?.id]);

  if (loadError) {
    return <div className="text-red-500 p-4 bg-red-50 rounded-md">Error loading maps: {loadError.message}</div>;
  }

  if (!isLoaded) {
    return (
      <div style={{ width, height }} className="rounded-md overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  // Get icon for client based on status
  const getClientIcon = (status: ClientStatus) => {
    switch (status) {
      case ClientStatus.UNSTABLE:
        return {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(40, 40)
        };
      case ClientStatus.NEW_REFERRAL:
        return {
          url: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png',
          scaledSize: new window.google.maps.Size(40, 40)
        };
      case ClientStatus.STABLE:
        return {
          url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
          scaledSize: new window.google.maps.Size(40, 40)
        };
      default:
        return {
          url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          scaledSize: new window.google.maps.Size(40, 40)
        };
    }
  };

  // Get icon for caregiver based on status
  const getCaregiverIcon = (status: CaregiverStatus) => {
    switch (status) {
      case CaregiverStatus.AVAILABLE:
        return {
          url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          scaledSize: new window.google.maps.Size(35, 35)
        };
      case CaregiverStatus.ASSIGNED:
        return {
          url: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
          scaledSize: new window.google.maps.Size(35, 35)
        };
      default:
        return {
          url: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
          scaledSize: new window.google.maps.Size(35, 35)
        };
    }
  };

  // Return the map component
  return (
    <div style={{ width, height }} className="relative rounded-md overflow-hidden shadow-md">
      <GoogleMap
        mapContainerStyle={{ ...containerStyle, width, height }}
        center={defaultCenter}
        zoom={10}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          fullscreenControl: true,
          streetViewControl: false,
          mapTypeControl: true,
          zoomControl: true,
        }}
      >
        {/* Client Markers */}
        {filteredClients.map(client => {
          // Only render if we have client coordinates
          if (client.location && client.location.latitude && client.location.longitude) {
            return (
              <Marker
                key={`client-${client.id}`}
                position={{
                  lat: client.location.latitude,
                  lng: client.location.longitude
                }}
                icon={getClientIcon(client.status)}
                onClick={() => {
                  setSelectedClient(client);
                  setInternalSelectedCaregiver(null);
                  onSelectClient && onSelectClient(client);
                }}
              />
            );
          }
          return null;
        })}
        
        {/* Caregiver Markers */}
        {caregivers.map(caregiver => {
          // Only render if we have caregiver coordinates
          if (caregiver.location && caregiver.location.latitude && caregiver.location.longitude) {
            return (
              <Marker
                key={`caregiver-${caregiver.id}`}
                position={{
                  lat: caregiver.location.latitude,
                  lng: caregiver.location.longitude
                }}
                icon={getCaregiverIcon(caregiver.status)}
                onClick={() => {
                  setInternalSelectedCaregiver(caregiver);
                  setSelectedClient(null);
                  onSelectCaregiver && onSelectCaregiver(caregiver);
                }}
              />
            );
          }
          return null;
        })}
        
        {/* Service Radius Circle for Selected Caregiver */}
        {selectedCaregiver && selectedCaregiver.location && selectedCaregiver.serviceRadius && (
          <Circle
            center={{
              lat: selectedCaregiver.location.latitude,
              lng: selectedCaregiver.location.longitude
            }}
            radius={selectedCaregiver.serviceRadius * 1609.34} // Convert miles to meters
            options={{
              fillColor: '#2196F3',
              fillOpacity: 0.1,
              strokeColor: '#2196F3',
              strokeOpacity: 0.8,
              strokeWeight: 2
            }}
          />
        )}

        {/* Info Window for Selected Client */}
        {selectedClient && (
          <InfoWindow
            position={{
              lat: selectedClient.location.latitude,
              lng: selectedClient.location.longitude
            }}
            onCloseClick={() => setSelectedClient(null)}
          >
            <div className="p-2 max-w-xs">
              <div className="flex items-center mb-2">
                {selectedClient.status === ClientStatus.UNSTABLE && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded mr-2">Unstable</span>
                )}
                {selectedClient.status === ClientStatus.NEW_REFERRAL && (
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded mr-2">New Referral</span>
                )}
                {selectedClient.status === ClientStatus.STABLE && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-2">Stable</span>
                )}
              </div>
              <h3 className="font-bold text-gray-800">{selectedClient.firstName} {selectedClient.lastName}</h3>
              <p className="text-sm text-gray-600">{selectedClient.address}</p>
              <p className="text-sm text-gray-600">{selectedClient.city}, {selectedClient.state} {selectedClient.zip}</p>
              
              {/* Show care needs */}
              {selectedClient.careNeeds && selectedClient.careNeeds.length > 0 && (
                <div className="mt-2">
                  <h4 className="text-sm font-semibold">Care Needs:</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedClient.careNeeds.map((need, i) => (
                      <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{need}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Show closest caregivers if we have distance data */}
              {showDistances && distances[selectedClient.id] && (
                <div className="mt-3">
                  <h4 className="text-sm font-semibold">Nearest Caregivers:</h4>
                  <div className="mt-1 space-y-2 max-h-32 overflow-y-auto">
                    {Object.entries(distances[selectedClient.id])
                      .sort(([, a], [, b]) => a.distance - b.distance)
                      .slice(0, 3) // Show top 3 closest
                      .map(([caregiverId, distanceData]) => {
                        const caregiver = caregivers.find(c => c.id === caregiverId);
                        if (!caregiver) return null;
                        
                        return (
                          <div key={caregiverId} className="text-xs flex items-center justify-between">
                            <span>{caregiver.firstName} {caregiver.lastName}</span>
                            <span className="font-medium">{distanceData.distance.toFixed(1)} miles</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </InfoWindow>
        )}
        
        {/* Info Window for Selected Caregiver */}
        {selectedCaregiver && selectedCaregiver.location && (
          <InfoWindow
            position={{
              lat: selectedCaregiver.location.latitude,
              lng: selectedCaregiver.location.longitude
            }}
            onCloseClick={() => setInternalSelectedCaregiver(null)}
          >
            <div className="p-2 max-w-xs">
              <div className="flex items-center mb-2">
                {selectedCaregiver.status === CaregiverStatus.AVAILABLE && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">Available</span>
                )}
                {selectedCaregiver.status === CaregiverStatus.ASSIGNED && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mr-2">Assigned</span>
                )}
                {selectedCaregiver.status === CaregiverStatus.NEW_APPLICANT && (
                  <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded mr-2">New Applicant</span>
                )}
              </div>
              <h3 className="font-bold text-gray-800">{selectedCaregiver.firstName} {selectedCaregiver.lastName}</h3>
              <p className="text-sm text-gray-600">{selectedCaregiver.address}</p>
              <p className="text-sm text-gray-600">{selectedCaregiver.city}, {selectedCaregiver.state} {selectedCaregiver.zip}</p>
              
              {/* Show skills */}
              {selectedCaregiver.skills && selectedCaregiver.skills.length > 0 && (
                <div className="mt-2">
                  <h4 className="text-sm font-semibold">Skills:</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedCaregiver.skills.map((skill, i) => (
                      <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Show availability info */}
              <div className="mt-2">
                <h4 className="text-sm font-semibold">Availability:</h4>
                <p className="text-xs">{selectedCaregiver.preferredHoursPerWeek - selectedCaregiver.currentHoursAssigned} of {selectedCaregiver.preferredHoursPerWeek} hrs/week available</p>
                <p className="text-xs">Service radius: {selectedCaregiver.serviceRadius} miles</p>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      
      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 bg-white p-2 rounded-md shadow-md text-xs">
        <div className="font-bold mb-1">Legend:</div>
        <div className="flex items-center mb-1">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
          <span>Unstable Client</span>
        </div>
        <div className="flex items-center mb-1">
          <div className="w-3 h-3 rounded-full bg-purple-500 mr-1"></div>
          <span>New Referral</span>
        </div>
        <div className="flex items-center mb-1">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
          <span>Stable Client</span>
        </div>
        <div className="flex items-center mb-1">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
          <span>Available Caregiver</span>
        </div>
        {selectedCaregiver && selectedCaregiver.serviceRadius && (
          <div className="flex items-center mt-2 border-t border-gray-200 pt-1">
            <div className="w-3 h-3 rounded-md bg-blue-200 border border-blue-500 mr-1"></div>
            <span>{selectedCaregiver.serviceRadius} mile service radius</span>
          </div>
        )}
      </div>
      
      {/* Filtering Indicator */}
      {filterByRadius && selectedCaregiver && (
        <div className="absolute top-3 left-3 bg-blue-100 border border-blue-300 text-blue-800 px-3 py-1 rounded-md shadow-sm text-xs">
          {filteredClients.length > 0 
            ? `Showing ${filteredClients.length} client${filteredClients.length !== 1 ? 's' : ''} within ${selectedCaregiver.serviceRadius} miles of ${selectedCaregiver.firstName} ${selectedCaregiver.lastName}`
            : `No clients found within ${selectedCaregiver.serviceRadius} miles of ${selectedCaregiver.firstName} ${selectedCaregiver.lastName}`
          }
        </div>
      )}
    </div>
  );
}
