import React from 'react';
import { ShiftType } from '../utils/models';

interface ShiftInfo {
  startTime: string;
  endTime: string;
  type: ShiftType;
  caregiverId?: string;
}

interface Props {
  shifts: Array<{
    type: ShiftType;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    caregiverId?: string;
  }>;
  height?: string;
}

export function WeeklySchedule({ shifts, height = 'auto' }: Props) {
  // Get the days of the week
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
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

  // Initialize schedule grid
  const scheduleGrid: Record<string, Record<string, ShiftInfo[]>> = {};
  
  // Initialize days
  daysOfWeek.forEach(day => {
    scheduleGrid[day] = {};
  });
  
  // Add shifts to grid
  shifts.forEach(shift => {
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
    <div className="overflow-x-auto" style={{ height }}>
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
}
