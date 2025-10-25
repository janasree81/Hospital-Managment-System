import React, { useState, useMemo } from 'react';
import { MedicoLegalCase, MLCStatus, AuditLogEntry, NotificationLogEntry, User } from '../types';
import { MOCK_MLC_CASES, MOCK_EMERGENCY_CASES } from '../constants';

interface MedicoLegalCaseManagerProps {
    user: User;
}

const MedicoLegalCaseManager: React.FC<MedicoLegalCaseManagerProps> = ({ user }) => {
    const [mlcCases, setMlcCases] = useState<MedicoLegalCase[]>(MOCK_MLC_CASES);
    const [selectedCase, setSelectedCase] = useState<MedicoLegalCase | null>(null);
    const [isRegistering, setIsRegistering] = useState(false);

    const getStatusColor = (status: MLCStatus) => {
        switch (status) {
            case MLCStatus.Pending: return 'bg-yellow-100 text-yellow-800';
            case MLCStatus.ReportGenerated: return 'bg-blue-100 text-blue-800';
            case MLCStatus.AuthoritiesNotified: return 'bg-purple-100 text-purple-800';
            case MLCStatus.Closed: return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleUpdateCase = (caseId: string, updates: Partial<MedicoLegalCase>, auditAction: string) => {
        const newAuditEntry: AuditLogEntry = {
            timestamp: new Date().toISOString(),
            user: user.name,
            action: auditAction,
        };
        setMlcCases(prev => prev.map(c => 
            c.id === caseId 
            ? { ...c, ...updates, auditLog: [...c.auditLog, newAuditEntry] } 
            : c
        ));
        // Also update the selected case if it's open
        if(selectedCase && selectedCase.id === caseId) {
             setSelectedCase(prev => prev ? { ...prev, ...updates, auditLog: [...prev.auditLog, newAuditEntry] } : null);
        }
    };
    
    const handleRegisterNewCase = (newCaseData: Omit<MedicoLegalCase, 'id' | 'status' | 'registeredBy' | 'registrationTimestamp' | 'notificationLog' | 'auditLog'>) => {
        const timestamp = new Date().toISOString();
        const newCase: MedicoLegalCase = {
            id: `MLC-${Date.now().toString().slice(-4)}`,
            status: MLCStatus.Pending,
            registeredBy: user.name,
            registrationTimestamp: timestamp,
            notificationLog: [],
            auditLog: [{ timestamp, user: user.name, action: 'MLC Registered' }],
            ...newCaseData
        };
        setMlcCases(prev => [newCase, ...prev]);
        setIsRegistering(false);
    };

    const RegisterModal: React.FC = () => {
        const [erCaseId, setErCaseId] = useState('');
        const initialFormState = {
            patientName: '', patientAge: 0, patientGender: 'Unknown' as MedicoLegalCase['patientGender'],
            incidentDetails: '', incidentTimestamp: new Date().toISOString().slice(0,16), firNumber: '',
            policeStation: '', injuriesObserved: '', evidenceCollected: ''
        };
        const [formData, setFormData] = useState(initialFormState);

        const handleErCaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            const caseId = e.target.value;
            setErCaseId(caseId);
            const erCase = MOCK_EMERGENCY_CASES.find(c => c.id === caseId);
            if (erCase) {
                setFormData(prev => ({
                    ...prev,
                    patientName: erCase.patientName,
                    patientAge: erCase.age,
                    patientGender: erCase.gender,
                    incidentDetails: erCase.chiefComplaint,
                }));
            } else {
                setFormData(initialFormState);
            }
        };
        
        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            handleRegisterNewCase({
                ...formData,
                patientAge: Number(formData.patientAge),
                evidenceCollected: formData.evidenceCollected.split(',').map(s => s.trim()).filter(Boolean),
                emergencyCaseId: erCaseId || undefined,
            });
        };

        return (
             <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-full overflow-y-auto">
                    <h3 className="text-xl font-bold mb-4">Register New Medico-Legal Case</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Link to ER Case (Optional)</label>
                            <select onChange={handleErCaseChange} value={erCaseId} className="mt-1 w-full border rounded-md p-2 bg-white">
                                <option value="">Select an ER Case</option>
                                {MOCK_EMERGENCY_CASES.map(c => <option key={c.id} value={c.id}>{c.patientName} - {c.chiefComplaint}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div><label className="block text-sm font-medium">Patient Name</label><input name="patientName" value={formData.patientName} onChange={handleChange} required className="mt-1 w-full border rounded-md p-2"/></div>
                             <div><label className="block text-sm font-medium">Age</label><input name="patientAge" type="number" value={formData.patientAge} onChange={handleChange} required className="mt-1 w-full border rounded-md p-2"/></div>
                             <div><label className="block text-sm font-medium">Gender</label><select name="patientGender" value={formData.patientGender} onChange={handleChange} className="mt-1 w-full border rounded-md p-2 bg-white"><option>Male</option><option>Female</option><option>Other</option><option>Unknown</option></select></div>
                        </div>
                         <div><label className="block text-sm font-medium">Incident Details</label><textarea name="incidentDetails" value={formData.incidentDetails} onChange={handleChange} rows={2} required className="mt-1 w-full border rounded-md p-2"></textarea></div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><label className="block text-sm font-medium">FIR Number</label><input name="firNumber" value={formData.firNumber} onChange={handleChange} className="mt-1 w-full border rounded-md p-2"/></div>
                            <div><label className="block text-sm font-medium">Police Station</label><input name="policeStation" value={formData.policeStation} onChange={handleChange} className="mt-1 w-full border rounded-md p-2"/></div>
                            <div><label className="block text-sm font-medium">Incident Date/Time</label><input name="incidentTimestamp" type="datetime-local" value={formData.incidentTimestamp} onChange={handleChange} required className="mt-1 w-full border rounded-md p-2"/></div>
                         </div>
                         <div><label className="block text-sm font-medium">Injuries Observed</label><textarea name="injuriesObserved" value={formData.injuriesObserved} onChange={handleChange} rows={2} required className="mt-1 w-full border rounded-md p-2"></textarea></div>
                         <div><label className="block text-sm font-medium">Evidence Collected (comma-separated)</label><input name="evidenceCollected" value={formData.evidenceCollected} onChange={handleChange} className="mt-1 w-full border rounded-md p-2"/></div>

                        <div className="flex justify-end space-x-2 pt-4"><button type="button" onClick={() => setIsRegistering(false)} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Register Case</button></div>
                    </form>
                </div>
            </div>
        );
    };

    const DetailsModal: React.FC<{ caseData: MedicoLegalCase, onClose: () => void }> = ({ caseData, onClose }) => {
        const handleNotify = () => {
             const newNotification: NotificationLogEntry = {
                timestamp: new Date().toISOString(),
                authority: caseData.policeStation || 'Relevant Authorities',
                method: 'Portal',
                notifiedBy: user.name,
            };
            handleUpdateCase(caseData.id, { 
                status: MLCStatus.AuthoritiesNotified,
                notificationLog: [...caseData.notificationLog, newNotification],
            }, `Notified ${newNotification.authority}`);
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-full flex flex-col">
                    <div className="flex justify-between items-start flex-shrink-0">
                        <div>
                            <h3 className="text-xl font-bold">MLC Details: {caseData.id}</h3>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(caseData.status)}`}>{caseData.status}</span>
                        </div>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
                    </div>
                    <div className="mt-4 flex-grow overflow-y-auto pr-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg border">
                                    <h4 className="font-bold text-gray-800 mb-2">Case Summary</h4>
                                    <p className="text-sm"><strong>Patient:</strong> {caseData.patientName}, {caseData.patientAge} ({caseData.patientGender})</p>
                                    <p className="text-sm"><strong>Incident:</strong> {caseData.incidentDetails}</p>
                                    <p className="text-sm"><strong>When:</strong> {new Date(caseData.incidentTimestamp).toLocaleString()}</p>
                                    <p className="text-sm"><strong>Injuries:</strong> {caseData.injuriesObserved}</p>
                                    {caseData.firNumber && <p className="text-sm"><strong>FIR:</strong> {caseData.firNumber} at {caseData.policeStation}</p>}
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg border">
                                    <h4 className="font-bold text-gray-800 mb-2">Evidence Log</h4>
                                    <ul className="list-disc list-inside text-sm">{caseData.evidenceCollected.map((e,i) => <li key={i}>{e}</li>)}</ul>
                                </div>
                                 <div className="p-4 bg-gray-50 rounded-lg border">
                                    <h4 className="font-bold text-gray-800 mb-2">Secure Actions</h4>
                                    <div className="space-y-2">
                                        <button 
                                            onClick={() => handleUpdateCase(caseData.id, { status: MLCStatus.ReportGenerated, reportGeneratedTimestamp: new Date().toISOString() }, 'MLC Report Generated')}
                                            disabled={caseData.status !== MLCStatus.Pending}
                                            className="w-full px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        >Generate MLC Report</button>
                                        <button 
                                            onClick={handleNotify}
                                            disabled={caseData.status !== MLCStatus.ReportGenerated}
                                            className="w-full px-3 py-2 text-sm text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        >Notify Authorities</button>
                                    </div>
                                </div>
                            </div>
                            {/* Right Column */}
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg border h-full flex flex-col">
                                    <h4 className="font-bold text-gray-800 mb-2">Secure Audit Trail</h4>
                                    <div className="space-y-2 text-xs overflow-y-auto flex-grow">
                                        {caseData.auditLog.slice().reverse().map((log, i) => (
                                            <div key={i} className="border-b pb-1">
                                                <p className="font-semibold">{log.action}</p>
                                                <p className="text-gray-500">{log.user} at {new Date(log.timestamp).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Medico-Legal Case Registry</h2>
                <button onClick={() => setIsRegistering(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    + Register New MLC
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Case ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Incident Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered By</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {mlcCases.map(c => (
                            <tr key={c.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-600">{c.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{c.patientName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(c.incidentTimestamp).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.registeredBy}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(c.status)}`}>{c.status}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => setSelectedCase(c)} className="text-indigo-600 hover:text-indigo-900">View Details</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {isRegistering && <RegisterModal />}
            {selectedCase && <DetailsModal caseData={selectedCase} onClose={() => setSelectedCase(null)} />}
        </div>
    );
};

export default MedicoLegalCaseManager;
