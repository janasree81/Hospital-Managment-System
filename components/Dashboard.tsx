

import React, { useState, useMemo } from 'react';
import { Role, User, Alert } from '../types';
import Sidebar from './Sidebar';
import Header from './Header';
import DashboardCard from './DashboardCard';
import AppointmentScheduler from './AppointmentScheduler';
import DigitalVitalLogging from './PatientVitals';
import PatientVitalsView from './PatientVitalsView';
import Chatbot from './Chatbot';
import HRManagement from './HRManagement';
import OperationTheatreScheduler from './OperationTheatreScheduler';
import UserManagement from './UserManagement';
import Pharmacy from './Pharmacy';
import LabManagement from './LabManagement';
import EmergencyRoom from './EmergencyRoom';
import MedicoLegalCaseManager from './MedicoLegalCaseManager';
import AMADischarge from './AMADischarge';
import BroughtDeadRecords from './BroughtDeadRecords';
import AmbulanceDispatch from './AmbulanceDispatch';
import SecurityHub from './SecurityHub';
import PatientRecords from './PatientRecords';
import PatientComplaints from './PatientComplaints';
import ComplaintAndQuery from './ComplaintAndQuery';
import ConsultationPlatform from './ConsultationPlatform';
import DietNutrition from './DietNutrition';
import FBOrderManagement from './FBOrderManagement';
import OccupationalTherapyModule from './OccupationalTherapyModule';
import ICUDigitalMonitoring from './ICUDigitalMonitoring';
import WardManagement from './WardManagement';
import NursingWorkflow from './NursingWorkflow';
import DoctorDeployment from './DoctorDeployment';
import BiomedicalEquipmentManager from './BiomedicalEquipment';
import MedicalGasManagement from './MedicalGasManagement';
import PatientPorterSystem from './PatientPorterSystem';
import PatientFeedbackSystem from './PatientFeedbackSystem';
import OutsourcedTestIntegration from './OutsourcedTestIntegration';
import DischargeSummaryManagement from './DischargeSummaryManagement';
import StatutoryComplianceManagement from './StatutoryComplianceManagement';
import AVDocumentationSystem from './AVDocumentationSystem';
import HousekeepingAndWasteManagement from './HousekeepingAndWasteManagement';
import ITManagement from './ITManagement';
import BedManagement from './BedManagement';
import BillingSummary from './BillingSummary';
// FIX: Added missing import for DASHBOARD_MODULES.
import { DASHBOARD_MODULES } from '../constants';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const PlaceholderComponent: React.FC<{ title: string }> = ({ title }) => (
    <div className="p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <p className="mt-4 text-gray-600">This is a placeholder for the {title} module. Full implementation would be here.</p>
    </div>
);

// FIX: Changed 'PatientVitals' to 'DigitalVitalLogging' to match the component name and added 'BillingSummary'.
const componentMap: { [key: string]: React.FC<any> } = {
    'AppointmentScheduler': AppointmentScheduler,
    'DigitalVitalLogging': DigitalVitalLogging,
    'PatientVitalsView': PatientVitalsView,
    'Chatbot': Chatbot,
    'ComplaintAndQuery': ComplaintAndQuery,
    'HRManagement': HRManagement,
    'OperationTheatreScheduler': OperationTheatreScheduler,
    'UserManagement': UserManagement,
    'Pharmacy': Pharmacy,
    'LabManagement': LabManagement,
    'EmergencyRoom': EmergencyRoom,
    'MedicoLegalCaseManager': MedicoLegalCaseManager,
    'AMADischarge': AMADischarge,
    'BroughtDeadRecords': BroughtDeadRecords,
    'AmbulanceDispatch': AmbulanceDispatch,
    'SecurityHub': SecurityHub,
    'PatientRecords': PatientRecords,
    'PatientComplaints': PatientComplaints,
    'PatientFeedbackSystem': PatientFeedbackSystem,
    'ConsultationPlatform': ConsultationPlatform,
    'DietNutrition': DietNutrition,
    'FBOrderManagement': FBOrderManagement,
    'OccupationalTherapyModule': OccupationalTherapyModule,
    'ICUDigitalMonitoring': ICUDigitalMonitoring,
    'WardManagement': WardManagement,
    'NursingWorkflow': NursingWorkflow,
    'DoctorDeployment': DoctorDeployment,
    'BiomedicalEquipment': BiomedicalEquipmentManager,
    'MedicalGasManagement': MedicalGasManagement,
    'PatientPorterSystem': PatientPorterSystem,
    'OutsourcedTestIntegration': OutsourcedTestIntegration,
    'DischargeSummaryManagement': DischargeSummaryManagement,
    'StatutoryComplianceManagement': StatutoryComplianceManagement,
    'AVDocumentationSystem': AVDocumentationSystem,
    'HousekeepingAndWasteManagement': HousekeepingAndWasteManagement,
    'ITManagement': ITManagement,
    'BedManagement': BedManagement,
    'BillingSummary': BillingSummary,
};

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeView, setActiveView] = useState<string>('home');
  const [activeTitle, setActiveTitle] = useState<string>('Dashboard');
  const [simulatedRole, setSimulatedRole] = useState<Role>(user.role);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // This creates a derived user object for simulation purposes.
  // The actual logged-in user doesn't change.
  const simulatedUser = useMemo(() => ({
    ...user,
    role: simulatedRole,
  }), [user, simulatedRole]);

  const availableModules = useMemo(() => 
    DASHBOARD_MODULES.filter(module => module.roles.includes(simulatedUser.role)),
    [simulatedUser.role]
  );
  
  const handleViewChange = (component: string, title: string) => {
      setActiveView(component);
      setActiveTitle(title);
  };

  const handleNewAlert = (newAlert: Omit<Alert, 'id' | 'read'>) => {
    const alertToAdd: Alert = {
        id: `alert-${Date.now()}`,
        read: false,
        ...newAlert
    };
    setAlerts(prev => [alertToAdd, ...prev]);
  };

  const handleMarkAlertAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, read: true } : a));
  };


  const renderActiveView = () => {
    if (activeView === 'home') {
      return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {availableModules.map((module) => (
            <DashboardCard
              key={module.title}
              title={module.title}
              description={module.description}
              icon={module.icon}
              onClick={() => handleViewChange(module.component, module.title)}
            />
          ))}
        </div>
      );
    }
    
    const Component = componentMap[activeView] || ( (props: any) => <PlaceholderComponent {...props} title={activeTitle} />);
    
    // Pass special props to specific components
    const componentProps: { [key: string]: any } = {
        user: simulatedUser,
    };
    if (activeView === 'DigitalVitalLogging') {
        componentProps.onNewAlert = handleNewAlert;
    }

    return <Component {...componentProps} />;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={simulatedUser} onLogout={onLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
            user={simulatedUser} 
            onRoleChange={setSimulatedRole}
            pageTitle={activeTitle}
            onNavigateHome={() => handleViewChange('home', 'Dashboard')}
            alerts={alerts}
            onMarkAlertAsRead={handleMarkAlertAsRead}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <div className="container mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
