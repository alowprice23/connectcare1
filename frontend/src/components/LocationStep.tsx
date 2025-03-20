import React, { useState, useEffect, useRef } from "react";
import { HelpTooltip } from "components/HelpTooltip";
import { Button } from "components/Button";
import { PlusCircle, XCircle, MapPin } from "lucide-react";

// Add the Google Maps script
declare global {
  interface Window {
    google: any;
    initGooglePlaces: () => void;
  }
}

interface LocationStepProps {
  formData: {
    serviceRadius: number;
    preferredLocations: string[];
    transportation: string;
  };
  updateFormData: (data: Partial<LocationStepProps["formData"]>) => void;
}

export function LocationStep({ formData, updateFormData }: LocationStepProps) {
  const [newLocation, setNewLocation] = useState("");
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [placesLoading, setPlacesLoading] = useState(true);
  const autocompleteRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load Google Maps script if not already loaded
    if (!document.getElementById('google-maps-script')) {
      const script = document.createElement('script');
      const apiKey = "AIzaSyDJGHOUR0YMdnndXOSRZ06CdUj3obDx2jE"; // From the requirements
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces`;
      script.async = true;
      script.defer = true;
      
      // Define the callback
      window.initGooglePlaces = () => {
        setGoogleLoaded(true);
        setPlacesLoading(false);
      };
      
      document.body.appendChild(script);
    } else if (window.google) {
      // Script already loaded
      setGoogleLoaded(true);
      setPlacesLoading(false);
    }

    return () => {
      // Cleanup
      window.initGooglePlaces = () => {};
    };
  }, []);

  // Initialize autocomplete when Google is loaded and input is available
  useEffect(() => {
    if (googleLoaded && inputRef.current) {
      try {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'us' }
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          if (place?.formatted_address) {
            setNewLocation(place.formatted_address);
          }
        });

        setPlacesLoading(false);
      } catch (error) {
        console.error("Google Places error:", error);
        setPlacesLoading(false);
      }
    }
  }, [googleLoaded]);

  const addLocation = () => {
    if (newLocation.trim() !== "" && !formData.preferredLocations.includes(newLocation.trim())) {
      updateFormData({
        preferredLocations: [...formData.preferredLocations, newLocation.trim()]
      });
      setNewLocation("");
      
      // Reset the input field
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const removeLocation = (index: number) => {
    const updatedLocations = [...formData.preferredLocations];
    updatedLocations.splice(index, 1);
    updateFormData({ preferredLocations: updatedLocations });
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    updateFormData({ serviceRadius: value });
  };

  const handleTransportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFormData({ transportation: e.target.value });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        Service Location
        <HelpTooltip text="Specify your service area and transportation details to help us match you with nearby clients." />
      </h2>

      <div className="space-y-6">
        <div>
          <label htmlFor="serviceRadius" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            Service Radius
            <HelpTooltip text="How far are you willing to travel for work? This helps us match you with clients within your preferred commuting distance." />
          </label>
          <div className="mt-2">
            <input
              type="range"
              id="serviceRadius"
              min="1"
              max="50"
              step="1"
              value={formData.serviceRadius || 10}
              onChange={handleSliderChange}
              className="w-full accent-blue-600 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
            />
            <div className="flex justify-between mt-2">
              <span className="text-sm text-gray-500">1 mile</span>
              <span className="text-sm font-medium text-blue-600">{formData.serviceRadius || 10} miles</span>
              <span className="text-sm text-gray-500">50 miles</span>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="transportation" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            Transportation Method
            <HelpTooltip text="What's your primary method of transportation to client locations?" />
          </label>
          <select
            id="transportation"
            name="transportation"
            value={formData.transportation}
            onChange={handleTransportChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select transportation method</option>
            <option value="Own Vehicle">Own Vehicle</option>
            <option value="Public Transit">Public Transit</option>
            <option value="Rideshare Services">Rideshare Services (Uber, Lyft)</option>
            <option value="Bicycle">Bicycle</option>
            <option value="Walking">Walking Only (Very Limited Range)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            Preferred Service Locations
            <HelpTooltip text="Enter specific neighborhoods, cities, or areas where you prefer to work. This helps us match you with clients in your preferred areas." />
          </label>
          
          <div className="flex items-center mb-2">
            <div className="relative flex-grow">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                ref={inputRef}
                placeholder="Enter a location"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setNewLocation(e.target.value)}
                disabled={placesLoading}
              />
              {placesLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
            <Button 
              onClick={addLocation}
              disabled={newLocation.trim() === ""}
              className="flex items-center justify-center h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-r-md"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {googleLoaded ? null : (
            <p className="text-sm text-gray-500 mb-2">Loading Google Places...</p>
          )}
          
          {formData.preferredLocations.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {formData.preferredLocations.map((location, index) => (
                <li key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm">{location}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLocation(index)}
                    className="text-red-500 hover:text-red-700 focus:outline-none"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 mt-2">No preferred locations added yet.</p>
          )}
        </div>
      </div>

      <div className="mt-6 px-4 py-3 bg-blue-50 rounded-md">
        <p className="text-sm text-blue-700">
          <span className="font-semibold">Tip:</span> Adding multiple preferred locations and setting an appropriate service radius increases your chances of being matched with clients.
        </p>
      </div>
    </div>
  );
}
