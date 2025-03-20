import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Caregiver, CaregiverStatus, Client, ClientStatus, ShiftType } from '../utils/models';
import { useCaregivers, useClients } from '../utils/dataHooks';
import { Button } from "@/components/ui/button";
import { PlusCircle, RefreshCcw, Edit, Trash2 } from "lucide-react";
import { useStore } from '../utils/store';

export const CaregiverTable: React.FC = () => {
  const navigate = useNavigate();
  const { getCaregiverById } = useStore(); // Access main store for navigation
  const {
    newApplicants,
    availableCaregivers,
    assignedCaregivers,
    loading,
    error,
    fetchAllCaregivers,
    markAsAvailable,
    markAsInactive,
    approveApplicant,
    completeBackgroundCheck,
    completeTraining,
    deleteCaregiver,
    updateCaregiver
  } = useCaregivers();

  // State for background check and training modals
  const [showBackgroundModal, setShowBackgroundModal] = useState<boolean>(false);
  const [showTrainingModal, setShowTrainingModal] = useState<boolean>(false);
  const [selectedCaregiverId, setSelectedCaregiverId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'applicants' | 'processing' | 'available' | 'staffed'>('applicants');
  
  // Handle navigation to caregiver profile with validation
  const handleCaregiverClick = useCallback((e: React.MouseEvent, caregiverId: string) => {
    e.stopPropagation(); // Prevent button click events from triggering this
    
    // Validate caregiverId exists before navigating
    const caregiver = getCaregiverById(caregiverId);
    if (caregiver) {
      console.log('Navigating to caregiver profile:', caregiverId);
      navigate(`/caregiver-profile?id=${caregiverId}`);
    } else {
      console.warn('Caregiver not found in store, cannot navigate:', caregiverId);
      // Could show a toast here with an error message
    }
  }, [navigate, getCaregiverById]);
  
  // Handle background check completion
  const handleBackgroundCheck = (caregiverId: string, passed: boolean) => {
    completeBackgroundCheck(caregiverId, passed);
    setShowBackgroundModal(false);
  };
  
  // Handle training completion
  const handleTraining = (caregiverId: string, completed: boolean) => {
    completeTraining(caregiverId, completed);
    setShowTrainingModal(false);
  };

  // Load data on component mount
  useEffect(() => {
    fetchAllCaregivers();
    
    // Log caregiver data to debug
    console.log('Loaded caregivers:', {
      newApplicants: newApplicants.length,
      availableCaregivers: availableCaregivers.length, 
      assignedCaregivers: assignedCaregivers.length
    });
  }, [fetchAllCaregivers, newApplicants, availableCaregivers, assignedCaregivers]);

  if (loading) return <div className="p-4">Loading caregivers...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  
  // Filter caregivers by status for the 'processing' tab
  const processingCaregivers = [...newApplicants, ...availableCaregivers].filter(
    caregiver => caregiver.status === CaregiverStatus.BACKGROUND_CHECK || caregiver.status === CaregiverStatus.TRAINING
  );

  // Helper function to render status badges with appropriate colors
  const renderStatusBadge = (status: CaregiverStatus) => {
    let bgColor = "bg-gray-100";
    let textColor = "text-gray-800";
    
    switch (status) {
      case CaregiverStatus.NEW_APPLICANT:
        bgColor = "bg-yellow-100";
        textColor = "text-yellow-800";
        break;
      case CaregiverStatus.BACKGROUND_CHECK:
        bgColor = "bg-blue-100";
        textColor = "text-blue-800";
        break;
      case CaregiverStatus.TRAINING:
        bgColor = "bg-purple-100";
        textColor = "text-purple-800";
        break;
      case CaregiverStatus.AVAILABLE:
        bgColor = "bg-green-100";
        textColor = "text-green-800";
        break;
      case CaregiverStatus.ASSIGNED:
        bgColor = "bg-indigo-100";
        textColor = "text-indigo-800";
        break;
      case CaregiverStatus.INACTIVE:
        bgColor = "bg-red-100";
        textColor = "text-red-800";
        break;
    }
    
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };
  
  // Helper to render action buttons based on caregiver's status
  const renderActionButtons = (caregiver: Caregiver) => {
    switch (caregiver.status) {
      case CaregiverStatus.NEW_APPLICANT:
        return (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Stop event propagation
                approveApplicant(caregiver.id);
              }}
              className="text-blue-600 hover:text-blue-900 mr-2"
              title="Move to background check"
            >
              Approve Application
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Stop event propagation
                markAsInactive(caregiver.id);
              }}
              className="text-yellow-600 hover:text-yellow-900 mr-2"
              title="Mark as inactive"
            >
              Reject
            </button>
          </>
        );
        
      case CaregiverStatus.BACKGROUND_CHECK:
        return (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Stop event propagation
                setSelectedCaregiverId(caregiver.id);
                setShowBackgroundModal(true);
              }}
              className="text-blue-600 hover:text-blue-900 mr-2"
              title="Complete background check"
            >
              Complete Background Check
            </button>
          </>
        );
        
      case CaregiverStatus.TRAINING:
        return (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Stop event propagation
                setSelectedCaregiverId(caregiver.id);
                setShowTrainingModal(true);
              }}
              className="text-purple-600 hover:text-purple-900 mr-2"
              title="Complete training"
            >
              Complete Training
            </button>
          </>
        );
        
      case CaregiverStatus.AVAILABLE:
        return (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Stop event propagation
                markAsInactive(caregiver.id);
              }}
              className="text-yellow-600 hover:text-yellow-900 mr-2"
              title="Mark as inactive"
            >
              Mark Inactive
            </button>
          </>
        );
        
      default:
        return null;
    }
  };

  // Render the caregiver table with tabs
  return (
    <div className="overflow-x-auto">
      {/* Tab navigation */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('applicants')}
            className={`${activeTab === 'applicants' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} 
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            New Applicants ({newApplicants.length})
          </button>
          <button
            onClick={() => setActiveTab('processing')}
            className={`${activeTab === 'processing' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} 
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Processing ({processingCaregivers.length})
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`${activeTab === 'available' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} 
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Available ({availableCaregivers.length})
          </button>
          <button
            onClick={() => setActiveTab('staffed')}
            className={`${activeTab === 'staffed' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} 
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Staffed ({assignedCaregivers.length})
          </button>
        </nav>
      </div>
      
      {/* Lifecycle Progress */}
      <div className="mb-6">
        <div className="relative">
          <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
            <div style={{ width: activeTab === 'applicants' ? '20%' : activeTab === 'processing' ? '50%' : activeTab === 'available' ? '80%' : '100%' }} 
                 className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>Application</span>
            <span>Background Check</span>
            <span>Training</span>
            <span>Available</span>
            <span>Staffed</span>
          </div>
        </div>
      </div>
      
      {/* New Applicants Tab */}
      {activeTab === 'applicants' && (
        <div>
          <div className="bg-white px-4 py-3 border-b border-gray-200 rounded-t-lg">
            <h3 className="text-lg font-medium text-gray-900">New Applicants</h3>
            <p className="text-sm text-gray-500">Review and approve new caregiver applications</p>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {newApplicants.map((caregiver) => (
                <tr 
                  key={caregiver.id} 
                  onClick={(e) => handleCaregiverClick(e, caregiver.id)} 
                  className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {caregiver.firstName} {caregiver.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{caregiver.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderStatusBadge(caregiver.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {caregiver.yearsExperience} years
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(caregiver.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                    {renderActionButtons(caregiver)}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCaregiver(caregiver.id);
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="Delete caregiver"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {newApplicants.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No new applicants
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Processing Tab (Background Check & Training) */}
      {activeTab === 'processing' && (
        <div>
          <div className="bg-white px-4 py-3 border-b border-gray-200 rounded-t-lg">
            <h3 className="text-lg font-medium text-gray-900">Processing</h3>
            <p className="text-sm text-gray-500">Caregivers in background check or training stages</p>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Background Check</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Training</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processingCaregivers.map((caregiver) => (
                <tr 
                  key={caregiver.id} 
                  onClick={(e) => handleCaregiverClick(e, caregiver.id)} 
                  className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {caregiver.firstName} {caregiver.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{caregiver.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderStatusBadge(caregiver.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {caregiver.backgroundCheckPassed ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Passed
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {caregiver.trainingCompleted ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Completed
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {renderActionButtons(caregiver)}
                    <button
                      onClick={() => markAsInactive(caregiver.id)}
                      className="text-yellow-600 hover:text-yellow-900 mr-2"
                      title="Mark as inactive"
                    >
                      Reject
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCaregiver(caregiver.id);
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="Delete caregiver"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {processingCaregivers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No caregivers in processing
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Available Caregivers Tab */}
      {activeTab === 'available' && (
        <div>
          <div className="bg-white px-4 py-3 border-b border-gray-200 rounded-t-lg">
            <h3 className="text-lg font-medium text-gray-900">Available Caregivers</h3>
            <p className="text-sm text-gray-500">Caregivers ready for assignment</p>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preferred Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {availableCaregivers.map((caregiver) => (
                <tr 
                  key={caregiver.id} 
                  onClick={(e) => handleCaregiverClick(e, caregiver.id)} 
                  className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {caregiver.firstName} {caregiver.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{caregiver.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderStatusBadge(caregiver.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {caregiver.yearsExperience} years
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {caregiver.preferredHoursPerWeek} hours/week
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {renderActionButtons(caregiver)}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCaregiver(caregiver.id);
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="Delete caregiver"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {availableCaregivers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No available caregivers
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Background Check Modal */}
      {showBackgroundModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Complete Background Check</h3>
            <p className="mb-4 text-gray-600">Mark the background check as passed or failed.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowBackgroundModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBackgroundCheck(selectedCaregiverId, false)}
                className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Failed
              </button>
              <button
                onClick={() => handleBackgroundCheck(selectedCaregiverId, true)}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
              >
                Passed
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Training Modal */}
      {showTrainingModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Complete Training</h3>
            <p className="mb-4 text-gray-600">Mark the training as completed or not completed.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowTrainingModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleTraining(selectedCaregiverId, false)}
                className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Not Completed
              </button>
              <button
                onClick={() => handleTraining(selectedCaregiverId, true)}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
              >
                Completed
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Inactive Clients Tab */}
      {activeTab === 'inactive' && (
        <div>
          <div className="bg-white px-4 py-3 border-b border-gray-200 rounded-t-lg">
            <h3 className="text-lg font-medium text-gray-900">Inactive Clients</h3>
            <p className="text-sm text-gray-500">Deactivated or dormant clients</p>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Care Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auth. Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deactivation Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inactiveClients?.map((client) => (
                <tr key={client.id} onClick={(e) => { e.stopPropagation(); navigate(`/client-profile?id=${client.id}`); }} className="cursor-pointer hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {client.firstName} {client.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(client.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{client.email}</div>
                    <div className="text-sm text-gray-500">{client.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderStatusBadge(client.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.careLevel}/5
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">
                    {client.address ? `${client.address}, ${client.city}, ${client.state} ${client.zip}` : 'No address'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.authorization?.calculatedWeeklyHours || client.authorization?.totalAuthorizedHours || 'N/A'} hrs/wk
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.updatedAt ? new Date(client.updatedAt).toLocaleDateString() : 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsStable(client.id);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                      title="Reactivate as stable"
                    >
                      Reactivate
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteClient(client.id);
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="Delete client"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {(!inactiveClients || inactiveClients.length === 0) && (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    No inactive clients
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Staffed Caregivers Tab */}
      {activeTab === 'staffed' && (
        <div>
          <div className="bg-white px-4 py-3 border-b border-gray-200 rounded-t-lg">
            <h3 className="text-lg font-medium text-gray-900">Staffed Caregivers</h3>
            <p className="text-sm text-gray-500">Caregivers currently assigned to clients</p>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Clients</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignedCaregivers.map((caregiver) => (
                <tr 
                  key={caregiver.id} 
                  onClick={(e) => navigate(`/caregiver-profile?id=${caregiver.id}`)} 
                  className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {caregiver.firstName} {caregiver.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{caregiver.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderStatusBadge(caregiver.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {caregiver.yearsExperience} years
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {caregiver.currentHoursAssigned} / {caregiver.preferredHoursPerWeek} hours
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {caregiver.assignedClients.length} / {caregiver.maxClientsPerWeek} clients
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsAvailable(caregiver.id);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                      title="Mark as available"
                    >
                      Mark Available
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsInactive(caregiver.id);
                      }}
                      className="text-yellow-600 hover:text-yellow-900 mr-2"
                      title="Mark as inactive"
                    >
                      Mark Inactive
                    </button>
                    <button
                      onClick={() => deleteCaregiver(caregiver.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete caregiver"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {assignedCaregivers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No staffed caregivers
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export const ClientTable: React.FC = () => {
  const navigate = useNavigate();
  const {
    unstableClients,
    newReferrals,
    stableClients,
    inactiveClients,
    loading,
    error,
    fetchAllClients,
    markAsStable,
    markAsUnstable,
    markAsInactive,
    deleteClient
  } = useClients();

  // State for active tab
  const [activeTab, setActiveTab] = useState<'referrals' | 'unstable' | 'stable' | 'inactive'>('referrals');

  // Load data on component mount
  React.useEffect(() => {
    fetchAllClients();
  }, [fetchAllClients]);

  if (loading) return <div className="p-4">Loading clients...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  // Helper function to render status badges with appropriate colors
  const renderStatusBadge = (status: ClientStatus) => {
    let bgColor = "bg-gray-100";
    let textColor = "text-gray-800";
    
    switch (status) {
      case ClientStatus.NEW_REFERRAL:
        bgColor = "bg-purple-100";
        textColor = "text-purple-800";
        break;
      case ClientStatus.UNSTABLE:
        bgColor = "bg-red-100";
        textColor = "text-red-800";
        break;
      case ClientStatus.STABLE:
        bgColor = "bg-green-100";
        textColor = "text-green-800";
        break;
      case ClientStatus.INACTIVE:
        bgColor = "bg-gray-100";
        textColor = "text-gray-800";
        break;
    }
    
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  // Helper to render action buttons based on client's status
  const renderActionButtons = (client: Client) => {
    switch (client.status) {
      case ClientStatus.NEW_REFERRAL:
        return (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                markAsStable(client.id);
              }}
              className="text-blue-600 hover:text-blue-900 mr-2"
              title="Move to stable clients"
            >
              Mark Stable
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                markAsUnstable(client.id);
              }}
              className="text-yellow-600 hover:text-yellow-900 mr-2"
              title="Move to unstable clients"
            >
              Mark Unstable
            </button>
          <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Navigate to client form with ID
                  window.location.href = `/client-form?id=${client.id}`;
                }}
                className="text-blue-600 hover:text-blue-900"
                title="Edit client"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteClient(client.id);
                }}
                className="text-red-600 hover:text-red-900"
                title="Delete client"
              >
                <Trash2 className="h-4 w-4" />
              </button>
          </>
        );
      
      case ClientStatus.UNSTABLE:
        return (
          <>
            <button
              onClick={() => markAsStable(client.id)}
              className="text-blue-600 hover:text-blue-900 mr-2"
              title="Move to stable clients"
            >
              Mark Stable
            </button>
            <button
              onClick={() => markAsInactive(client.id)}
              className="text-yellow-600 hover:text-yellow-900 mr-2"
              title="Mark as inactive"
            >
              Mark Inactive
            </button>
            <button
              onClick={() => deleteClient(client.id)}
              className="text-red-600 hover:text-red-900"
              title="Delete client"
            >
              Delete
            </button>
          </>
        );
      
      case ClientStatus.STABLE:
        return (
          <>
            <button
              onClick={() => markAsUnstable(client.id)}
              className="text-yellow-600 hover:text-yellow-900 mr-2"
              title="Move to unstable clients"
            >
              Mark Unstable
            </button>
            <button
              onClick={() => markAsInactive(client.id)}
              className="text-red-600 hover:text-red-900 mr-2"
              title="Mark as inactive"
            >
              Mark Inactive
            </button>
            <button
              onClick={() => deleteClient(client.id)}
              className="text-red-600 hover:text-red-900"
              title="Delete client"
            >
              Delete
            </button>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="overflow-x-auto">
      {/* Tab navigation */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('referrals')}
            className={`${activeTab === 'referrals' 
              ? 'border-purple-500 text-purple-600' 
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} 
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            New Referrals ({newReferrals.length})
          </button>
          <button
            onClick={() => setActiveTab('unstable')}
            className={`${activeTab === 'unstable' 
              ? 'border-red-500 text-red-600' 
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} 
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Unstable Clients ({unstableClients.length})
          </button>
          <button
            onClick={() => setActiveTab('stable')}
            className={`${activeTab === 'stable' 
              ? 'border-green-500 text-green-600' 
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} 
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Stable Clients ({stableClients?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('inactive')}
            className={`${activeTab === 'inactive' 
              ? 'border-gray-500 text-gray-600' 
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} 
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Inactive Clients ({inactiveClients?.length || 0})
          </button>
        </nav>
      </div>
      
      {/* Action Buttons Section */}
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline"
          size="sm"
          onClick={() => fetchAllClients()}
        >
          <RefreshCcw className="mr-2 h-4 w-4" /> Refresh Data
        </Button>
      </div>
      
      {/* Lifecycle Progress */}
      <div className="mb-6">
        <div className="relative">
          <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
            <div style={{ width: activeTab === 'referrals' ? '33%' : activeTab === 'unstable' ? '66%' : '100%' }} 
                 className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>Referral</span>
            <span>Assessment</span>
            <span>Stable Care</span>
          </div>
        </div>
      </div>
      
      {/* New Referrals Tab */}
      {activeTab === 'referrals' && (
        <div>
          <div className="bg-white px-4 py-3 border-b border-gray-200 rounded-t-lg">
            <h3 className="text-lg font-medium text-gray-900">New Client Referrals</h3>
            <p className="text-sm text-gray-500">Review and process new client referrals</p>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Care Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auth. Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medical Needs</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {newReferrals.map((client) => (
                <tr key={client.id} onClick={() => navigate(`/client-profile?id=${client.id}`)} className="cursor-pointer hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {client.firstName} {client.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(client.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{client.email}</div>
                    <div className="text-sm text-gray-500">{client.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderStatusBadge(client.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.careLevel}/5
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">
                    {client.address ? `${client.address}, ${client.city}, ${client.state} ${client.zip}` : 'No address'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.authorization?.calculatedWeeklyHours || client.authorization?.totalAuthorizedHours || 'N/A'} hrs/wk
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs">
                    {client.medicalConditions?.join(', ') || 'None specified'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {renderActionButtons(client)}
                  </td>
                </tr>
              ))}
              {newReferrals.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No new referrals
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Unstable Clients Tab */}
      {activeTab === 'unstable' && (
        <div>
          <div className="bg-white px-4 py-3 border-b border-gray-200 rounded-t-lg">
            <h3 className="text-lg font-medium text-gray-900">Unstable Clients</h3>
            <p className="text-sm text-gray-500">High-priority clients requiring urgent attention</p>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Care Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auth. Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Caregivers</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {unstableClients.map((client) => (
                <tr key={client.id} onClick={() => navigate(`/client-profile?id=${client.id}`)} className="cursor-pointer hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {client.firstName} {client.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(client.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{client.email}</div>
                    <div className="text-sm text-gray-500">{client.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderStatusBadge(client.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.careLevel}/5
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">
                    {client.address ? `${client.address}, ${client.city}, ${client.state} ${client.zip}` : 'No address'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.authorization?.calculatedWeeklyHours || client.authorization?.totalAuthorizedHours || 'N/A'} hrs/wk
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.assignedCaregivers?.length || 0} assigned
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {renderActionButtons(client)}
                  </td>
                </tr>
              ))}
              {unstableClients.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    No unstable clients
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Stable Clients Tab */}
      {activeTab === 'stable' && (
        <div>
          <div className="bg-white px-4 py-3 border-b border-gray-200 rounded-t-lg">
            <h3 className="text-lg font-medium text-gray-900">Stable Clients</h3>
            <p className="text-sm text-gray-500">Clients with established care plans</p>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Care Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auth. Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shifts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stableClients?.map((client) => (
                <tr key={client.id} onClick={() => navigate(`/client-profile?id=${client.id}`)} className="cursor-pointer hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {client.firstName} {client.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(client.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{client.email}</div>
                    <div className="text-sm text-gray-500">{client.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderStatusBadge(client.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.careLevel}/5
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">
                    {client.address ? `${client.address}, ${client.city}, ${client.state} ${client.zip}` : 'No address'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.authorization?.calculatedWeeklyHours || client.authorization?.totalAuthorizedHours || 'N/A'} hrs/wk
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.shifts?.length || 0} configured
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {renderActionButtons(client)}
                  </td>
                </tr>
              ))}
              {!stableClients || stableClients.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    No stable clients
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};