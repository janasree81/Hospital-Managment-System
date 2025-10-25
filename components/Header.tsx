import React, { useState } from 'react';
import { Role, User, Alert } from '../types';

interface HeaderProps {
  user: User;
  onRoleChange: (newRole: Role) => void;
  pageTitle: string;
  onNavigateHome: () => void;
  alerts: Alert[];
  onMarkAlertAsRead: (alertId: string) => void;
}

const Header: React.FC<HeaderProps> = ({ user, onRoleChange, pageTitle, onNavigateHome, alerts, onMarkAlertAsRead }) => {
  const [showAlerts, setShowAlerts] = useState(false);
  const unreadAlertsCount = alerts.filter(a => !a.read).length;

  return (
    <header className="flex items-center justify-between h-20 px-6 bg-white border-b">
        <div>
            <div className="text-sm text-gray-500">
                <span className="cursor-pointer hover:text-indigo-600" onClick={onNavigateHome}>Dashboard</span>
                {pageTitle !== 'Dashboard' && (
                    <>
                        <span className="mx-2">/</span>
                        <span className="text-gray-800 font-medium">{pageTitle}</span>
                    </>
                )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
        </div>
      <div className="flex items-center space-x-4">
        {[Role.Admin, Role.Doctor, Role.Nurse].includes(user.role) && (
            <div className="relative">
                <button onClick={() => setShowAlerts(!showAlerts)} className="relative p-2 rounded-full hover:bg-gray-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadAlertsCount > 0 && (
                        <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center ring-2 ring-white">
                            {unreadAlertsCount}
                        </span>
                    )}
                </button>
                {showAlerts && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border z-20">
                        <div className="p-3 font-semibold border-b">Notifications</div>
                        <div className="max-h-80 overflow-y-auto">
                            {alerts.length === 0 ? (
                                <p className="text-sm text-gray-500 p-4">No new alerts.</p>
                            ) : (
                                alerts.map(alert => (
                                    <div key={alert.id} className={`p-3 border-b ${!alert.read ? 'bg-indigo-50' : ''}`}>
                                        <p className="text-sm font-semibold">{alert.message}</p>
                                        <p className="text-xs text-gray-600">Patient: {alert.patientName} ({alert.patientId})</p>
                                        <div className="flex justify-between items-center mt-1">
                                            <p className="text-xs text-gray-400">{new Date(alert.timestamp).toLocaleString()}</p>
                                            {!alert.read && <button onClick={() => onMarkAlertAsRead(alert.id)} className="text-xs text-blue-500 hover:underline">Mark as read</button>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        )}
        <div className="flex items-center">
            <label htmlFor="role-switcher" className="mr-2 text-sm font-medium text-gray-700">View as:</label>
            <select
            id="role-switcher"
            value={user.role}
            onChange={(e) => onRoleChange(e.target.value as Role)}
            className="block w-full py-2 pl-3 pr-10 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
            {Object.values(Role).map((role) => (
                <option key={role} value={role}>{role}</option>
            ))}
            </select>
        </div>
        <div className="relative">
            <img className="w-10 h-10 rounded-full" src={user.avatarUrl} alt={user.name} />
        </div>
      </div>
    </header>
  );
};

export default Header;
