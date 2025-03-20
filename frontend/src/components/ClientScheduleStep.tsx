import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HelpTooltip } from './HelpTooltip';
import { Client, ShiftType } from '../utils/models';
import { Plus } from 'lucide-react';

interface ClientScheduleStepProps {
  formData: Partial<Client>;
  updateFormData: (data: Partial<Client>) => void;
}

export function ClientScheduleStep({ formData, updateFormData }: ClientScheduleStepProps) {
  // New shift input
  const [newShift, setNewShift] = useState({
    type: ShiftType.MORNING,
    dayOfWeek: 'Monday',
    startTime: '08:00',
    endTime: '12:00'
  });
  
  // Add shift
  const addShift = () => {
    updateFormData({
      shifts: [...(formData.shifts || []), { ...newShift }]
    });
    
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
    updateFormData({
      shifts: formData.shifts?.filter((_, i) => i !== index) || []
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        Care Schedule
        <HelpTooltip text="Set up the client's care schedule with specific shifts." />
      </h2>

      {/* Authorization Information */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          Authorization Details
          <HelpTooltip text="Enter details about the client's care authorization." />
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="authStartDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </Label>
            <Input
              id="authStartDate"
              type="date"
              value={formData.authorization?.startDate || ''}
              onChange={(e) => {
                const newDate = e.target.value;
                updateFormData({
                  authorization: {
                    ...formData.authorization || {},
                    startDate: newDate
                  }
                });
              }}
              className="w-full"
            />
          </div>
          
          <div>
            <Label htmlFor="authEndDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </Label>
            <Input
              id="authEndDate"
              type="date"
              value={formData.authorization?.endDate || ''}
              onChange={(e) => {
                const newDate = e.target.value;
                updateFormData({
                  authorization: {
                    ...formData.authorization || {},
                    endDate: newDate
                  }
                });
              }}
              className="w-full"
            />
          </div>
          
          <div>
            <Label htmlFor="totalAuthorizedHours" className="block text-sm font-medium text-gray-700 mb-1">
              Total Authorized Hours
            </Label>
            <Input
              id="totalAuthorizedHours"
              type="number"
              min="0"
              step="0.01"
              value={formData.authorization?.totalAuthorizedHours || 0}
              onChange={(e) => {
                const hours = parseFloat(e.target.value);
                updateFormData({
                  authorization: {
                    ...formData.authorization || {},
                    totalAuthorizedHours: hours
                  }
                });
              }}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Shifts */}
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        Weekly Schedule
        <HelpTooltip text="Add regular care shifts to the client's weekly schedule." />
      </h3>
      <div className="border border-gray-200 rounded-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <Label htmlFor="shiftType" className="block text-sm font-medium text-gray-700 mb-1">
              Shift Type
            </Label>
            <Select 
              value={newShift.type} 
              onValueChange={(value) => setNewShift(prev => ({ ...prev, type: value as ShiftType }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ShiftType.MORNING}>Morning</SelectItem>
                <SelectItem value={ShiftType.AFTERNOON}>Afternoon</SelectItem>
                <SelectItem value={ShiftType.EVENING}>Evening</SelectItem>
                <SelectItem value={ShiftType.OVERNIGHT}>Overnight</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="shiftDay" className="block text-sm font-medium text-gray-700 mb-1">
              Day of Week
            </Label>
            <Select 
              value={newShift.dayOfWeek} 
              onValueChange={(value) => setNewShift(prev => ({ ...prev, dayOfWeek: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Monday">Monday</SelectItem>
                <SelectItem value="Tuesday">Tuesday</SelectItem>
                <SelectItem value="Wednesday">Wednesday</SelectItem>
                <SelectItem value="Thursday">Thursday</SelectItem>
                <SelectItem value="Friday">Friday</SelectItem>
                <SelectItem value="Saturday">Saturday</SelectItem>
                <SelectItem value="Sunday">Sunday</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </Label>
            <Input
              id="startTime"
              type="time"
              value={newShift.startTime}
              onChange={(e) => setNewShift(prev => ({ ...prev, startTime: e.target.value }))}
              className="w-full"
            />
          </div>
          
          <div>
            <Label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </Label>
            <Input
              id="endTime"
              type="time"
              value={newShift.endTime}
              onChange={(e) => setNewShift(prev => ({ ...prev, endTime: e.target.value }))}
              className="w-full"
            />
          </div>
        </div>
        
        <Button type="button" onClick={addShift} className="w-full">
          <Plus className="h-4 w-4 mr-2" /> Add Shift
        </Button>
      </div>
      
      {/* Scheduled Shifts List */}
      {formData.shifts && formData.shifts.length > 0 ? (
        <div className="mb-6">
          <h4 className="text-md font-medium mb-3">Scheduled Shifts</h4>
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
      ) : (
        <div className="text-center py-4 bg-gray-50 rounded-md mb-6">
          <p className="text-gray-500">No shifts scheduled yet. Add shifts using the form above.</p>
        </div>
      )}
    </div>
  );
}
