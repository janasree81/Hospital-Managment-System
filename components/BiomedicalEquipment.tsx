import React, { useState, useMemo } from 'react';
import { User, BiomedicalEquipment, WorkOrder, EquipmentStatus, WorkOrderStatus, MaintenanceType } from '../types';
import { MOCK_BIOMEDICAL_EQUIPMENT, MOCK_WORK_ORDERS } from '../constants';
import { getAIPrioritizedWorkOrders } from '../services/geminiService';

const BiomedicalEquipmentManager: React.FC<{ user: User }> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'registry' | 'workOrders'>('dashboard');
    const [equipment, setEquipment] = useState<BiomedicalEquipment[]>(MOCK_BIOMEDICAL_EQUIPMENT);
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>(MOCK_WORK_ORDERS);
    
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [aiJustification, setAiJustification] = useState('');

    const handlePrioritizeWithAI = async () => {
        const openOrders = workOrders.filter(wo => wo.status === WorkOrderStatus.Open);
        if (openOrders.length === 0) {
            alert("No open work orders to prioritize.");
            return;
        }
        setIsLoadingAI(true);
        try {
            const { prioritizedOrder, justification } = await getAIPrioritizedWorkOrders(openOrders);
            // Create a map for quick lookups of the new order
            const priorityMap = new Map(prioritizedOrder.map((id, index) => [id, index]));
            
            const sortedOpenOrders = [...openOrders].sort((a, b) => {
                const priorityA = priorityMap.get(a.id) ?? Infinity;
                const priorityB = priorityMap.get(b.id) ?? Infinity;
                return priorityA - priorityB;
            });
            
            const otherOrders = workOrders.filter(wo => wo.status !== WorkOrderStatus.Open);
            setWorkOrders([...sortedOpenOrders, ...otherOrders]);
            setAiJustification(justification);
            setTimeout(() => setAiJustification(''), 10000); // Hide justification after 10s
        } catch (error) {
            console.error(error);
            alert("Failed to get AI prioritization.");
        } finally {
            setIsLoadingAI(false);
        }
    };

    const handleStatusChange = (orderId: string, newStatus: WorkOrderStatus) => {
        setWorkOrders(prev => prev.map(wo => wo.id === orderId ? {...wo, status: newStatus} : wo));
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
        const stats = useMemo(() => ({
            operational: equipment.filter(e => e.status === EquipmentStatus.Operational).length,
            maintenance: equipment.filter(e => e.status === EquipmentStatus.UnderMaintenance).length,
            breakdown: equipment.filter(e => e.status === EquipmentStatus.Breakdown).length,
            openWorkOrders: workOrders.filter(wo => wo.status === WorkOrderStatus.Open).length,
            overduePM: equipment.filter(e => new Date(e.nextServiceDate) < new Date()).length,
        }), [equipment, workOrders]);

        return (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                    <h4 className="font-semibold text-gray-600">Equipment Uptime</h4>
                    <p className="text-3xl font-bold text-green-600">{(stats.operational / equipment.length * 100).toFixed(1)}%</p>
                </div>
                 <div className="p-4 bg-white rounded-lg border">
                    <h4 className="font-semibold text-gray-600">Open Work Orders</h4>
                    <p className="text-3xl font-bold text-yellow-600">{stats.openWorkOrders}</p>
                </div>
                 <div className="p-4 bg-white rounded-lg border">
                    <h4 className="font-semibold text-gray-600">Overdue PM</h4>
                    <p className="text-3xl font-bold text-red-600">{stats.overduePM}</p>
                </div>
            </div>
        );
    };

    const RegistryView = () => {
         const getStatusColor = (status: EquipmentStatus) => {
            switch (status) {
                case EquipmentStatus.Operational: return 'bg-green-100 text-green-800';
                case EquipmentStatus.UnderMaintenance: return 'bg-blue-100 text-blue-800';
                case EquipmentStatus.Breakdown: return 'bg-red-100 text-red-800';
                default: return 'bg-gray-100 text-gray-800';
            }
        };

        return (
            <div className="bg-white p-4 rounded-lg border">
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left font-semibold">Name</th>
                                <th className="px-4 py-2 text-left font-semibold">Department</th>
                                <th className="px-4 py-2 text-left font-semibold">Location</th>
                                <th className="px-4 py-2 text-left font-semibold">Status</th>
                                <th className="px-4 py-2 text-left font-semibold">Next Service</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {equipment.map(e => (
                                <tr key={e.id}>
                                    <td className="px-4 py-2 font-medium">{e.name}</td>
                                    <td className="px-4 py-2">{e.department}</td>
                                    <td className="px-4 py-2">{e.location}</td>
                                    <td className="px-4 py-2"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(e.status)}`}>{e.status}</span></td>
                                    <td className="px-4 py-2">{e.nextServiceDate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const WorkOrdersView = () => {
        const ordersByStatus = useMemo(() => ({
            Open: workOrders.filter(wo => wo.status === WorkOrderStatus.Open),
            InProgress: workOrders.filter(wo => wo.status === WorkOrderStatus.InProgress),
            Completed: workOrders.filter(wo => wo.status === WorkOrderStatus.Completed),
        }), [workOrders]);

        const getPriorityColor = (priority: 'Low' | 'Medium' | 'High') => {
            if (priority === 'High') return 'border-red-500';
            if (priority === 'Medium') return 'border-yellow-500';
            return 'border-gray-400';
        };

        return (
            <div className="flex flex-col h-full">
                 {aiJustification && (
                    <div className="mb-4 p-3 bg-indigo-100 border border-indigo-300 rounded-lg text-sm text-indigo-800">
                        <strong>AI Prioritization Justification:</strong> {aiJustification}
                    </div>
                )}
                <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(['Open', 'In Progress', 'Completed'] as const).map(status => (
                        <div key={status} className="bg-gray-200 rounded-lg p-3 flex flex-col">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold">{status} ({ordersByStatus[status].length})</h3>
                                {status === 'Open' && <button onClick={handlePrioritizeWithAI} disabled={isLoadingAI} className="px-2 py-1 text-xs bg-indigo-600 text-white rounded disabled:bg-gray-400">{isLoadingAI ? '...' : 'AI Priority'}</button>}
                            </div>
                            <div className="space-y-2 overflow-y-auto flex-grow">
                                {ordersByStatus[status].map(wo => (
                                    <div key={wo.id} className={`p-3 bg-white rounded-md shadow-sm border-l-4 ${getPriorityColor(wo.priority)}`}>
                                        <p className="font-bold text-sm">{wo.equipmentName}</p>
                                        <p className="text-xs text-gray-600">{wo.issueDescription}</p>
                                        <div className="text-xs text-gray-500 mt-2 flex justify-between">
                                            <span>{wo.maintenanceType}</span>
                                            {status === 'Open' && <button onClick={() => handleStatusChange(wo.id, WorkOrderStatus.InProgress)} className="text-blue-600 hover:underline">Start</button>}
                                            {status === 'In Progress' && <button onClick={() => handleStatusChange(wo.id, WorkOrderStatus.Completed)} className="text-green-600 hover:underline">Complete</button>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">Biomedical Equipment</h2>
                <div className="flex space-x-2 border-b">
                    <TabButton tabId="dashboard">Dashboard</TabButton>
                    <TabButton tabId="registry">Equipment Registry</TabButton>
                    <TabButton tabId="workOrders">Work Orders</TabButton>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto bg-gray-50 -m-6 p-6">
                {activeTab === 'dashboard' && <DashboardView />}
                {activeTab === 'registry' && <RegistryView />}
                {activeTab === 'workOrders' && <WorkOrdersView />}
            </div>
        </div>
    );
};

export default BiomedicalEquipmentManager;
