import React, { useState, useMemo } from 'react';
import { User, Cylinder, GasRequest, CylinderStatus, MedicalGasType, GasRequestStatus, ConsumptionLog } from '../types';
import { MOCK_CYLINDERS, MOCK_GAS_REQUESTS } from '../constants';
import { getGasStockForecast, getGasDispatchSchedule } from '../services/geminiService';

const MedicalGasManagement: React.FC<{ user: User }> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'dispatch'>('dashboard');
    const [cylinders, setCylinders] = useState<Cylinder[]>(MOCK_CYLINDERS);
    const [requests, setRequests] = useState<GasRequest[]>(MOCK_GAS_REQUESTS);

    const [forecast, setForecast] = useState<Record<string, string> | null>(null);
    const [alerts, setAlerts] = useState<string[]>([]);
    const [dispatchSchedule, setDispatchSchedule] = useState<{ requestId: string, cylinderId: string, destination: string }[]>([]);
    
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [modal, setModal] = useState<{ type: 'register' | 'logConsumption', data?: any } | null>(null);

    const handleGetForecast = async () => {
        setIsLoadingAI(true);
        setForecast(null);
        setAlerts([]);
        try {
            // In a real app, consumption logs would be passed here
            const { forecasts, alerts } = await getGasStockForecast(cylinders, []);
            setForecast(forecasts);
            setAlerts(alerts);
        } catch (error) {
            console.error(error);
            alert("Failed to get AI stock forecast.");
        } finally {
            setIsLoadingAI(false);
        }
    };

    const handleGenerateDispatch = async () => {
        const approvedRequests = requests.filter(r => r.status === GasRequestStatus.Approved);
        if (approvedRequests.length === 0) {
            alert("No approved requests to schedule.");
            return;
        }
        setIsLoadingAI(true);
        setDispatchSchedule([]);
        try {
            const fullCylinders = cylinders.filter(c => c.status === CylinderStatus.Full);
            const schedule = await getGasDispatchSchedule(approvedRequests, fullCylinders);
            setDispatchSchedule(schedule);
            
            // Simulate dispatching
            const dispatchedRequestIds = new Set(schedule.map(s => s.requestId));
            const dispatchedCylinderIds = new Set(schedule.map(s => s.cylinderId));

            setRequests(prev => prev.map(r => dispatchedRequestIds.has(r.id) ? { ...r, status: GasRequestStatus.Dispatched } : r));
            setCylinders(prev => prev.map(c => dispatchedCylinderIds.has(c.id) ? { ...c, status: CylinderStatus.InUse, location: 'In Transit' } : c));

        } catch (error) {
            console.error(error);
            alert("Failed to generate AI dispatch schedule.");
        } finally {
            setIsLoadingAI(false);
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

    const DashboardView = () => {
        const inventorySummary = useMemo(() => {
            const summary: Record<string, { full: number, inUse: number, empty: number }> = {};
            Object.values(MedicalGasType).forEach(gasType => {
                summary[gasType] = { full: 0, inUse: 0, empty: 0 };
            });
            cylinders.forEach(c => {
                if(c.status === CylinderStatus.Full) summary[c.gasType].full++;
                if(c.status === CylinderStatus.InUse) summary[c.gasType].inUse++;
                if(c.status === CylinderStatus.Empty) summary[c.gasType].empty++;
            });
            return summary;
        }, [cylinders]);
        
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(inventorySummary).map(([gasType, counts]) => (
                        <div key={gasType} className="p-4 bg-white rounded-lg border">
                            <h4 className="font-bold text-gray-800">{gasType}</h4>
                            <p className="text-sm"><strong>Full:</strong> {counts.full}</p>
                            <p className="text-sm"><strong>In Use:</strong> {counts.inUse}</p>
                            <p className="text-sm"><strong>Empty:</strong> {counts.empty}</p>
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-white rounded-lg border">
                    <h3 className="font-bold text-lg mb-2">AI Stock Forecast</h3>
                    <button onClick={handleGetForecast} disabled={isLoadingAI} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-indigo-300">
                        {isLoadingAI ? 'Analyzing...' : 'Run Forecast'}
                    </button>
                    {(forecast || alerts.length > 0) && (
                        <div className="mt-4 space-y-2">
                            {forecast && Object.entries(forecast).map(([gas, days]) => (
                                <p key={gas}><strong>{gas}:</strong> Estimated {days} supply remaining.</p>
                            ))}
                            {alerts.length > 0 && (
                                <div className="p-3 bg-red-100 text-red-700 rounded-md">
                                    <p className="font-bold">Low Stock Alerts!</p>
                                    <ul className="list-disc list-inside text-sm">{alerts.map((a, i) => <li key={i}>{a}</li>)}</ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )
    };
    
    const InventoryView = () => {
        const getStatusColor = (status: CylinderStatus) => {
             switch (status) {
                case CylinderStatus.Full: return 'bg-green-100 text-green-800';
                case CylinderStatus.InUse: return 'bg-blue-100 text-blue-800';
                case CylinderStatus.Empty: return 'bg-red-100 text-red-800';
                default: return 'bg-gray-100 text-gray-800';
            }
        };
        return (
             <div className="bg-white p-4 rounded-lg border">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left font-semibold">Cylinder ID</th>
                                <th className="px-4 py-2 text-left font-semibold">Gas Type</th>
                                <th className="px-4 py-2 text-left font-semibold">Size</th>
                                <th className="px-4 py-2 text-left font-semibold">Location</th>
                                <th className="px-4 py-2 text-left font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                           {cylinders.map(c => (
                               <tr key={c.id}>
                                   <td className="px-4 py-2 font-mono">{c.id}</td>
                                   <td className="px-4 py-2">{c.gasType}</td>
                                   <td className="px-4 py-2">{c.size}</td>
                                   <td className="px-4 py-2">{c.location}</td>
                                   <td className="px-4 py-2"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(c.status)}`}>{c.status}</span></td>
                               </tr>
                           ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    };

    const DispatchView = () => {
         return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg border">
                    <h3 className="font-bold text-lg mb-2">Approved Requests</h3>
                    <div className="space-y-2">
                        {requests.filter(r => r.status === GasRequestStatus.Approved).map(r => (
                            <div key={r.id} className="p-2 bg-gray-50 rounded">
                                <p><strong>{r.department}</strong> requests {r.quantity} x {r.gasType}</p>
                            </div>
                        ))}
                         {requests.filter(r => r.status === GasRequestStatus.Approved).length === 0 && <p className="text-sm text-gray-500">No requests to schedule.</p>}
                    </div>
                </div>
                 <div className="bg-white p-4 rounded-lg border">
                    <h3 className="font-bold text-lg mb-2">Dispatch Schedule</h3>
                    <button onClick={handleGenerateDispatch} disabled={isLoadingAI} className="w-full mb-2 px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-indigo-300">
                        {isLoadingAI ? 'Generating...' : 'Generate Dispatch Schedule with AI'}
                    </button>
                    <div className="space-y-2">
                        {dispatchSchedule.map(s => (
                             <div key={s.requestId} className="p-2 bg-green-100 rounded text-sm">
                                <p>Dispatch <strong>{s.cylinderId}</strong> to <strong>{s.destination}</strong> for request #{s.requestId.split('-')[1]}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">Medical Gas Management</h2>
                <div className="flex space-x-2 border-b">
                    <TabButton tabId="dashboard">Dashboard</TabButton>
                    <TabButton tabId="inventory">Inventory</TabButton>
                    <TabButton tabId="dispatch">Dispatch</TabButton>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto bg-gray-50 -m-6 p-6">
                {activeTab === 'dashboard' && <DashboardView />}
                {activeTab === 'inventory' && <InventoryView />}
                {activeTab === 'dispatch' && <DispatchView />}
            </div>
        </div>
    );
};

export default MedicalGasManagement;