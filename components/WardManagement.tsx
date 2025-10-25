import React, { useState, useMemo } from 'react';
import { User, Patient, Ward, Bed, BedStatus, NursingTask, TaskStatus, WardItem, Role } from '../types';
import { MOCK_WARDS, MOCK_NURSING_TASKS, MOCK_WARD_ITEMS, MOCK_PATIENTS } from '../constants';

interface WardManagementProps {
    user: User;
}

const WardManagement: React.FC<WardManagementProps> = ({ user }) => {
    const [wards, setWards] = useState<Ward[]>(MOCK_WARDS);
    const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
    const [tasks, setTasks] = useState<NursingTask[]>(MOCK_NURSING_TASKS);
    const [inventory, setInventory] = useState<WardItem[]>(MOCK_WARD_ITEMS);

    const [activeTab, setActiveTab] = useState<'bedBoard' | 'tasks' | 'inventory'>('bedBoard');
    const [modal, setModal] = useState<{ type: 'admit' | 'addTask' | 'handoff' | null, data?: any }>({ type: null });

    const currentWard = wards[0]; // Assuming only one ward for this mock

    const handleAdmitPatient = (patientId: string, bedId: string) => {
        const patient = patients.find(p => p.id === patientId);
        const bed = currentWard.beds.find(b => b.id === bedId);
        if (!patient || !bed) return;

        // Update bed status
        const updatedBeds = currentWard.beds.map(b => 
            b.id === bedId ? { ...b, status: BedStatus.Occupied, patientId: patient.id, patientName: `${patient.firstName} ${patient.lastName}` } : b
        );
        setWards(prev => [{...prev[0], beds: updatedBeds}]);

        // Update patient record
        setPatients(prev => prev.map(p => 
            p.id === patientId ? { ...p, wardId: currentWard.id, bedNumber: bed.bedNumber, roomNumber: bed.bedNumber } : p
        ));
        setModal({type: null});
    };
    
    const handleDischargePatient = (bedId: string) => {
        const bed = currentWard.beds.find(b => b.id === bedId);
        if (!bed || !bed.patientId) return;

        const patientId = bed.patientId;
        // Update bed to Cleaning
        const updatedBeds = currentWard.beds.map(b => b.id === bedId ? { ...b, status: BedStatus.Cleaning, patientId: undefined, patientName: undefined } : b);
        setWards(prev => [{...prev[0], beds: updatedBeds}]);

        // Clear patient's ward info
        setPatients(prev => prev.map(p => p.id === patientId ? {...p, wardId: undefined, bedNumber: undefined, roomNumber: 'Discharged'} : p));
    };
    
    const handleTaskStatusChange = (taskId: string, newStatus: TaskStatus) => {
        setTasks(prev => prev.map(t => t.id === taskId ? {...t, status: newStatus} : t));
    }

    const BedBoardView = () => {
        const getStatusStyles = (status: BedStatus) => {
            switch (status) {
                case BedStatus.Available: return 'bg-green-100 border-green-500';
                case BedStatus.Occupied: return 'bg-blue-100 border-blue-500';
                case BedStatus.Cleaning: return 'bg-yellow-100 border-yellow-500';
            }
        };
        return (
            <div>
                 <h3 className="text-xl font-bold text-gray-800 mb-4">{currentWard.name} - Bed Board</h3>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {currentWard.beds.map(bed => (
                        <div key={bed.id} className={`p-4 rounded-lg border-l-4 ${getStatusStyles(bed.status)}`}>
                            <p className="font-bold">{bed.bedNumber}</p>
                            {bed.status === BedStatus.Occupied ? (
                                <div>
                                    <p className="font-semibold text-blue-800">{bed.patientName}</p>
                                    <button onClick={() => handleDischargePatient(bed.id)} className="text-xs text-red-600 hover:underline mt-2">Discharge</button>
                                </div>
                            ) : bed.status === BedStatus.Available ? (
                                 <button onClick={() => setModal({ type: 'admit', data: { bedId: bed.id }})} className="text-sm text-green-700 font-semibold hover:underline">Admit Patient</button>
                            ) : (
                                <p className="text-sm text-yellow-800 font-semibold">Needs Cleaning</p>
                            )}
                        </div>
                    ))}
                 </div>
            </div>
        );
    }
    
    const TaskListView = () => {
        const [taskFilter, setTaskFilter] = useState<TaskStatus>(TaskStatus.Pending);
        const tasksByPatient = tasks
            .filter(t => t.status === taskFilter)
            .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .reduce((acc, task) => {
                (acc[task.patientName] = acc[task.patientName] || []).push(task);
                return acc;
            }, {} as Record<string, NursingTask[]>);

        return (
             <div>
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Nursing Tasks</h3>
                    <div className="flex items-center gap-2">
                         <select value={taskFilter} onChange={e => setTaskFilter(e.target.value as TaskStatus)} className="p-2 border rounded-md bg-white text-sm">
                            <option value={TaskStatus.Pending}>Pending</option>
                            <option value={TaskStatus.Completed}>Completed</option>
                        </select>
                        <button onClick={() => alert('Task creation form would appear here.')} className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700">+ Add Task</button>
                    </div>
                 </div>
                 <div className="space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto">
                    {Object.entries(tasksByPatient).map(([patientName, patientTasks]) => (
                        <div key={patientName} className="p-3 bg-white border rounded-lg">
                            <h4 className="font-bold">{patientName}</h4>
                            <ul className="divide-y mt-2">
                                {patientTasks.map(task => (
                                    <li key={task.id} className="py-2 flex justify-between items-center">
                                        <div>
                                            <p>{task.task}</p>
                                            <p className="text-xs text-gray-500">Due: {new Date(task.dueDate).toLocaleTimeString()}</p>
                                        </div>
                                        <input type="checkbox" checked={task.status === TaskStatus.Completed} onChange={() => handleTaskStatusChange(task.id, task.status === TaskStatus.Pending ? TaskStatus.Completed : TaskStatus.Pending)} className="h-5 w-5 text-indigo-600 border-gray-300 rounded"/>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                 </div>
             </div>
        )
    };
    
    const InventoryView = () => (
         <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Ward Inventory</h3>
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {inventory.map(item => (
                            <tr key={item.id} className={item.stock < item.reorderLevel ? 'bg-red-50' : ''}>
                                <td className="px-6 py-4 font-medium">{item.name}</td>
                                <td className={`px-6 py-4 font-semibold ${item.stock < item.reorderLevel ? 'text-red-600' : ''}`}>{item.stock} / {item.reorderLevel} {item.unit}</td>
                                <td className="px-6 py-4 text-right"><button className="text-sm px-3 py-1 bg-gray-200 rounded-md">Use Stock</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
         </div>
    );
    
    const AdmitPatientModal: React.FC<{ bedId: string }> = ({ bedId }) => {
        const [patientId, setPatientId] = useState('');
        const unassignedPatients = patients.filter(p => !p.wardId);
        return (
             <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                 <div className="bg-white rounded-lg p-6 w-full max-w-md">
                     <h3 className="text-lg font-bold mb-4">Admit Patient to Bed {currentWard.beds.find(b=>b.id===bedId)?.bedNumber}</h3>
                    <select value={patientId} onChange={e => setPatientId(e.target.value)} className="w-full p-2 border rounded-md bg-white mb-4">
                        <option value="">Select a patient to admit</option>
                        {unassignedPatients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                    </select>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setModal({ type: null })} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                        <button onClick={() => handleAdmitPatient(patientId, bedId)} disabled={!patientId} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400">Admit</button>
                    </div>
                 </div>
             </div>
        );
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">Ward Management</h2>
                <div className="flex space-x-2 border-b">
                     <button
                        onClick={() => setActiveTab('bedBoard')}
                        className={`px-4 py-2 text-sm font-medium rounded-t-md ${activeTab === 'bedBoard' ? 'bg-gray-100 border-b-2 border-indigo-600' : 'text-gray-500'}`}
                    >
                        Bed Board
                    </button>
                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={`px-4 py-2 text-sm font-medium rounded-t-md ${activeTab === 'tasks' ? 'bg-gray-100 border-b-2 border-indigo-600' : 'text-gray-500'}`}
                    >
                        Nursing Tasks
                    </button>
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`px-4 py-2 text-sm font-medium rounded-t-md ${activeTab === 'inventory' ? 'bg-gray-100 border-b-2 border-indigo-600' : 'text-gray-500'}`}
                    >
                        Inventory
                    </button>
                </div>
            </div>
             <div className="flex-grow overflow-y-auto bg-gray-50 -m-6 p-6">
                {activeTab === 'bedBoard' && <BedBoardView />}
                {activeTab === 'tasks' && <TaskListView />}
                {activeTab === 'inventory' && <InventoryView />}
            </div>

            {modal?.type === 'admit' && modal.data && <AdmitPatientModal bedId={modal.data.bedId} />}
        </div>
    );
};

export default WardManagement;
