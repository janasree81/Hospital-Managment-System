import React, { useState, useMemo } from 'react';
import { User, Role, DoctorShift, LeaveRequest, DoctorPreferences, Staff, ShiftType } from '../types';
import { MOCK_STAFF, MOCK_LEAVE_REQUESTS, MOCK_DOCTOR_PREFERENCES, MOCK_DOCTOR_SHIFTS } from '../constants';
import { generateAIRoster } from '../services/geminiService';

const DoctorDeployment: React.FC<{ user: User }> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'roster' | 'preferences' | 'leave' | 'analytics'>('roster');

    const [shifts, setShifts] = useState<DoctorShift[]>(MOCK_DOCTOR_SHIFTS);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(MOCK_LEAVE_REQUESTS);
    const [preferences, setPreferences] = useState<DoctorPreferences[]>(MOCK_DOCTOR_PREFERENCES);
    const [isLoading, setIsLoading] = useState(false);
    const [alerts, setAlerts] = useState<string[]>([]);
    
    const doctors = useMemo(() => MOCK_STAFF.filter(s => s.role === Role.Doctor), []);

    const handleGenerateRoster = async () => {
        setIsLoading(true);
        setAlerts([]);
        setShifts([]);
        try {
            const requirements = ["Cardiology department requires 24/7 coverage (at least one doctor on shift).", "Orthopedics requires at least one doctor during Morning and Evening shifts."];
            const rosterStartDate = new Date().toISOString().split('T')[0];
            const generatedShifts = await generateAIRoster(doctors, preferences, leaveRequests, requirements, rosterStartDate);
            
            const newShiftsWithIds = generatedShifts.map((shift, index) => ({...shift, id: `shift-${Date.now()}-${index}`}));
            setShifts(newShiftsWithIds);
            
            // Post-generation checks for alerts
            const days = [...new Set(newShiftsWithIds.map(s => s.date))];
            const shiftTypes = Object.values(ShiftType);
            const requiredDepartments = ["Cardiology"]; 
            const newAlerts: string[] = [];
            
            days.forEach(day => {
                shiftTypes.forEach(shift => {
                    requiredDepartments.forEach(dept => {
                        const isCovered = newShiftsWithIds.some(s => s.date === day && s.shift === shift && s.department === dept);
                        if (!isCovered) {
                            newAlerts.push(`Coverage gap: ${dept} on ${day} (${shift}) is not covered.`);
                        }
                    });
                });
            });
            setAlerts(newAlerts);

        } catch (error) {
            console.error(error);
            alert('Failed to generate AI roster. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const TabButton: React.FC<{ tabId: typeof activeTab, children: React.ReactNode }> = ({ tabId, children }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md ${activeTab === tabId ? 'bg-gray-100 border-b-2 border-indigo-600' : 'text-gray-500'}`}
        >
            {children}
        </button>
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">Doctor Deployment System</h2>
                <div className="flex space-x-2 border-b">
                    <TabButton tabId="roster">Roster View</TabButton>
                    <TabButton tabId="preferences">Preferences</TabButton>
                    <TabButton tabId="leave">Leave Requests</TabButton>
                    <TabButton tabId="analytics">Analytics</TabButton>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto bg-gray-50 -m-6 p-6">
                {activeTab === 'roster' && <RosterView shifts={shifts} alerts={alerts} onGenerate={handleGenerateRoster} isLoading={isLoading} />}
                {activeTab === 'preferences' && <PreferencesView preferences={preferences} setPreferences={setPreferences} doctors={doctors} />}
                {activeTab === 'leave' && <LeaveRequestsView leaveRequests={leaveRequests} setLeaveRequests={setLeaveRequests} />}
                {activeTab === 'analytics' && <AnalyticsView shifts={shifts} doctors={doctors} />}
            </div>
        </div>
    );
};

const RosterView: React.FC<{ shifts: DoctorShift[], alerts: string[], onGenerate: () => void, isLoading: boolean }> = ({ shifts, alerts, onGenerate, isLoading }) => {
    const today = new Date();
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        return date;
    });
    
    const shiftTypes = Object.values(ShiftType);

    const rosterGrid = useMemo(() => {
        const grid: Record<string, Record<string, DoctorShift[]>> = {};
        weekDays.forEach(day => {
            const dateStr = day.toISOString().split('T')[0];
            grid[dateStr] = {};
            shiftTypes.forEach(shift => {
                grid[dateStr][shift] = shifts.filter(s => s.date === dateStr && s.shift === shift);
            });
        });
        return grid;
    }, [shifts, weekDays]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">7-Day Roster</h3>
                <button onClick={onGenerate} disabled={isLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-indigo-300">
                    {isLoading ? 'Generating...' : 'Generate Roster with AI'}
                </button>
            </div>
            {isLoading && <div className="text-center p-8">Generating optimal roster...</div>}
            {alerts.length > 0 && (
                <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
                    <p className="font-bold">Coverage Alerts</p>
                    <ul className="list-disc list-inside text-sm">{alerts.map((a, i) => <li key={i}>{a}</li>)}</ul>
                </div>
            )}
            <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-gray-200 border text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-2 py-2 text-left font-semibold text-gray-700">Shift</th>
                            {weekDays.map(day => <th key={day.toISOString()} className="px-2 py-2 text-left font-semibold text-gray-700">{day.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' })}</th>)}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {shiftTypes.map(shift => (
                            <tr key={shift}>
                                <td className="px-2 py-2 font-medium">{shift}</td>
                                {weekDays.map(day => (
                                    <td key={day.toISOString()} className="px-2 py-2 align-top h-24">
                                        <div className="space-y-1">
                                            {rosterGrid[day.toISOString().split('T')[0]][shift].map(s => (
                                                <div key={s.id} className="text-xs bg-blue-100 text-blue-800 rounded px-2 py-1">
                                                    <p className="font-semibold">{s.doctorName}</p>
                                                    <p>{s.department}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const PreferencesView: React.FC<{ preferences: DoctorPreferences[], setPreferences: React.Dispatch<React.SetStateAction<DoctorPreferences[]>>, doctors: Staff[] }> = ({ preferences, setPreferences, doctors }) => (
    <div className="space-y-4">
        <h3 className="text-xl font-bold">Doctor Preferences</h3>
        <p className="text-sm text-gray-600">These preferences will be considered by the AI when generating rosters.</p>
        <div className="space-y-3">
            {preferences.map(pref => (
                <div key={pref.doctorId} className="p-4 border rounded-lg bg-white">
                    <h4 className="font-bold">{pref.doctorName}</h4>
                    <p><strong>Preferred:</strong> {pref.preferredShifts.join(', ') || 'None'}</p>
                    <p><strong>Disliked:</strong> {pref.dislikedShifts.join(', ') || 'None'}</p>
                    <p><strong>Max Consecutive Shifts:</strong> {pref.maxConsecutiveShifts}</p>
                </div>
            ))}
        </div>
    </div>
);

const LeaveRequestsView: React.FC<{ leaveRequests: LeaveRequest[], setLeaveRequests: React.Dispatch<React.SetStateAction<LeaveRequest[]>> }> = ({ leaveRequests, setLeaveRequests }) => {
    const handleStatusChange = (id: string, status: LeaveRequest['status']) => {
        setLeaveRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
    };
    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold">Leave Requests</h3>
            {leaveRequests.map(req => (
                <div key={req.id} className="p-4 border rounded-lg bg-white flex justify-between items-center">
                    <div>
                        <p className="font-bold">{req.doctorName}</p>
                        <p className="text-sm">{req.startDate} to {req.endDate}</p>
                        <p className="text-sm text-gray-600">Reason: {req.reason}</p>
                    </div>
                    <div>
                        {req.status === 'Pending' ? (
                            <div className="flex gap-2">
                                <button onClick={() => handleStatusChange(req.id, 'Approved')} className="px-3 py-1 text-sm bg-green-500 text-white rounded">Approve</button>
                                <button onClick={() => handleStatusChange(req.id, 'Denied')} className="px-3 py-1 text-sm bg-red-500 text-white rounded">Deny</button>
                            </div>
                        ) : (
                            <span className={`font-bold text-sm ${req.status === 'Approved' ? 'text-green-600' : 'text-red-600'}`}>{req.status}</span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

const AnalyticsView: React.FC<{ shifts: DoctorShift[], doctors: Staff[] }> = ({ shifts, doctors }) => {
    const analytics = useMemo(() => {
        return doctors.map(doc => {
            const docShifts = shifts.filter(s => s.doctorId === doc.id);
            const nightShifts = docShifts.filter(s => s.shift === ShiftType.Night).length;
            const totalShifts = docShifts.length;
            const isFatigued = nightShifts > 2 || totalShifts > 5; // Simple fatigue logic
            return { ...doc, totalShifts, nightShifts, isFatigued };
        });
    }, [shifts, doctors]);

    return (
         <div className="space-y-4">
            <h3 className="text-xl font-bold">Workload & Fatigue Analytics</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Doctor</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Total Shifts</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Night Shifts</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Fatigue Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {analytics.map(doc => (
                            <tr key={doc.id}>
                                <td className="px-4 py-2 font-medium">{doc.name}</td>
                                <td className="px-4 py-2">{doc.totalShifts}</td>
                                <td className="px-4 py-2">{doc.nightShifts}</td>
                                <td className="px-4 py-2">
                                    <span className={`px-2 py-1 text-xs rounded-full ${doc.isFatigued ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                        {doc.isFatigued ? 'High Risk' : 'Normal'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DoctorDeployment;
