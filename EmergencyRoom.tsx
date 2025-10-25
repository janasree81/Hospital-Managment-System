import React, { useState, useEffect, useMemo } from 'react';
import { EmergencyCase, CaseStatus, TriageLevel, TriageLevelDetails, User, Role } from '../types';
import { MOCK_EMERGENCY_CASES, MOCK_STAFF } from '../constants';
import { getAITriageSuggestion } from '../services/geminiService';


interface EmergencyRoomProps {
    user: User;
}

const BOARD_COLUMNS: { title: string, status: CaseStatus }[] = [
    { title: 'Waiting for Triage', status: CaseStatus.WaitingTriage },
    { title: 'Waiting Room', status: CaseStatus.WaitingRoom },
    { title: 'In Treatment', status: CaseStatus.InTreatment },
    { title: 'Observation', status: CaseStatus.Observation },
    { title: 'Awaiting Disposition', status: CaseStatus.AwaitingDisposition },
];

// Utility to calculate time since an event
const timeSince = (dateString: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "min ago";
    return Math.floor(seconds) + "s ago";
};

const EmergencyRoom: React.FC<EmergencyRoomProps> = ({ user }) => {
    const [cases, setCases] = useState<EmergencyCase[]>(MOCK_EMERGENCY_CASES);
    const [modal, setModal] = useState<{ type: 'register' | 'triage' | 'details' | null, data?: EmergencyCase }>({ type: null });
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const doctors = useMemo(() => MOCK_STAFF.filter(s => s.role === Role.Doctor), []);

    const handleRegister = (newCaseData: Omit<EmergencyCase, 'id' | 'status' | 'arrivalTime' | 'vitals'>) => {
        const newCase: EmergencyCase = {
            id: `er${Date.now()}`,
            status: CaseStatus.WaitingTriage,
            arrivalTime: new Date().toISOString(),
            vitals: [],
            ...newCaseData,
        };
        setCases(prev => [newCase, ...prev]);
        setModal({ type: null });
    };

    const handleUpdateCase = (updatedCase: EmergencyCase) => {
        setCases(prev => prev.map(c => c.id === updatedCase.id ? updatedCase : c));
        setModal({ type: null });
    };

    const CaseCard: React.FC<{ caseData: EmergencyCase }> = ({ caseData }) => {
        const triageColor = caseData.triageLevel ? TriageLevelDetails[caseData.triageLevel].color : 'gray-400';
        return (
            <div
                onClick={() => setModal({ type: 'details', data: caseData })}
                className={`bg-white p-4 rounded-lg shadow-md mb-4 border-l-4 border-${triageColor} cursor-pointer hover:shadow-lg transition-shadow`}
            >
                <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-800">{caseData.patientName} <span className="text-sm font-normal text-gray-500">({caseData.age} {caseData.gender.charAt(0)})</span></h4>
                    {caseData.triageLevel && <span className={`px-2 py-0.5 text-xs font-semibold rounded-full bg-${triageColor} bg-opacity-20 text-${triageColor}`}>{TriageLevelDetails[caseData.triageLevel].name}</span>}
                </div>
                <p className="text-sm text-gray-600 mt-1">{caseData.chiefComplaint}</p>
                <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                    <span>Arrival: {timeSince(caseData.arrivalTime)}</span>
                    {caseData.status === CaseStatus.WaitingTriage && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setModal({ type: 'triage', data: caseData }); }}
                            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                        >Triage</button>
                    )}
                </div>
            </div>
        );
    };

    const RegisterModal: React.FC = () => {
        const [formData, setFormData] = useState({ patientName: '', age: 0, gender: 'Unknown' as EmergencyCase['gender'], chiefComplaint: '' });
        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            const { name, value, type } = e.target;
            setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) : value }));
        };
        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            handleRegister(formData as any); // Type assertion for simplicity
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                    <h3 className="text-xl font-bold mb-4">Register New ER Case</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Form fields... */}
                        <div><label className="block text-sm font-medium">Patient Name</label><input name="patientName" required onChange={handleChange} className="mt-1 w-full border rounded-md p-2"/></div>
                        <div><label className="block text-sm font-medium">Age</label><input name="age" type="number" required onChange={handleChange} className="mt-1 w-full border rounded-md p-2"/></div>
                        <div><label className="block text-sm font-medium">Gender</label><select name="gender" onChange={handleChange} defaultValue="Unknown" className="mt-1 w-full border rounded-md p-2 bg-white"><option>Male</option><option>Female</option><option>Other</option><option>Unknown</option></select></div>
                        <div><label className="block text-sm font-medium">Chief Complaint</label><textarea name="chiefComplaint" required onChange={handleChange} className="mt-1 w-full border rounded-md p-2"></textarea></div>
                        <div className="flex justify-end space-x-2"><button type="button" onClick={() => setModal({ type: null })} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Register</button></div>
                    </form>
                </div>
            </div>
        );
    };
    
    const TriageModal: React.FC<{ caseData: EmergencyCase }> = ({ caseData }) => {
        const [triageData, setTriageData] = useState({ triageLevel: caseData.triageLevel || TriageLevel.NonUrgent, triageNotes: caseData.triageNotes || '' });
        const [isLoading, setIsLoading] = useState(false);
        const handleAITriage = async () => {
            setIsLoading(true);
            try {
                const suggestion = await getAITriageSuggestion(caseData.chiefComplaint);
                setTriageData({ triageLevel: suggestion.triageLevel, triageNotes: suggestion.triageNotes });
            } catch (error) {
                alert("Failed to get AI suggestion. Please triage manually.");
            } finally {
                setIsLoading(false);
            }
        };
        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            handleUpdateCase({ ...caseData, ...triageData, status: CaseStatus.WaitingRoom });
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                    <h3 className="text-xl font-bold mb-4">Triage: {caseData.patientName}</h3>
                    <p className="text-sm text-gray-700 mb-4"><strong>Chief Complaint:</strong> {caseData.chiefComplaint}</p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                         <div>
                            <button type="button" onClick={handleAITriage} disabled={isLoading} className="w-full flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-green-300">
                                {isLoading ? 'Getting Suggestion...' : 'Get AI Triage Suggestion'}
                            </button>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Triage Level (ESI)</label>
                            <select name="triageLevel" value={triageData.triageLevel} onChange={e => setTriageData({...triageData, triageLevel: parseInt(e.target.value)})} className="mt-1 w-full border rounded-md p-2 bg-white">
                                {Object.values(TriageLevel).filter(v => typeof v === 'number').map(level => <option key={level} value={level}>{TriageLevelDetails[level as TriageLevel].name}</option>)}
                            </select>
                        </div>
                         <div><label className="block text-sm font-medium">Triage Notes</label><textarea name="triageNotes" value={triageData.triageNotes} rows={4} onChange={e => setTriageData({...triageData, triageNotes: e.target.value})} className="mt-1 w-full border rounded-md p-2"></textarea></div>
                        <div className="flex justify-end space-x-2"><button type="button" onClick={() => setModal({ type: null })} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Confirm Triage</button></div>
                    </form>
                </div>
            </div>
        );
    };
    
    const DetailsModal: React.FC<{ caseData: EmergencyCase }> = ({ caseData }) => {
        const [status, setStatus] = useState(caseData.status);
        const [doctor, setDoctor] = useState(caseData.assignedDoctor);
        const [room, setRoom] = useState(caseData.roomNumber);

        const handleDetailsUpdate = () => {
            handleUpdateCase({ ...caseData, status, assignedDoctor: doctor, roomNumber: room });
        };
        
        return (
             <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl h-5/6 flex flex-col">
                    <h3 className="text-xl font-bold mb-4">Case Details: {caseData.patientName}</h3>
                    <div className="overflow-y-auto pr-4 flex-grow">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><strong>Complaint:</strong> {caseData.chiefComplaint}</div>
                            <div><strong>Arrival:</strong> {new Date(caseData.arrivalTime).toLocaleString()}</div>
                            {caseData.triageLevel && <>
                                <div><strong>Triage:</strong> {TriageLevelDetails[caseData.triageLevel].name}</div>
                                <div><strong>Triage Notes:</strong> {caseData.triageNotes}</div>
                            </>}
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-4">
                             <div>
                                <label className="block text-sm font-medium">Status</label>
                                <select value={status} onChange={e => setStatus(e.target.value as CaseStatus)} className="mt-1 w-full border rounded-md p-2 bg-white text-sm">
                                    {Object.values(CaseStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                             </div>
                            <div>
                                <label className="block text-sm font-medium">Assign Doctor</label>
                                <select value={doctor} onChange={e => setDoctor(e.target.value)} className="mt-1 w-full border rounded-md p-2 bg-white text-sm">
                                    <option value="">Unassigned</option>
                                    {doctors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                </select>
                             </div>
                             <div>
                                <label className="block text-sm font-medium">Room Number</label>
                                <input value={room} onChange={e => setRoom(e.target.value)} className="mt-1 w-full border rounded-md p-2 text-sm"/>
                             </div>
                        </div>
                         <div className="mt-4">
                            <h4 className="font-semibold">Clinical Notes</h4>
                            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto bg-gray-50 p-2 rounded">
                                {caseData.notes?.map((note, i) => (
                                    <div key={i} className="text-xs border-b pb-1"><p>{note.note}</p><p className="text-gray-500 text-right">-- {note.author} at {new Date(note.timestamp).toLocaleTimeString()}</p></div>
                                ))}
                                {!caseData.notes && <p className="text-xs text-gray-500">No notes yet.</p>}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4 flex-shrink-0">
                        <button type="button" onClick={() => setModal({ type: null })} className="px-4 py-2 bg-gray-200 rounded-md">Close</button>
                        <button type="button" onClick={handleDetailsUpdate} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Update Case</button>
                    </div>
                </div>
            </div>
        )
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">Emergency Room Dashboard</h2>
                <button onClick={() => setModal({ type: 'register' })} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    + Register New Case
                </button>
            </div>
            <div className="flex-grow overflow-x-auto pb-4">
                <div className="flex space-x-4 min-w-max">
                    {BOARD_COLUMNS.map(col => (
                        <div key={col.status} className="bg-gray-100 rounded-lg p-3 w-72 flex-shrink-0">
                            <h3 className="font-semibold text-gray-700 mb-4 px-1">{col.title} ({cases.filter(c => c.status === col.status).length})</h3>
                            <div className="space-y-3">
                                {cases.filter(c => c.status === col.status).map(c => <CaseCard key={c.id} caseData={c} />)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {modal.type === 'register' && <RegisterModal />}
            {modal.type === 'triage' && modal.data && <TriageModal caseData={modal.data} />}
            {modal.type === 'details' && modal.data && <DetailsModal caseData={modal.data} />}
        </div>
    );
};

export default EmergencyRoom;
