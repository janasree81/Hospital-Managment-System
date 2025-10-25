import React, { useState, useMemo } from 'react';
import { User, Porter, TransportRequest, PorterStatus, TransportStatus, TransportPriority } from '../types';
// FIX: Added missing imports for MOCK_TRANSPORT_REQUESTS and DEPARTMENTS.
import { MOCK_PORTERS, MOCK_TRANSPORT_REQUESTS, MOCK_PATIENTS, DEPARTMENTS } from '../constants';
import { assignPorterToRequest } from '../services/geminiService';

const PatientPorterSystem: React.FC<{ user: User }> = ({ user }) => {
    const [porters, setPorters] = useState<Porter[]>(MOCK_PORTERS);
    const [requests, setRequests] = useState<TransportRequest[]>(MOCK_TRANSPORT_REQUESTS);
    const [activeTab, setActiveTab] = useState<'map' | 'requests' | 'tasks'>('map');
    const [modal, setModal] = useState<{ type: 'newRequest' | null }>({ type: null });
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [aiMessage, setAiMessage] = useState('');

    const handleCreateRequest = async (formData: Omit<TransportRequest, 'id' | 'requestTimestamp' | 'status'>) => {
        const newRequest: TransportRequest = {
            id: `tr-${Date.now()}`,
            requestTimestamp: new Date().toISOString(),
            status: TransportStatus.Pending,
            ...formData,
        };
        
        setIsLoadingAI(true);
        setModal({ type: null }); // Close form modal immediately
        
        try {
            const availablePorters = porters.filter(p => p.status === PorterStatus.Available);
            if (availablePorters.length === 0) {
                setRequests(prev => [newRequest, ...prev]);
                alert("Request created but no porters are available. It will remain pending.");
                return;
            }

            const { porterId, reason } = await assignPorterToRequest(newRequest, availablePorters);
            const assignedPorter = porters.find(p => p.id === porterId);

            if (assignedPorter) {
                const assignedRequest: TransportRequest = {
                    ...newRequest,
                    status: TransportStatus.Assigned,
                    assignedPorterId: porterId,
                    assignedPorterName: assignedPorter.name,
                    assignmentTimestamp: new Date().toISOString(),
                };
                setRequests(prev => [assignedRequest, ...prev]);
                setPorters(prev => prev.map(p => p.id === porterId ? { ...p, status: PorterStatus.OnTask } : p));
                setAiMessage(`AI assigned ${assignedPorter.name}. Reason: ${reason}`);
                setTimeout(() => setAiMessage(''), 8000);
            } else {
                 setRequests(prev => [newRequest, ...prev]);
                 alert("AI assignment failed. Request is pending.");
            }

        } catch (error) {
            console.error(error);
            setRequests(prev => [newRequest, ...prev]);
            alert("An error occurred during AI assignment. The request is now pending.");
        } finally {
            setIsLoadingAI(false);
        }
    };

    const handleUpdateStatus = (requestId: string, newStatus: TransportStatus) => {
        setRequests(prev => prev.map(r => {
            if (r.id === requestId) {
                const updatedRequest = { ...r, status: newStatus };
                if (newStatus === TransportStatus.Completed || newStatus === TransportStatus.Cancelled) {
                    // Make porter available again
                    setPorters(porters => porters.map(p => p.id === r.assignedPorterId ? { ...p, status: PorterStatus.Available } : p));
                    updatedRequest.completionTimestamp = new Date().toISOString();
                }
                return updatedRequest;
            }
            return r;
        }));
    };

    const TabButton: React.FC<{ tabId: typeof activeTab, children: React.ReactNode }> = ({ tabId, children }) => (
        <button onClick={() => setActiveTab(tabId)} className={`px-4 py-2 text-sm font-medium rounded-t-md ${activeTab === tabId ? 'bg-gray-100 border-b-2 border-indigo-600' : 'text-gray-500'}`}>
            {children}
        </button>
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">Patient Porter System</h2>
                <div className="flex space-x-2 border-b">
                    <TabButton tabId="map">Live Map</TabButton>
                    <TabButton tabId="requests">All Requests</TabButton>
                    <TabButton tabId="tasks">My Tasks</TabButton>
                </div>
            </div>
             {aiMessage && (
                <div className="mb-4 p-3 bg-indigo-100 border border-indigo-300 rounded-lg text-sm text-indigo-800 transition-opacity duration-300">
                    <strong>AI Dispatch:</strong> {aiMessage}
                </div>
            )}
            <div className="flex-grow overflow-y-auto bg-gray-50 -m-6 p-6">
                {activeTab === 'map' && <LiveMapView porters={porters} requests={requests} onNewRequest={() => setModal({type: 'newRequest'})} />}
                {activeTab === 'requests' && <AllRequestsView requests={requests} />}
                {activeTab === 'tasks' && <MyTasksView requests={requests.filter(r => r.assignedPorterName === 'Mike Johnson')} onUpdateStatus={handleUpdateStatus} />}
            </div>
            {modal.type === 'newRequest' && <NewRequestModal onSubmit={handleCreateRequest} onClose={() => setModal({type: null})} />}
        </div>
    );
};

const LiveMapView: React.FC<{ porters: Porter[], requests: TransportRequest[], onNewRequest: () => void }> = ({ porters, requests, onNewRequest }) => {
    const stats = {
        available: porters.filter(p => p.status === PorterStatus.Available).length,
        onTask: porters.filter(p => p.status === PorterStatus.OnTask).length,
        pending: requests.filter(r => r.status === TransportStatus.Pending).length,
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-lg border text-center"><p className="text-gray-600">Available Porters</p><p className="text-2xl font-bold text-green-600">{stats.available}</p></div>
                <div className="p-4 bg-white rounded-lg border text-center"><p className="text-gray-600">Porters on Task</p><p className="text-2xl font-bold text-blue-600">{stats.onTask}</p></div>
                <div className="p-4 bg-white rounded-lg border text-center"><p className="text-gray-600">Pending Requests</p><p className="text-2xl font-bold text-yellow-600">{stats.pending}</p></div>
                <button onClick={onNewRequest} className="bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">New Transport Request</button>
            </div>
            <div className="p-4 bg-white rounded-lg border h-[calc(100vh-22rem)]">
                <h3 className="font-bold mb-2">Hospital Live View (Simulated)</h3>
                <div className="relative h-full bg-gray-200 rounded-md overflow-hidden">
                    {/* Simplified locations */}
                    <div className="absolute top-4 left-4 text-xs font-semibold">Ward A</div>
                    <div className="absolute top-4 right-4 text-xs font-semibold">Ward B</div>
                    <div className="absolute bottom-4 left-4 text-xs font-semibold">Radiology</div>
                    <div className="absolute bottom-4 right-4 text-xs font-semibold">ER</div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-semibold">OT</div>
                    {/* Porters */}
                    {porters.map(p => <div key={p.id} className="absolute text-xs p-1 bg-green-500 text-white rounded-full" style={{top: '10%', left: '20%'}} title={p.name}>{p.name.charAt(0)}</div>)}
                    {/* Requests */}
                    {requests.filter(r=>r.status === 'Pending').map(r=><div key={r.id} className="absolute text-xl" style={{top: '15%', left: '25%'}} title={r.patientName}>🛌</div>)}
                </div>
            </div>
        </div>
    );
};

const AllRequestsView: React.FC<{ requests: TransportRequest[] }> = ({ requests }) => {
    // ... implementation for table view of all requests
    return (
        <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-bold text-lg mb-2">All Transport Requests</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">Patient</th><th className="px-4 py-2 text-left">From</th><th className="px-4 py-2 text-left">To</th><th className="px-4 py-2 text-left">Porter</th><th className="px-4 py-2 text-left">Status</th></tr></thead>
                    <tbody>
                        {requests.map(r => <tr key={r.id} className="border-b"><td className="px-4 py-2">{r.patientName}</td><td className="px-4 py-2">{r.fromLocation}</td><td className="px-4 py-2">{r.toLocation}</td><td className="px-4 py-2">{r.assignedPorterName || 'N/A'}</td><td className="px-4 py-2">{r.status}</td></tr>)}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const MyTasksView: React.FC<{ requests: TransportRequest[], onUpdateStatus: (id: string, status: TransportStatus) => void }> = ({ requests, onUpdateStatus }) => {
    const activeTask = requests.find(r => r.status !== TransportStatus.Completed && r.status !== TransportStatus.Cancelled);
    return (
        <div className="max-w-md mx-auto">
             <h3 className="font-bold text-lg mb-2 text-center">My Active Task (Porter: Mike Johnson)</h3>
             {activeTask ? (
                <div className="p-4 bg-white border rounded-lg space-y-3">
                    <p><strong>Patient:</strong> {activeTask.patientName}</p>
                    <p><strong>From:</strong> {activeTask.fromLocation}</p>
                    <p><strong>To:</strong> {activeTask.toLocation}</p>
                    <p><strong>Status:</strong> <span className="font-semibold">{activeTask.status}</span></p>
                    <div className="pt-3 border-t space-y-2">
                        {activeTask.status === 'Assigned' && <button onClick={() => onUpdateStatus(activeTask.id, TransportStatus.EnRouteToPatient)} className="w-full p-2 bg-blue-500 text-white rounded">Accept & Go to Patient</button>}
                        {activeTask.status === 'En Route to Patient' && <button onClick={() => onUpdateStatus(activeTask.id, TransportStatus.Transporting)} className="w-full p-2 bg-blue-500 text-white rounded">Scan & Start Transport</button>}
                        {activeTask.status === 'Transporting' && <button onClick={() => onUpdateStatus(activeTask.id, TransportStatus.Completed)} className="w-full p-2 bg-green-500 text-white rounded">Mark as Completed</button>}
                    </div>
                </div>
             ) : <p className="text-center text-gray-500">No active tasks.</p>}
        </div>
    );
};

const NewRequestModal: React.FC<{ onSubmit: (data: any) => void, onClose: () => void }> = ({ onSubmit, onClose }) => {
    const [formData, setFormData] = useState({ patientId: '', toLocation: '', priority: TransportPriority.Routine, equipmentNeeded: [] as string[], notes: '' });
    const patient = MOCK_PATIENTS.find(p => p.id === formData.patientId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // FIX: Property 'name' does not exist on type 'Patient'. Used 'firstName' and 'lastName' instead.
        onSubmit({ ...formData, patientName: `${patient?.firstName} ${patient?.lastName}`, fromLocation: patient?.roomNumber });
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg space-y-4">
                <h3 className="text-xl font-bold">New Transport Request</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm">Patient</label>
                        <select value={formData.patientId} onChange={e => setFormData({...formData, patientId: e.target.value})} required className="mt-1 w-full border rounded-md p-2 bg-white">
                            <option value="">Select patient</option>
                            {/* FIX: Property 'name' does not exist on type 'Patient'. Used 'firstName' and 'lastName' instead. */}
                            {MOCK_PATIENTS.filter(p=>p.wardId).map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm">From</label>
                        <input value={patient?.roomNumber || ''} readOnly className="mt-1 w-full border rounded-md p-2 bg-gray-100"/>
                    </div>
                     <div>
                        <label className="block text-sm">To</label>
                        <select value={formData.toLocation} onChange={e => setFormData({...formData, toLocation: e.target.value})} required className="mt-1 w-full border rounded-md p-2 bg-white">
                            <option value="">Select destination</option>
                            {DEPARTMENTS.map(d => <option key={d.name}>{d.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm">Priority</label>
                        <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as TransportPriority})} className="mt-1 w-full border rounded-md p-2 bg-white">
                            {Object.values(TransportPriority).map(p => <option key={p}>{p}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm">Notes</label>
                    <input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="mt-1 w-full border rounded-md p-2"/>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Assign Porter with AI</button>
                </div>
            </form>
         </div>
    );
};

export default PatientPorterSystem;
