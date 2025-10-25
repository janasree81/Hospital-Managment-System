import React, { useState, useMemo } from 'react';
import { BroughtDeadCase, BroughtDeadStatus, AuditLogEntry, User, Role } from '../types';
import { MOCK_BROUGHT_DEAD_CASES, MOCK_STAFF } from '../constants';

interface BroughtDeadRecordsProps {
    user: User;
}

const BroughtDeadRecords: React.FC<BroughtDeadRecordsProps> = ({ user }) => {
    const [cases, setCases] = useState<BroughtDeadCase[]>(MOCK_BROUGHT_DEAD_CASES);
    const [selectedCase, setSelectedCase] = useState<BroughtDeadCase | null>(null);
    const [isRegistering, setIsRegistering] = useState(false);
    
    const doctors = useMemo(() => MOCK_STAFF.filter(s => s.role === Role.Doctor), []);

    const getStatusColor = (status: BroughtDeadStatus) => {
        switch (status) {
            case BroughtDeadStatus.PendingPaperwork: return 'bg-yellow-100 text-yellow-800';
            case BroughtDeadStatus.Completed: return 'bg-green-100 text-green-800';
            case BroughtDeadStatus.AuthoritiesNotified: return 'bg-purple-100 text-purple-800';
        }
    };

    const handleUpdateCase = (caseId: string, updates: Partial<BroughtDeadCase>, auditAction: string) => {
        const newAuditEntry: AuditLogEntry = {
            timestamp: new Date().toISOString(),
            user: user.name,
            action: auditAction,
        };
        const updateFn = (c: BroughtDeadCase) => 
            c.id === caseId 
            ? { ...c, ...updates, auditLog: [...c.auditLog, newAuditEntry] } 
            : c;

        setCases(prev => prev.map(updateFn));
        if (selectedCase && selectedCase.id === caseId) {
            setSelectedCase(prev => prev ? updateFn(prev) : null);
        }
    };

    const handleRegisterNewCase = (newCaseData: Omit<BroughtDeadCase, 'id' | 'status' | 'auditLog'>) => {
        const timestamp = new Date().toISOString();
        const newCase: BroughtDeadCase = {
            id: `BD-${Date.now().toString().slice(-4)}`,
            status: BroughtDeadStatus.PendingPaperwork,
            auditLog: [{ timestamp, user: user.name, action: 'Case Recorded' }],
            ...newCaseData
        };
        setCases(prev => [newCase, ...prev]);
        setIsRegistering(false);
    };

    const RegisterModal: React.FC = () => {
        const initialFormState = {
            patientIdentifier: '', estimatedAge: 0, gender: 'Unknown' as BroughtDeadCase['gender'],
            broughtBy: '', arrivalTimestamp: new Date().toISOString().slice(0, 16), declaredBy: user.name,
            preliminaryAssessment: '', probableCauseOfDeath: '', isMLC: false, belongings: ''
        };
        const [formData, setFormData] = useState(initialFormState);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            const { name, value, type } = e.target;
            const isCheckbox = (e.target as HTMLInputElement).type === 'checkbox';
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: isCheckbox ? checked : value }));
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            handleRegisterNewCase({
                ...formData,
                estimatedAge: Number(formData.estimatedAge),
                belongings: formData.belongings.split(',').map(s => s.trim()).filter(Boolean),
            });
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-full overflow-y-auto">
                    <h3 className="text-xl font-bold mb-4">Record New Brought-Dead Case</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><label className="block text-sm font-medium">Patient Identifier</label><input name="patientIdentifier" value={formData.patientIdentifier} onChange={handleChange} required className="mt-1 w-full border rounded-md p-2" placeholder="e.g., Unidentified Male"/></div>
                            <div><label className="block text-sm font-medium">Estimated Age</label><input name="estimatedAge" type="number" value={formData.estimatedAge} onChange={handleChange} required className="mt-1 w-full border rounded-md p-2"/></div>
                            <div><label className="block text-sm font-medium">Gender</label><select name="gender" value={formData.gender} onChange={handleChange} className="mt-1 w-full border rounded-md p-2 bg-white"><option>Male</option><option>Female</option><option>Other</option><option>Unknown</option></select></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium">Brought By</label><input name="broughtBy" value={formData.broughtBy} onChange={handleChange} required className="mt-1 w-full border rounded-md p-2" placeholder="e.g., Police, Family"/></div>
                            <div><label className="block text-sm font-medium">Arrival Date/Time</label><input name="arrivalTimestamp" type="datetime-local" value={formData.arrivalTimestamp} onChange={handleChange} required className="mt-1 w-full border rounded-md p-2"/></div>
                        </div>
                        <div><label className="block text-sm font-medium">Preliminary Assessment</label><textarea name="preliminaryAssessment" value={formData.preliminaryAssessment} onChange={handleChange} rows={3} required className="mt-1 w-full border rounded-md p-2"></textarea></div>
                        <div><label className="block text-sm font-medium">Probable Cause of Death</label><input name="probableCauseOfDeath" value={formData.probableCauseOfDeath} onChange={handleChange} required className="mt-1 w-full border rounded-md p-2"/></div>
                        <div><label className="block text-sm font-medium">Belongings / Evidence (comma-separated)</label><input name="belongings" value={formData.belongings} onChange={handleChange} className="mt-1 w-full border rounded-md p-2"/></div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center"><input id="isMLC" name="isMLC" type="checkbox" checked={formData.isMLC} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded"/><label htmlFor="isMLC" className="ml-2 block text-sm text-gray-900">Flag as Medico-Legal Case (MLC)</label></div>
                            <div>
                                <label className="block text-sm font-medium">Declared By</label>
                                <select name="declaredBy" value={formData.declaredBy} onChange={handleChange} required className="mt-1 w-full border rounded-md p-2 bg-white">
                                    {doctors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2 pt-4"><button type="button" onClick={() => setIsRegistering(false)} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Record Case</button></div>
                    </form>
                </div>
            </div>
        );
    };

    const DetailsModal: React.FC<{ caseData: BroughtDeadCase, onClose: () => void }> = ({ caseData, onClose }) => {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-full flex flex-col">
                    <div className="flex justify-between items-start flex-shrink-0">
                        <div>
                            <h3 className="text-xl font-bold">Case Details: {caseData.id}</h3>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(caseData.status)}`}>{caseData.status}</span>
                        </div>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                    </div>
                    <div className="mt-4 flex-grow overflow-y-auto pr-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg border">
                                    <h4 className="font-bold text-gray-800 mb-2">Case Information</h4>
                                    <p className="text-sm"><strong>Identifier:</strong> {caseData.patientIdentifier}, ~{caseData.estimatedAge} years ({caseData.gender})</p>
                                    <p className="text-sm"><strong>Brought By:</strong> {caseData.broughtBy}</p>
                                    <p className="text-sm"><strong>Arrival:</strong> {new Date(caseData.arrivalTimestamp).toLocaleString()}</p>
                                    <p className="text-sm"><strong>Declared By:</strong> {caseData.declaredBy}</p>
                                    {caseData.isMLC && <p className="text-sm font-bold text-red-600">This is a Medico-Legal Case.</p>}
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg border">
                                    <h4 className="font-bold text-gray-800 mb-2">Medical Details</h4>
                                    <p className="text-sm"><strong>Assessment:</strong> {caseData.preliminaryAssessment}</p>
                                    <p className="text-sm"><strong>Probable Cause of Death:</strong> {caseData.probableCauseOfDeath}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg border">
                                    <h4 className="font-bold text-gray-800 mb-2">Belongings / Evidence</h4>
                                    <ul className="list-disc list-inside text-sm">{caseData.belongings.map((e, i) => <li key={i}>{e}</li>)}</ul>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg border">
                                    <h4 className="font-bold text-gray-800 mb-2">Secure Actions</h4>
                                    <div className="space-y-2">
                                        <button onClick={() => handleUpdateCase(caseData.id, { status: BroughtDeadStatus.Completed }, 'Death Report Generated')} disabled={caseData.status !== BroughtDeadStatus.PendingPaperwork} className="w-full px-3 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400">Generate Death Report</button>
                                        <button onClick={() => handleUpdateCase(caseData.id, { status: BroughtDeadStatus.AuthoritiesNotified }, 'Notified Relevant Authorities')} disabled={caseData.status !== BroughtDeadStatus.Completed} className="w-full px-3 py-2 text-sm text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-gray-400">Notify Authorities</button>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg border h-full flex flex-col mt-4 md:mt-0">
                                <h4 className="font-bold text-gray-800 mb-2">Secure Audit Trail</h4>
                                <div className="space-y-2 text-xs overflow-y-auto flex-grow">
                                    {caseData.auditLog.slice().reverse().map((log, i) => (
                                        <div key={i} className="border-b pb-1"><p className="font-semibold">{log.action}</p><p className="text-gray-500">{log.user} at {new Date(log.timestamp).toLocaleString()}</p></div>
                                    ))}
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
                <h2 className="text-2xl font-bold text-gray-800">Brought Dead Records</h2>
                <button onClick={() => setIsRegistering(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    + Record New Case
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Case ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient Identifier</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Declared On</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Declared By</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {cases.map(c => (
                            <tr key={c.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-600">{c.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{c.patientIdentifier}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(c.arrivalTimestamp).toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.declaredBy}</td>
                                <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(c.status)}`}>{c.status}</span></td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><button onClick={() => setSelectedCase(c)} className="text-indigo-600 hover:text-indigo-900">View Details</button></td>
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

export default BroughtDeadRecords;
