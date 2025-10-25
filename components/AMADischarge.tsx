import React, { useState, useMemo } from 'react';
import { AMACase, AMAStatus, User, Patient, Role, Staff } from '../types';
import { MOCK_AMA_CASES, MOCK_PATIENTS, MOCK_STAFF } from '../constants';

interface AMADischargeProps {
    user: User;
}

const AMADischarge: React.FC<AMADischargeProps> = ({ user }) => {
    const [amaCases, setAmaCases] = useState<AMACase[]>(MOCK_AMA_CASES);
    const [modal, setModal] = useState<{ type: 'initiate' | 'sign' | null, data?: AMACase }>({ type: null });
    const [consentChecked, setConsentChecked] = useState(false);

    const doctors = useMemo(() => MOCK_STAFF.filter(s => s.role === Role.Doctor), []);

    const getStatusColor = (status: AMAStatus) => {
        switch (status) {
            case AMAStatus.PendingSignature: return 'bg-yellow-100 text-yellow-800';
            case AMAStatus.Completed: return 'bg-green-100 text-green-800';
            case AMAStatus.Cancelled: return 'bg-red-100 text-red-800';
        }
    };

    const handleInitiateCase = (formData: Omit<AMACase, 'id' | 'status' | 'requestTimestamp'>) => {
        const newCase: AMACase = {
            id: `AMA-${Date.now().toString().slice(-4)}`,
            status: AMAStatus.PendingSignature,
            requestTimestamp: new Date().toISOString(),
            ...formData,
        };
        setAmaCases(prev => [newCase, ...prev].sort((a,b) => new Date(b.requestTimestamp).getTime() - new Date(a.requestTimestamp).getTime()));
        setModal({ type: null });
    };

    const handleSignConsent = (caseId: string) => {
        setAmaCases(prev => prev.map(c => 
            c.id === caseId ? { ...c, status: AMAStatus.Completed, consentTimestamp: new Date().toISOString() } : c
        ));
        setModal({ type: null });
        setConsentChecked(false);
    };

    const InitiateModal: React.FC = () => {
        const initialFormState = {
            patientId: '',
            doctorName: user.role === Role.Doctor ? user.name : '',
            reasonForLeaving: '',
            risksExplained: 'The potential risks of leaving against medical advice, including but not limited to worsening of my condition, permanent disability, or death, have been explained to me. I acknowledge these risks and take full responsibility for my decision.',
            witnessName: '',
        };
        const [formData, setFormData] = useState(initialFormState);
        const selectedPatient = MOCK_PATIENTS.find(p => p.id === formData.patientId);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (!selectedPatient) {
                alert("Please select a valid patient.");
                return;
            }
            handleInitiateCase({ ...formData, patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}` });
        };
        
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-full overflow-y-auto">
                    <h3 className="text-xl font-bold mb-4">Initiate AMA Discharge</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Patient</label>
                                <select name="patientId" value={formData.patientId} onChange={handleChange} required className="mt-1 w-full border rounded-md p-2 bg-white">
                                    <option value="">Select Patient</option>
                                    {MOCK_PATIENTS.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Attending Doctor</label>
                                 <select name="doctorName" value={formData.doctorName} onChange={handleChange} required className="mt-1 w-full border rounded-md p-2 bg-white">
                                    <option value="">Select Doctor</option>
                                    {doctors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Patient's Reason for Leaving</label>
                            <textarea name="reasonForLeaving" value={formData.reasonForLeaving} onChange={handleChange} rows={3} required className="mt-1 w-full border rounded-md p-2"></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Risks Explained to Patient</label>
                            <textarea name="risksExplained" value={formData.risksExplained} onChange={handleChange} rows={4} required className="mt-1 w-full border rounded-md p-2"></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Witness Name</label>
                            <input name="witnessName" value={formData.witnessName} onChange={handleChange} required className="mt-1 w-full border rounded-md p-2"/>
                        </div>
                        <div className="flex justify-end space-x-2 pt-4">
                            <button type="button" onClick={() => setModal({ type: null })} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Initiate & Proceed to Signature</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    const SignatureModal: React.FC<{ caseData: AMACase }> = ({ caseData }) => {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
                    <h3 className="text-xl font-bold mb-2">Patient Consent for AMA Discharge</h3>
                    <p className="text-sm text-gray-600 mb-4">Please review the following with the patient before signing.</p>
                    <div className="p-4 border bg-gray-50 rounded-md space-y-3 max-h-64 overflow-y-auto">
                        <p className="text-sm"><strong>Patient:</strong> {caseData.patientName}</p>
                        <p className="text-sm"><strong>Doctor:</strong> {caseData.doctorName}</p>
                        <div className="text-sm">
                            <strong className="block">Risks Explained:</strong>
                            <p className="pl-2 border-l-2 ml-2 mt-1">{caseData.risksExplained}</p>
                        </div>
                         <div className="text-sm">
                            <strong className="block">Patient's Stated Reason:</strong>
                            <p className="pl-2 border-l-2 ml-2 mt-1">{caseData.reasonForLeaving}</p>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center">
                        <input id="consentCheck" type="checkbox" checked={consentChecked} onChange={() => setConsentChecked(!consentChecked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded"/>
                        <label htmlFor="consentCheck" className="ml-2 block text-sm text-gray-900">
                           I, <strong>{caseData.patientName}</strong>, confirm that I have read and understood the risks of leaving against medical advice.
                        </label>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4 mt-4 border-t">
                        <button type="button" onClick={() => setModal({ type: null })} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                        <button 
                            type="button" 
                            onClick={() => handleSignConsent(caseData.id)}
                            disabled={!consentChecked}
                            className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-green-700"
                        >
                            Sign & Complete Discharge
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">AMA Discharge Workflow</h2>
                <button onClick={() => setModal({ type: 'initiate' })} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    + Initiate AMA
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {amaCases.map(c => (
                            <tr key={c.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{c.patientName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.doctorName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(c.requestTimestamp).toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(c.status)}`}>{c.status}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {c.status === AMAStatus.PendingSignature && (
                                        <button onClick={() => setModal({ type: 'sign', data: c })} className="text-indigo-600 hover:text-indigo-900">Get Signature</button>
                                    )}
                                     {c.status === AMAStatus.Completed && (
                                        <span className="text-gray-400">Completed</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {modal.type === 'initiate' && <InitiateModal />}
            {modal.type === 'sign' && modal.data && <SignatureModal caseData={modal.data} />}
        </div>
    );
};

export default AMADischarge;