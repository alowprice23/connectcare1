import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useClients } from "../utils/dataHooks";
import { Client, ClientStatus, ShiftType } from "../utils/models";
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Check } from 'lucide-react';

interface ClientFormProps {
  initialData?: Partial<Client>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ClientForm({ initialData, onSuccess, onCancel }: ClientFormProps) {
  const { createClient, updateClient } = useClients();
  const navigate = useNavigate();
  const isEditing = !!initialData?.id;
  
  // Form state
  const [formData, setFormData] = useState<Partial<Client>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    status: ClientStatus.NEW_REFERRAL,
    careNeeds: [],
    medicalConditions: [],
    careLevel: 1,
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    preferredCaregiverTraits: [],
    assignedCaregivers: [],
    shifts: [],
    notes: '',
    transportation: {
      hasCar: false,
      onBusLine: false,
      needsTransportation: false,
      transportationNotes: ''
    },
    authorization: {
      startDate: '',
      endDate: '',
      totalAuthorizedHours: 0
    },
    ...initialData
  });
  
  // New care need input
  const [newCareNeed, setNewCareNeed] = useState('');
  const [newMedicalCondition, setNewMedicalCondition] = useState('');
  const [newPreferredTrait, setNewPreferredTrait] = useState('');
  
  // New shift input
  const [newShift, setNewShift] = useState({
    type: ShiftType.MORNING,
    dayOfWeek: 'Monday',
    startTime: '08:00',
    endTime: '12:00'
  });
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle emergency contact changes
  const handleEmergencyContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [name]: value
      }
    }));
  };
  
  // Handle transportation changes
  const handleTransportationChange = (name: string, value: boolean | string) => {
    setFormData(prev => ({
      ...prev,
      transportation: {
        ...prev.transportation,
        [name]: value
      }
    }));
  };
  
  // Add care need
  const addCareNeed = () => {
    if (newCareNeed.trim()) {
      setFormData(prev => ({
        ...prev,
        careNeeds: [...(prev.careNeeds || []), newCareNeed.trim()]
      }));
      setNewCareNeed('');
    }
  };
  
  // Remove care need
  const removeCareNeed = (index: number) => {
    setFormData(prev => ({
      ...prev,
      careNeeds: prev.careNeeds?.filter((_, i) => i !== index) || []
    }));
  };
  
  // Add medical condition
  const addMedicalCondition = () => {
    if (newMedicalCondition.trim()) {
      setFormData(prev => ({
        ...prev,
        medicalConditions: [...(prev.medicalConditions || []), newMedicalCondition.trim()]
      }));
      setNewMedicalCondition('');
    }
  };
  
  // Remove medical condition
  const removeMedicalCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medicalConditions: prev.medicalConditions?.filter((_, i) => i !== index) || []
    }));
  };
  
  // Add preferred trait
  const addPreferredTrait = () => {
    if (newPreferredTrait.trim()) {
      setFormData(prev => ({
        ...prev,
        preferredCaregiverTraits: [...(prev.preferredCaregiverTraits || []), newPreferredTrait.trim()]
      }));
      setNewPreferredTrait('');
    }
  };
  
  // Remove preferred trait
  const removePreferredTrait = (index: number) => {
    setFormData(prev => ({
      ...prev,
      preferredCaregiverTraits: prev.preferredCaregiverTraits?.filter((_, i) => i !== index) || []
    }));
  };
  
  // Add shift
  const addShift = () => {
    setFormData(prev => ({
      ...prev,
      shifts: [...(prev.shifts || []), { ...newShift }]
    }));
    
    // Reset the new shift form
    setNewShift({
      type: ShiftType.MORNING,
      dayOfWeek: 'Monday',
      startTime: '08:00',
      endTime: '12:00'
    });
  };
  
  // Remove shift
  const removeShift = (index: number) => {
    setFormData(prev => ({
      ...prev,
      shifts: prev.shifts?.filter((_, i) => i !== index) || []
    }));
  };
  
  // Handle submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing && initialData?.id) {
        await updateClient(initialData.id, formData);
        toast.success("Client updated successfully");
      } else {
        await createClient(formData as Omit<Client, 'id'>);
        toast.success("Client created successfully");
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/admin');
      }
    } catch (error) {
      toast.error(isEditing ? "Failed to update client" : "Failed to create client");
      console.error(error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">{isEditing ? 'Edit Client' : 'Add New Client'}</h2>
        
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        {/* Address Information */}
        <h3 className="text-lg font-medium mb-2">Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="md:col-span-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="zip">ZIP Code</Label>
            <Input
              id="zip"
              name="zip"
              value={formData.zip}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        {/* Transportation Information */}
        <h3 className="text-lg font-medium mb-2">Transportation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <Switch 
              id="hasCar" 
              checked={formData.transportation?.hasCar || false}
              onCheckedChange={(checked) => handleTransportationChange('hasCar', checked)}
            />
            <Label htmlFor="hasCar">Has Car</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="onBusLine" 
              checked={formData.transportation?.onBusLine || false}
              onCheckedChange={(checked) => handleTransportationChange('onBusLine', checked)}
            />
            <Label htmlFor="onBusLine">On Bus Line</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="needsTransportation" 
              checked={formData.transportation?.needsTransportation || false}
              onCheckedChange={(checked) => handleTransportationChange('needsTransportation', checked)}
            />
            <Label htmlFor="needsTransportation">Needs Transportation</Label>
          </div>
          
          <div className="md:col-span-3">
            <Label htmlFor="transportationNotes">Transportation Notes</Label>
            <Textarea
              id="transportationNotes"
              value={formData.transportation?.transportationNotes || ''}
              onChange={(e) => handleTransportationChange('transportationNotes', e.target.value)}
              rows={2}
            />
          </div>
        </div>
        
        {/* Client Status */}
        <div className="mb-6">
          <Label htmlFor="status">Client Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as ClientStatus }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key={ClientStatus.NEW_REFERRAL} value={ClientStatus.NEW_REFERRAL}>New Referral</SelectItem>
              <SelectItem key={ClientStatus.UNSTABLE} value={ClientStatus.UNSTABLE}>Unstable</SelectItem>
              <SelectItem key={ClientStatus.STABLE} value={ClientStatus.STABLE}>Stable</SelectItem>
              <SelectItem key={ClientStatus.INACTIVE} value={ClientStatus.INACTIVE}>Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Care Needs */}
        <h3 className="text-lg font-medium mb-2">Care Needs</h3>
        <div className="mb-6">
          <div className="flex space-x-2 mb-2">
            <Input
              value={newCareNeed}
              onChange={(e) => setNewCareNeed(e.target.value)}
              placeholder="Enter care need"
            />
            <Button type="button" onClick={addCareNeed}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.careNeeds?.map((need, index) => (
              <div key={index} className="flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1">
                <span>{need}</span>
                <button 
                  type="button" 
                  onClick={() => removeCareNeed(index)} 
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Medical Conditions */}
        <h3 className="text-lg font-medium mb-2">Medical Conditions</h3>
        <div className="mb-6">
          <div className="flex space-x-2 mb-2">
            <Input
              value={newMedicalCondition}
              onChange={(e) => setNewMedicalCondition(e.target.value)}
              placeholder="Enter medical condition"
            />
            <Button type="button" onClick={addMedicalCondition}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.medicalConditions?.map((condition, index) => (
              <div key={index} className="flex items-center bg-red-100 text-red-800 rounded-full px-3 py-1">
                <span>{condition}</span>
                <button 
                  type="button" 
                  onClick={() => removeMedicalCondition(index)} 
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Care Level */}
        <div className="mb-6">
          <Label htmlFor="careLevel">Care Level (1-5)</Label>
          <Select 
            value={formData.careLevel?.toString()} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, careLevel: parseInt(value) }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select care level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="1" value="1">1 - Minimal</SelectItem>
              <SelectItem key="2" value="2">2 - Low</SelectItem>
              <SelectItem key="3" value="3">3 - Moderate</SelectItem>
              <SelectItem key="4" value="4">4 - High</SelectItem>
              <SelectItem key="5" value="5">5 - Intensive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Emergency Contact */}
        <h3 className="text-lg font-medium mb-2">Emergency Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <Label htmlFor="emergencyName">Name</Label>
            <Input
              id="emergencyName"
              name="name"
              value={formData.emergencyContact?.name || ''}
              onChange={handleEmergencyContactChange}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="emergencyRelationship">Relationship</Label>
            <Input
              id="emergencyRelationship"
              name="relationship"
              value={formData.emergencyContact?.relationship || ''}
              onChange={handleEmergencyContactChange}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="emergencyPhone">Phone</Label>
            <Input
              id="emergencyPhone"
              name="phone"
              value={formData.emergencyContact?.phone || ''}
              onChange={handleEmergencyContactChange}
              required
            />
          </div>
        </div>
        
        {/* Preferred Caregiver Traits */}
        <h3 className="text-lg font-medium mb-2">Preferred Caregiver Traits</h3>
        <div className="mb-6">
          <div className="flex space-x-2 mb-2">
            <Input
              value={newPreferredTrait}
              onChange={(e) => setNewPreferredTrait(e.target.value)}
              placeholder="Enter preferred trait"
            />
            <Button type="button" onClick={addPreferredTrait}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.preferredCaregiverTraits?.map((trait, index) => (
              <div key={index} className="flex items-center bg-green-100 text-green-800 rounded-full px-3 py-1">
                <span>{trait}</span>
                <button 
                  type="button" 
                  onClick={() => removePreferredTrait(index)} 
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Shifts */}
        <h3 className="text-lg font-medium mb-2">Care Schedule</h3>
        <div className="border border-gray-200 rounded-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="shiftType">Shift Type</Label>
              <Select 
                value={newShift.type} 
                onValueChange={(value) => setNewShift(prev => ({ ...prev, type: value as ShiftType }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key={ShiftType.MORNING} value={ShiftType.MORNING}>Morning</SelectItem>
                  <SelectItem key={ShiftType.AFTERNOON} value={ShiftType.AFTERNOON}>Afternoon</SelectItem>
                  <SelectItem key={ShiftType.EVENING} value={ShiftType.EVENING}>Evening</SelectItem>
                  <SelectItem key={ShiftType.OVERNIGHT} value={ShiftType.OVERNIGHT}>Overnight</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="shiftDay">Day of Week</Label>
              <Select 
                value={newShift.dayOfWeek} 
                onValueChange={(value) => setNewShift(prev => ({ ...prev, dayOfWeek: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="Monday" value="Monday">Monday</SelectItem>
                  <SelectItem key="Tuesday" value="Tuesday">Tuesday</SelectItem>
                  <SelectItem key="Wednesday" value="Wednesday">Wednesday</SelectItem>
                  <SelectItem key="Thursday" value="Thursday">Thursday</SelectItem>
                  <SelectItem key="Friday" value="Friday">Friday</SelectItem>
                  <SelectItem key="Saturday" value="Saturday">Saturday</SelectItem>
                  <SelectItem key="Sunday" value="Sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={newShift.startTime}
                onChange={(e) => setNewShift(prev => ({ ...prev, startTime: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={newShift.endTime}
                onChange={(e) => setNewShift(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </div>
          </div>
          
          <Button type="button" onClick={addShift} className="w-full">
            <Plus className="h-4 w-4 mr-2" /> Add Shift
          </Button>
        </div>
        
        {/* Scheduled Shifts List */}
        {formData.shifts && formData.shifts.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium mb-2">Scheduled Shifts</h4>
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.shifts.map((shift, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{shift.dayOfWeek}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shift.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shift.startTime} - {shift.endTime}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          type="button" 
                          onClick={() => removeShift(index)} 
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Notes */}
        <div className="mb-6">
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
            rows={4}
          />
        </div>
        
        {/* Authorization Information */}
        <h3 className="text-lg font-medium mb-2">Authorization Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <Label htmlFor="authStartDate">Start Date</Label>
            <Input
              id="authStartDate"
              type="date"
              value={formData.authorization?.startDate || ''}
              onChange={(e) => {
                const newDate = e.target.value;
                setFormData(prev => ({
                  ...prev,
                  authorization: {
                    ...prev.authorization || {},
                    startDate: newDate
                  }
                }));
              }}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="authEndDate">End Date</Label>
            <Input
              id="authEndDate"
              type="date"
              value={formData.authorization?.endDate || ''}
              onChange={(e) => {
                const newDate = e.target.value;
                setFormData(prev => ({
                  ...prev,
                  authorization: {
                    ...prev.authorization || {},
                    endDate: newDate
                  }
                }));
              }}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="totalAuthorizedHours">Total Authorized Hours</Label>
            <Input
              id="totalAuthorizedHours"
              type="number"
              min="0"
              step="0.01"
              value={formData.authorization?.totalAuthorizedHours || 0}
              onChange={(e) => {
                const hours = parseFloat(e.target.value);
                setFormData(prev => ({
                  ...prev,
                  authorization: {
                    ...prev.authorization || {},
                    totalAuthorizedHours: hours
                  }
                }));
              }}
              required
            />
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            <Check className="h-4 w-4 mr-2" />
            {isEditing ? 'Update Client' : 'Create Client'}
          </Button>
        </div>
      </Card>
    </form>
  );
}
