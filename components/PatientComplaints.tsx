import React, { useState, useMemo } from 'react';
import { Complaint, ComplaintStatus, ComplaintUrgency, User, Role } from '../types';
import { MOCK_COMPLAINTS, MOCK_PATIENTS, MOCK_STAFF } from '../constants';
import { analyzeComplaint } from '../services/geminiService';

interface PatientComplaintsProps {
    user: User;
}

const PatientComplaints: React.FC<PatientComplaintsProps> = ({ user }) => {
    const [complaints, setComplaints] = useState<Complaint[]>(MOCK_COMPLAINTS);
    const [modal, setModal] = useState<{ type: 'new' | 'details', data?: Complaint }>({ type: null });
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    
    const handleFileNewComplaint = async (formData: { patientId: string; complaintText: string }) => {
        setIsLoadingAI(true);
        const patient = MOCK_PATIENTS.find(p => p.id === formData.patientId);
        if (!patient) {
            setIsLoadingAI(false);
            return;
        }

        try {
            const aiAnalysis = await analyzeComplaint(formData.complaintText);
            
            const newComplaint: Complaint = {
                id: `C${Date.now().toString().slice(-4)}`,
                patientId: formData.patientId,
                patientName: `${patient.firstName} ${patient.lastName}`,
                filedBy: user.name,
                complaintText: formData.complaintText,
                dateFiled: new Date().toISOString(),
                status: ComplaintStatus.Open,
                category: aiAnalysis.category,
                urgency: aiAnalysis.urgency,
                assignedTo: MOCK_STAFF.find(s => s.role === Role.Admin)?.name, // Default assign to admin
                actionLog: [{ timestamp: new Date().toISOString(), user: user.name, action: 'Complaint filed and analyzed by AI.' }],
            };
            
            setComplaints(prev => [newComplaint, ...prev]);
            setModal({ type: null });
        } catch(e) {
            alert("AI analysis failed. Please try again.");
        } finally {
            setIsLoadingAI(false);
        }
    };

    const handleUpdateComplaint = (updatedComplaint: Complaint) => {
        setComplaints(prev => prev.map(c => c.id === updatedComplaint.id ? updatedComplaint : c));
        setModal({ type: 'details', data: updatedComplaint }); // Keep modal open with updated data
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">Complaints & Issue Tracker</h2>
                <button onClick={() => setModal({ type: 'new' })} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    + File New Complaint
                </button>
            </div>
            <BoardView complaints={complaints} onSelectComplaint={(data) => setModal({ type: 'details', data})} />
            
            {modal.type === 'new' && <NewComplaintModal user={user} onSubmit={handleFileNewComplaint} onClose={() => setModal({ type: null })} isLoading={isLoadingAI} />}
            {modal.type === 'details' && modal.data && <DetailsModal complaint={modal.data} user={user} onUpdate={handleUpdateComplaint} onClose={() => setModal({ type: null })} />}
        </div>
    );
};

const BoardView: React.FC<{ complaints: Complaint[], onSelectComplaint: (c: Complaint) => void }> = ({ complaints, onSelectComplaint }) => {
    const columns: ComplaintStatus[] = [ComplaintStatus.Open, ComplaintStatus.InProgress, ComplaintStatus.Escalated, ComplaintStatus.Resolved];
    const complaintsByStatus = useMemo(() => {
        const grouped: Record<ComplaintStatus, Complaint[]> = {
            [ComplaintStatus.Open]: [],
            [ComplaintStatus.InProgress]: [],
            [ComplaintStatus.Resolved]: [],
            [ComplaintStatus.Escalated]: [],
        };
        complaints.forEach(c => grouped[c.status].push(c));
        return grouped;
    }, [complaints]);

    return (
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 -m-6 p-6">
            {columns.map(status => (
                <div key={status} className="bg-gray-100 rounded-lg p-3 flex flex-col">
                    <h3 className="font-semibold text-gray-700 mb-4 px-1 text-center">{status} ({complaintsByStatus[status].length})</h3>
                    <div className="space-y-3 overflow-y-auto h-full">
                        {complaintsByStatus[status].map(c => <ComplaintCard key={c.id} complaint={c} onClick={() => onSelectComplaint(c)} />)}
                    </div>
                </div>
            ))}
        </div>
    );
};

const ComplaintCard: React.FC<{ complaint: Complaint, onClick: () => void }> = ({ complaint, onClick }) => {
    const urgencyColor = complaint.urgency === ComplaintUrgency.High ? 'border-red-500' : complaint.urgency === ComplaintUrgency.Medium ? 'border-yellow-500' : 'border-gray-300';
    return (
        <div onClick={onClick} className={`p-3 bg-white rounded-md shadow-sm border-l-4 ${urgencyColor} cursor-pointer hover:shadow-md`}>
            <p className="font-semibold text-sm">{complaint.patientName}</p>
            <p className="text-xs text-gray-600 mt-1">{complaint.complaintText.substring(0, 80)}...</p>
            <div className="mt-2 flex justify-between items-center">
                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">{complaint.category}</span>
                <span className="text-xs text-gray-500">{new Date(complaint.dateFiled).toLocaleDateString()}</span>
            </div>
        </div>
    );
};

const NewComplaintModal: React.FC<{ user: User, onSubmit: (data: any) => void, onClose: () => void, isLoading: boolean }> = ({ user, onSubmit, onClose, isLoading }) => {
    const [formData, setFormData] = useState({ patientId: '', complaintText: '' });
    
    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">AI is analyzing and categorizing the complaint...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg space-y-4">
                <h3 className="text-xl font-bold">File New Complaint</h3>
                <div>
                    <label className="text-sm">Patient</label>
                    <select value={formData.patientId} onChange={e => setFormData({...formData, patientId: e.target.value})} required className="mt-1 w-full border rounded p-2 bg-white">
                        <option value="">Select a patient</option>
                        {MOCK_PATIENTS.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-sm">Complaint Details</label>
                    <textarea value={formData.complaintText} onChange={e => setFormData({...formData, complaintText: e.target.value})} required rows={5} className="mt-1 w-full border rounded p-2" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Submit for AI Analysis</button>
                </div>
            </form>
        </div>
    );
};

const DetailsModal: React.FC<{ complaint: Complaint, user: User, onUpdate: (data: Complaint) => void, onClose: () => void }> = ({ complaint, user, onUpdate, onClose }) => {
    const [status, setStatus] = useState(complaint.status);
    const [assignedTo, setAssignedTo] = useState(complaint.assignedTo || '');
    const [resolutionNotes, setResolutionNotes] = useState(complaint.resolutionNotes || '');

    const handleSave = () => {
        const updatedComplaint = { ...complaint, status, assignedTo, resolutionNotes };
        const actionLog: string[] = [];
        if(status !== complaint.status) actionLog.push(`Status changed to ${status}.`);
        if(assignedTo !== complaint.assignedTo) actionLog.push(`Assigned to ${assignedTo}.`);
        if(resolutionNotes !== complaint.resolutionNotes) actionLog.push(`Resolution notes updated.`);

        if (actionLog.length > 0) {
            updatedComplaint.actionLog.push({
                timestamp: new Date().toISOString(),
                user: user.name,
                action: actionLog.join(' '),
            });
        }
        onUpdate(updatedComplaint);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-full flex flex-col">
                <div className="p-6 border-b">
                    <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold">Complaint Details: {complaint.id}</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                        <span>Patient: <strong>{complaint.patientName}</strong></span> | <span>Filed: {new Date(complaint.dateFiled).toLocaleString()}</span>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto p-6 space-y-4">
                    <div className="p-4 bg-gray-50 rounded border text-sm">
                        <p className="mb-2"><strong>Complaint:</strong> "{complaint.complaintText}"</p>
                        <div className="flex gap-4">
                            <span><strong>AI Category:</strong> {complaint.category}</span>
                            <span><strong>AI Urgency:</strong> {complaint.urgency}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm">Status</label>
                            <select value={status} onChange={e => setStatus(e.target.value as ComplaintStatus)} className="mt-1 w-full border rounded p-2 bg-white">
                                {Object.values(ComplaintStatus).map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm">Assign To</label>
                            <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="mt-1 w-full border rounded p-2 bg-white">
                                <option value="">Unassigned</option>
                                {MOCK_STAFF.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm">Resolution Notes</label>
                        <textarea value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} rows={4} className="mt-1 w-full border rounded p-2" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm">Action Log</h4>
                        <div className="mt-2 space-y-2 text-xs border rounded p-2 bg-gray-50 max-h-32 overflow-y-auto">
                            {[...complaint.actionLog].reverse().map(log => (
                                <div key={log.timestamp} className="border-b pb-1">
                                    <p>{log.action}</p>
                                    <p className="text-gray-500 text-right">-- {log.user} at {new Date(log.timestamp).toLocaleTimeString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default PatientComplaints;