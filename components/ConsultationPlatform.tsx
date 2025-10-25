import React, { useState, useMemo } from 'react';
import { User, Patient, Prescription, ConsultationNote, Referral, Role } from '../types';
import { MOCK_PATIENTS, MOCK_PRESCRIPTIONS, MOCK_DRUGS, MOCK_STAFF, DEPARTMENTS } from '../constants';
import { getPrescriptionSuggestions, PrescriptionAIResponse } from '../services/geminiService';

interface ConsultationPlatformProps {
    user: User;
}

interface NewPrescriptionLine {
    drugId: string;
    drugName: string;
    dosage: string;
    quantity: number | string;
    frequency: string;
    duration: string;
    remark: 'Before Food' | 'After Food' | 'With Food' | 'N/A';
}

const ConsultationPlatform: React.FC<ConsultationPlatformProps> = ({ user }) => {
    const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>(MOCK_PRESCRIPTIONS);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Form states
    const [consultationNote, setConsultationNote] = useState('');
    // FIX: Added state for diagnosis, bloodPressure, and pulseRate.
    const [diagnosis, setDiagnosis] = useState('');
    const [bloodPressure, setBloodPressure] = useState('');
    const [pulseRate, setPulseRate] = useState<number | string>('');
    const [newPrescriptions, setNewPrescriptions] = useState<NewPrescriptionLine[]>([]);
    const [newReferral, setNewReferral] = useState<Omit<Referral, 'id'|'referringDoctor'|'timestamp'|'status'> | null>(null);
    
    const [aiResponse, setAiResponse] = useState<PrescriptionAIResponse | null>(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);

    const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId), [patients, selectedPatientId]);
    
    const patientTimeline = useMemo(() => {
        if (!selectedPatient) return [];
        const notes = selectedPatient.consultationHistory.map(n => ({ ...n, type: 'note' }));
        const patientPrescriptions = prescriptions.filter(p => p.patientId === selectedPatient.id && !p.consultationNoteId);
        const standalonePrescriptions = patientPrescriptions.map(p => ({ ...p, type: 'prescription' }));
        const referrals = selectedPatient.referrals.map(r => ({...r, type: 'referral'}));
        
        return [...notes, ...standalonePrescriptions, ...referrals].sort((a: any,b: any) => new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime());
    }, [selectedPatient, prescriptions]);

    const resetForm = () => {
        setConsultationNote('');
        setDiagnosis('');
        setBloodPressure(selectedPatient?.vitals[0]?.bloodPressure || '');
        setPulseRate(selectedPatient?.vitals[0]?.heartRate || '');
        setNewPrescriptions([]);
        setNewReferral(null);
        setAiResponse(null);
    };
    
    const handleSelectPatient = (patientId: string) => {
        setSelectedPatientId(patientId);
        const patient = MOCK_PATIENTS.find(p => p.id === patientId);
        // FIX: Initialize vitals when a patient is selected.
        setBloodPressure(patient?.vitals[0]?.bloodPressure || '');
        setPulseRate(patient?.vitals[0]?.heartRate || '');
        // Reset the rest of the form
        setConsultationNote('');
        setDiagnosis('');
        setNewPrescriptions([]);
        setNewReferral(null);
        setAiResponse(null);
    };

    const handleAddPrescriptionLine = () => {
        setNewPrescriptions(prev => [...prev, {
            drugId: '', drugName: '', dosage: '', quantity: '',
            frequency: '1-0-1', duration: '7 days', remark: 'After Food'
        }]);
    };

    const handlePrescriptionChange = (index: number, field: keyof NewPrescriptionLine, value: string) => {
        const updated = [...newPrescriptions];
        (updated[index] as any)[field] = value;
        if (field === 'drugId') {
            const drug = MOCK_DRUGS.find(d => d.id === value);
            if (drug) {
                updated[index].drugName = drug.name;
                updated[index].dosage = drug.dosage;
            }
        }
        setNewPrescriptions(updated);
    };

    const handleRemovePrescriptionLine = (index: number) => {
        setNewPrescriptions(prev => prev.filter((_, i) => i !== index));
    };

    const handleGetAISuggestions = async () => {
        if (!consultationNote.trim() || !selectedPatient) return;
        setIsLoadingAI(true);
        setAiResponse(null);
        try {
            const patientPrescriptions = prescriptions.filter(p => p.patientId === selectedPatient.id).map(p => MOCK_DRUGS.find(d => d.name === p.drugName)).filter(Boolean) as any[];
            const response = await getPrescriptionSuggestions(consultationNote, patientPrescriptions);
            setAiResponse(response);
        } catch (error) {
            console.error(error);
            alert("Failed to get AI suggestions.");
        } finally {
            setIsLoadingAI(false);
        }
    };

    const handleSaveConsultation = () => {
        if (!selectedPatient || !consultationNote.trim() || !diagnosis.trim()) {
            alert("Please select a patient, write consultation notes, and provide a diagnosis.");
            return;
        }
        
        const timestamp = new Date().toISOString();
        const prescriptionNo = `Rx-${Date.now()}`;
        
        let newReferralId: string | undefined = undefined;
        if (newReferral && newReferral.referredToDoctor) {
            const finalNewReferral: Referral = { id: `ref${Date.now()}`, referringDoctor: user.name, timestamp: timestamp, status: 'Pending', ...newReferral } as Referral;
            newReferralId = finalNewReferral.id;
             setPatients(prev => prev.map(p => p.id === selectedPatient.id ? { ...p, referrals: [finalNewReferral, ...p.referrals] } : p));
        }

        // FIX line 97: Added missing diagnosis, bloodPressure, and pulseRate properties to align with ConsultationNote type.
        const newNote: ConsultationNote = {
            id: `note${Date.now()}`,
            timestamp,
            doctorName: user.name,
            notes: consultationNote,
            diagnosis,
            bloodPressure,
            pulseRate: Number(pulseRate),
            linkedReferralId: newReferralId,
        };
        
        const finalNewPrescriptions: Prescription[] = newPrescriptions.filter(p=>p.drugId).map((p, i) => ({
            id: `presc${Date.now() + i}`, prescriptionNo, patientId: selectedPatient.id, patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
            doctorName: user.name, drugName: p.drugName, dosage: p.dosage, quantity: Number(p.quantity), frequency: p.frequency,
            duration: p.duration, remark: p.remark, date: timestamp.split('T')[0], status: 'Pending', consultationNoteId: newNote.id,
        }));
        
        newNote.linkedPrescriptionIds = finalNewPrescriptions.map(p => p.id);
        
        setPatients(prev => prev.map(p => p.id === selectedPatient.id ? { ...p, consultationHistory: [newNote, ...p.consultationHistory] } : p));
        if (finalNewPrescriptions.length > 0) setPrescriptions(prev => [...prev, ...finalNewPrescriptions]);
        
        resetForm();
        alert("Consultation saved successfully!");
    };


    return (
        <div className="flex h-[calc(100vh-8rem)] bg-white rounded-lg shadow-md">
            {/* Patient List */}
            <div className="w-1/4 border-r flex flex-col">
                <div className="p-4 border-b"><input type="text" placeholder="Search patients..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border rounded-md"/></div>
                <div className="flex-grow overflow-y-auto">{MOCK_PATIENTS.filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                    <div key={p.id} onClick={() => handleSelectPatient(p.id)} className={`p-4 cursor-pointer hover:bg-indigo-50 ${selectedPatientId === p.id ? 'bg-indigo-100' : ''}`}>
                        <p className="font-semibold">{p.firstName} {p.lastName}</p><p className="text-sm text-gray-500">ID: {p.id}</p>
                    </div>))}
                </div>
            </div>

            {/* Patient History */}
            <div className="w-1/4 border-r flex flex-col">
                <div className="p-4 border-b flex-shrink-0"><h3 className="text-lg font-bold text-gray-800">Patient History</h3></div>
                <div className="flex-grow overflow-y-auto p-4 space-y-4">{!selectedPatient ? (<p className="text-center text-gray-500 mt-10">Select a patient.</p>) : (
                    patientTimeline.map((item: any, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg border text-sm">
                            {item.type === 'note' && <>
                                <p className="font-semibold">Consultation: {new Date(item.timestamp).toLocaleDateString()}</p>
                                <p><strong>Dx:</strong> {item.diagnosis}</p>
                                <p><strong>Vitals:</strong> BP {item.bloodPressure}, HR {item.pulseRate}</p>
                            </>}
                            {item.type === 'prescription' && <>
                                <p className="font-semibold">Rx: {item.drugName} - {new Date(item.date).toLocaleDateString()}</p>
                            </>}
                            {item.type === 'referral' && <>
                                <p className="font-semibold">Referral: {new Date(item.timestamp).toLocaleDateString()}</p>
                                <p>To {item.referredToDoctor} ({item.referredToDepartment})</p>
                            </>}
                        </div>)))}
                </div>
            </div>

            {/* New Consultation */}
            <div className="w-1/2 flex flex-col">
                <div className="p-4 border-b flex-shrink-0"><h3 className="text-lg font-bold text-gray-800">New Consultation</h3></div>
                {!selectedPatient ? (<p className="text-center text-gray-500 mt-10 p-4">Select a patient to start.</p>) : (
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        <div className="p-3 border rounded-lg bg-indigo-50 text-sm">
                            <div className="grid grid-cols-3 gap-x-4">
                                <div><strong>Patient:</strong> {selectedPatient.firstName} {selectedPatient.lastName}</div>
                                <div><strong>ID:</strong> {selectedPatient.id}</div>
                                <div><strong>Age/Gender:</strong> {selectedPatient.age} / {selectedPatient.gender}</div>
                                <div className="col-span-3"><strong>Allergies:</strong> {selectedPatient.allergies.join(', ') || 'N/A'}</div>
                            </div>
                        </div>
                        <div>
                            <label className="font-semibold block text-sm">SOAP Notes</label>
                            <textarea value={consultationNote} onChange={e => setConsultationNote(e.target.value)} rows={5} className="w-full mt-1 border rounded-md p-2 text-sm" placeholder="Subjective, Objective, Assessment, Plan..."></textarea>
                        </div>
                        {/* FIX: Added form inputs for vitals and diagnosis. */}
                        <div className="p-3 border rounded-lg">
                            <h4 className="font-semibold text-sm mb-2">Vitals & Diagnosis</h4>
                            <div className="grid grid-cols-3 gap-2">
                                <div><label className="text-xs">BP</label><input value={bloodPressure} onChange={e => setBloodPressure(e.target.value)} className="w-full text-sm border rounded p-1"/></div>
                                <div><label className="text-xs">Pulse</label><input type="number" value={pulseRate} onChange={e => setPulseRate(e.target.value)} className="w-full text-sm border rounded p-1"/></div>
                                <div className="col-span-3"><label className="text-xs">Primary Diagnosis</label><input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} required className="w-full text-sm border rounded p-1"/></div>
                            </div>
                        </div>
                        <div className="p-3 border rounded-lg">
                            <h4 className="font-semibold text-sm mb-2">E-Prescription</h4>
                            <p className="text-xs text-gray-600 mb-2">Prescriber: <strong>{user.name}</strong></p>
                            <div className="space-y-2">
                                {newPrescriptions.map((p, i) => (
                                    <div key={i} className="p-2 bg-gray-50 border rounded-md grid grid-cols-12 gap-2 text-xs items-center">
                                        <select value={p.drugId} onChange={e => handlePrescriptionChange(i, 'drugId', e.target.value)} className="col-span-4 p-1 border rounded bg-white"><option value="">Select Drug</option>{MOCK_DRUGS.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select>
                                        <input value={p.dosage} readOnly className="col-span-2 p-1 border rounded bg-gray-200" placeholder="Strength"/>
                                        <input type="number" value={p.quantity} onChange={e => handlePrescriptionChange(i, 'quantity', e.target.value)} className="col-span-2 p-1 border rounded" placeholder="Qty"/>
                                        <select value={p.frequency} onChange={e => handlePrescriptionChange(i, 'frequency', e.target.value)} className="col-span-4 p-1 border rounded bg-white"><option>1-0-0</option><option>0-1-0</option><option>0-0-1</option><option>1-1-0</option><option>1-0-1</option><option>0-1-1</option><option>1-1-1</option></select>
                                        <input value={p.duration} onChange={e => handlePrescriptionChange(i, 'duration', e.target.value)} className="col-span-4 p-1 border rounded" placeholder="Duration"/>
                                        <select value={p.remark} onChange={e => handlePrescriptionChange(i, 'remark', e.target.value)} className="col-span-3 p-1 border rounded bg-white"><option>After Food</option><option>Before Food</option><option>With Food</option><option>N/A</option></select>
                                        <button onClick={() => handleRemovePrescriptionLine(i)} className="col-span-1 text-red-500 font-bold text-lg">&times;</button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleAddPrescriptionLine} className="text-sm text-indigo-600 mt-2">+ Add Medication</button>
                        </div>
                        <div className="pt-4"><button onClick={handleSaveConsultation} className="w-full py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-700">Save & Finalize Consultation</button></div>
                    </div>)}
            </div>
        </div>
    );
};

export default ConsultationPlatform;