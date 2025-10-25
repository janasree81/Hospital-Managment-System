import React, { useState, useMemo, useEffect } from 'react';
import { Dispatch, DispatchStatus, Ambulance, AmbulanceStatus, DispatchLogEntry, EmergencyCase, Coordinates } from '../types';
import { MOCK_DISPATCHES, MOCK_AMBULANCES, MOCK_EMERGENCY_CASES, HOSPITAL_COORDS } from '../constants';

// Map Simulation Constants
const MAP_BOUNDS = {
    latMin: 34.03,
    latMax: 34.08,
    lngMin: -118.28,
    lngMax: -118.18,
};

// Helper to convert GPS coordinates to pixel positions for the map
const coordsToPosition = (coords: Coordinates) => {
    const top = 100 - ((coords.lat - MAP_BOUNDS.latMin) / (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin) * 100);
    const left = (coords.lng - MAP_BOUNDS.lngMin) / (MAP_BOUNDS.lngMax - MAP_BOUNDS.lngMin) * 100;
    return { top: `${top}%`, left: `${left}%` };
};

// Helper to generate a random start coordinate for new dispatches
const getRandomCoords = (): Coordinates => {
    const lat = MAP_BOUNDS.latMin + Math.random() * (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin);
    const lng = MAP_BOUNDS.lngMin + Math.random() * (MAP_BOUNDS.lngMax - MAP_BOUNDS.lngMin);
    return { lat, lng };
};


const AmbulanceDispatch: React.FC = () => {
    const [dispatches, setDispatches] = useState<Dispatch[]>(MOCK_DISPATCHES);
    const [ambulances, setAmbulances] = useState<Ambulance[]>(MOCK_AMBULANCES);
    const [modal, setModal] = useState<{ type: 'new' | 'details', data?: Dispatch }>({ type: null });

    // Simulate ETA countdown for all transporting ambulances
    useEffect(() => {
        const interval = setInterval(() => {
            setDispatches(prev => prev.map(d => {
                if (d.status === DispatchStatus.Transporting && d.etaMinutes && d.etaMinutes > 0) {
                    return { ...d, etaMinutes: d.etaMinutes - 1 };
                }
                return d;
            }));
        }, 60000); // every minute
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: DispatchStatus) => {
        switch (status) {
            case DispatchStatus.Dispatched: return 'bg-blue-100 text-blue-800';
            case DispatchStatus.OnScene: return 'bg-yellow-100 text-yellow-800';
            case DispatchStatus.Transporting: return 'bg-purple-100 text-purple-800';
            case DispatchStatus.Arrived: return 'bg-teal-100 text-teal-800';
            case DispatchStatus.Completed: return 'bg-green-100 text-green-800';
            case DispatchStatus.Cancelled: return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    const handleUpdateStatus = (dispatchId: string, newStatus: DispatchStatus) => {
        const timestamp = new Date().toISOString();
        const newLog: DispatchLogEntry = { timestamp, status: newStatus };
        
        setDispatches(prev => prev.map(d => {
            if (d.id === dispatchId) {
                // Update ambulance status as well
                const isFinalStatus = [DispatchStatus.Completed, DispatchStatus.Cancelled].includes(newStatus);
                setAmbulances(ambs => ambs.map(a => a.id === d.ambulanceId ? {...a, status: isFinalStatus ? AmbulanceStatus.Available : AmbulanceStatus.Dispatched} : a));
                
                return { ...d, status: newStatus, logs: [...d.logs, newLog], etaMinutes: newStatus === DispatchStatus.Arrived ? 0 : d.etaMinutes };
            }
            return d;
        }));
    };
    
    const handleCreateDispatch = (formData: Omit<Dispatch, 'id' | 'dispatchTimestamp' | 'status' | 'logs' | 'destination'>) => {
        const timestamp = new Date().toISOString();
        const newDispatch: Dispatch = {
            id: `DISP-${Date.now().toString().slice(-4)}`,
            dispatchTimestamp: timestamp,
            status: DispatchStatus.Dispatched,
            destination: 'HMS Connect General Hospital',
            logs: [{ timestamp, status: DispatchStatus.Dispatched }],
            ...formData,
            startCoords: getRandomCoords(),
        };
        setDispatches(prev => [newDispatch, ...prev]);
        setAmbulances(prev => prev.map(a => a.id === formData.ambulanceId ? {...a, status: AmbulanceStatus.Dispatched} : a));
        setModal({ type: null });
    };

    const NewDispatchModal: React.FC = () => {
        const availableAmbulances = ambulances.filter(a => a.status === AmbulanceStatus.Available);
        const [formData, setFormData] = useState({
            emergencyCaseId: '',
            ambulanceId: '',
            dispatchLocation: '',
            priority: 'Urgent' as Dispatch['priority'],
            etaMinutes: 15,
        });
        const selectedERCase = MOCK_EMERGENCY_CASES.find(c => c.id === formData.emergencyCaseId);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: name === 'etaMinutes' ? Number(value) : value }));
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (!selectedERCase) return alert('Please select an emergency case.');
            handleCreateDispatch({ ...formData, patientName: selectedERCase.patientName });
        };
        
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg space-y-4">
                    <h3 className="text-xl font-bold">New Ambulance Dispatch</h3>
                     <div>
                        <label className="block text-sm font-medium">Emergency Case</label>
                        <select name="emergencyCaseId" value={formData.emergencyCaseId} onChange={handleChange} required className="mt-1 w-full border rounded-md p-2 bg-white">
                            <option value="">Select ER Case</option>
                            {MOCK_EMERGENCY_CASES.map(c => <option key={c.id} value={c.id}>{c.id} - {c.patientName} ({c.chiefComplaint})</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Available Ambulance</label>
                        <select name="ambulanceId" value={formData.ambulanceId} onChange={handleChange} required className="mt-1 w-full border rounded-md p-2 bg-white disabled:bg-gray-200" disabled={availableAmbulances.length === 0}>
                            <option value="">{availableAmbulances.length > 0 ? 'Select Ambulance' : 'No Ambulances Available'}</option>
                            {availableAmbulances.map(a => <option key={a.id} value={a.id}>{a.id} (Crew: {a.crew.join(', ')})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Dispatch Location</label>
                        <input name="dispatchLocation" value={formData.dispatchLocation} onChange={handleChange} required className="mt-1 w-full border rounded-md p-2" />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Priority</label>
                            <select name="priority" value={formData.priority} onChange={handleChange} className="mt-1 w-full border rounded-md p-2 bg-white">
                                <option>Routine</option><option>Urgent</option><option>Critical</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Initial ETA (minutes)</label>
                            <input type="number" name="etaMinutes" value={formData.etaMinutes} onChange={handleChange} required className="mt-1 w-full border rounded-md p-2" />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={() => setModal({ type: null })} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Dispatch</button>
                    </div>
                </form>
            </div>
        );
    };

    const DetailsModal: React.FC<{ data: Dispatch }> = ({ data }) => {
        const erCase = MOCK_EMERGENCY_CASES.find(c => c.id === data.emergencyCaseId);
        const [currentPosition, setCurrentPosition] = useState<Coordinates | null>(data.startCoords || null);
        const [currentEta, setCurrentEta] = useState(data.etaMinutes);
        
        useEffect(() => {
            if (data.status !== DispatchStatus.Transporting || !data.startCoords) {
                return;
            }

            const transportLog = data.logs.find(l => l.status === DispatchStatus.Transporting);
            if (!transportLog || !data.etaMinutes) return;

            const startTime = new Date(transportLog.timestamp).getTime();
            const totalDuration = data.etaMinutes * 60 * 1000;

            const interval = setInterval(() => {
                const elapsedTime = new Date().getTime() - startTime;
                let progress = elapsedTime / totalDuration;
                if (progress > 1) progress = 1;
                
                const newLat = data.startCoords!.lat + (HOSPITAL_COORDS.lat - data.startCoords!.lat) * progress;
                const newLng = data.startCoords!.lng + (HOSPITAL_COORDS.lng - data.startCoords!.lng) * progress;

                setCurrentPosition({ lat: newLat, lng: newLng });
                
                const remainingMinutes = Math.max(0, Math.ceil((totalDuration - elapsedTime) / 60000));
                setCurrentEta(remainingMinutes);

                if (progress >= 1) {
                    clearInterval(interval);
                }
            }, 2000); // Update every 2 seconds for smooth animation

            return () => clearInterval(interval);
        }, [data]);

        const startPos = data.startCoords ? coordsToPosition(data.startCoords) : null;
        const hospitalPos = coordsToPosition(HOSPITAL_COORDS);
        const currentPos = currentPosition ? coordsToPosition(currentPosition) : null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-full flex flex-col">
                    <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold">Dispatch Details: {data.id}</h3>
                        <button onClick={() => setModal({ type: null })} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                    </div>
                    <div className="mt-4 flex-grow overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg border">
                                <h4 className="font-bold text-gray-800 mb-2">Patient & Case Info</h4>
                                <p><strong>Patient:</strong> {data.patientName}</p>
                                <p><strong>ER Case:</strong> {data.emergencyCaseId}</p>
                                {erCase && <p><strong>Complaint:</strong> {erCase.chiefComplaint}</p>}
                                <p><strong>Priority:</strong> {data.priority}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg border">
                                <h4 className="font-bold text-gray-800 mb-2">Ambulance & Location</h4>
                                <p><strong>Ambulance:</strong> {data.ambulanceId}</p>
                                <p><strong>Pickup:</strong> {data.dispatchLocation}</p>
                                <p><strong>Destination:</strong> {data.destination}</p>
                            </div>
                             <div className="p-4 bg-gray-50 rounded-lg border">
                                <h4 className="font-bold text-gray-800 mb-2">Dispatch Log</h4>
                                <ul className="space-y-1 text-sm">
                                    {data.logs.slice().reverse().map(log => (
                                        <li key={log.timestamp}><strong>{log.status}</strong> at {new Date(log.timestamp).toLocaleTimeString()}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border flex flex-col items-center justify-center">
                            <h4 className="font-bold text-gray-800 mb-2">Live Status (Simulated)</h4>
                            <div className="relative w-full h-48 bg-gray-200 rounded overflow-hidden">
                                {startPos && currentPos && (
                                    <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 10 }}>
                                        {/* Total Route */}
                                        <line x1={startPos.left} y1={startPos.top} x2={hospitalPos.left} y2={hospitalPos.top} stroke="#9ca3af" strokeWidth="2" strokeDasharray="4"/>
                                        {/* Traveled Route */}
                                        <line x1={startPos.left} y1={startPos.top} x2={currentPos.left} y2={currentPos.top} stroke="#4f46e5" strokeWidth="3"/>
                                    </svg>
                                )}
                                {startPos && <div className="absolute w-3 h-3 bg-blue-500 rounded-full border-2 border-white" style={{ ...startPos, transform: 'translate(-50%, -50%)', zIndex: 20 }} title="Start Location"></div>}
                                <div className="absolute w-5 h-5 flex items-center justify-center bg-red-500 rounded-full border-2 border-white" style={{ ...hospitalPos, transform: 'translate(-50%, -50%)', zIndex: 20 }} title="Hospital">
                                    <span className="text-white font-bold text-xs">H</span>
                                </div>
                                {currentPos && (
                                <div className="absolute text-2xl" style={{ ...currentPos, transform: 'translate(-50%, -50%)', zIndex: 30, transition: 'top 2s linear, left 2s linear' }} title="Ambulance">
                                    🚑
                                </div>
                                )}
                            </div>
                            <div className="mt-4 text-center">
                                <p className="text-lg">ETA</p>
                                <p className="text-3xl font-bold text-indigo-600">{currentEta ?? data.etaMinutes ?? 'N/A'} min</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Ambulance Dispatch</h2>
                <button onClick={() => setModal({ type: 'new' })} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    + New Dispatch
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dispatch ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ambulance</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ETA</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {dispatches.map(d => (
                            <tr key={d.id}>
                                <td className="px-6 py-4 font-mono text-sm text-gray-600">{d.id}</td>
                                <td className="px-6 py-4 font-medium">{d.ambulanceId}</td>
                                <td className="px-6 py-4">{d.patientName}</td>
                                <td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(d.status)}`}>{d.status}</span></td>
                                <td className="px-6 py-4 font-semibold">{d.status === DispatchStatus.Transporting ? `${d.etaMinutes} min` : '--'}</td>
                                <td className="px-6 py-4 text-sm space-x-1">
                                    {d.status === DispatchStatus.Dispatched && <button onClick={() => handleUpdateStatus(d.id, DispatchStatus.OnScene)} className="px-2 py-1 text-xs bg-yellow-500 text-white rounded">On Scene</button>}
                                    {d.status === DispatchStatus.OnScene && <button onClick={() => handleUpdateStatus(d.id, DispatchStatus.Transporting)} className="px-2 py-1 text-xs bg-purple-500 text-white rounded">Transport</button>}
                                    {d.status === DispatchStatus.Transporting && <button onClick={() => handleUpdateStatus(d.id, DispatchStatus.Arrived)} className="px-2 py-1 text-xs bg-teal-500 text-white rounded">Arrived</button>}
                                    {d.status === DispatchStatus.Arrived && <button onClick={() => handleUpdateStatus(d.id, DispatchStatus.Completed)} className="px-2 py-1 text-xs bg-green-500 text-white rounded">Complete</button>}
                                    <button onClick={() => setModal({ type: 'details', data: d })} className="px-2 py-1 text-xs bg-gray-500 text-white rounded">Details</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {modal.type === 'new' && <NewDispatchModal />}
            {modal.type === 'details' && modal.data && <DetailsModal data={modal.data} />}
        </div>
    );
};

export default AmbulanceDispatch;