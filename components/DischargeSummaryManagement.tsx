import React, { useState, useMemo } from 'react';
import { User, Patient, DischargeSummary, DischargeSummaryStatus, DischargeMedication } from '../types';
// FIX: Added missing import for MOCK_DISCHARGE_SUMMARIES.
import { MOCK_PATIENTS, MOCK_DISCHARGE_SUMMARIES } from '../constants';
import { generateDischargeSummary } from '../services/geminiService';

const DischargeSummaryManagement: React.FC<{ user: User }> = ({ user }) => {
    const [summaries, setSummaries] = useState<DischargeSummary[]>(MOCK_DISCHARGE_SUMMARIES);
    // Only show patients who are in a ward, as they are eligible for discharge
    const dischargeablePatients = useMemo(() => MOCK_PATIENTS.filter(p => p.wardId), []);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    
    const [activeSummary, setActiveSummary] = useState<DischargeSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const selectedPatient = useMemo(() => MOCK_PATIENTS.find(p => p.id === selectedPatientId), [selectedPatientId]);
    
    const handleSelectPatient = (patientId: string) => {
        setSelectedPatientId(patientId);
        const existingSummary = summaries.find(s => s.patientId === patientId);
        setActiveSummary(existingSummary || null);
    };

    const handleGenerateSummary = async () => {
        if (!selectedPatient) return;
        setIsLoading(true);
        try {
            const generatedData = await generateDischargeSummary(selectedPatient);
            const newSummary: DischargeSummary = {
                id: `ds-${Date.now()}`,
                patientId: selectedPatient.id,
                patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
                status: DischargeSummaryStatus.Draft,
                lastUpdated: new Date().toISOString(),
                ...generatedData,
            };
            setActiveSummary(newSummary);
        } catch (error) {
            console.error(error);
            alert("AI generation failed.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveSummary = (isFinalizing: boolean) => {
        if (!activeSummary) return;
        
        const updatedSummary = { 
            ...activeSummary, 
            status: isFinalizing ? DischargeSummaryStatus.Finalized : activeSummary.status,
            lastUpdated: new Date().toISOString(),
        };

        setSummaries(prev => {
            const exists = prev.some(s => s.id === updatedSummary.id);
            if (exists) {
                return prev.map(s => s.id === updatedSummary.id ? updatedSummary : s);
            }
            return [updatedSummary, ...prev];
        });
        
        setActiveSummary(updatedSummary); // Keep the view updated, especially the status
        alert(`Summary ${isFinalizing ? 'Finalized' : 'Draft Saved'}.`);
    };

    const handleFieldChange = (field: keyof DischargeSummary, value: any) => {
        if (activeSummary) {
            setActiveSummary({ ...activeSummary, [field]: value });
        }
    };
    
    const handleMedicationChange = (index: number, field: keyof DischargeMedication, value: string) => {
        if (activeSummary) {
            const updatedMeds = [...activeSummary.medicationsOnDischarge];
            updatedMeds[index] = { ...updatedMeds[index], [field]: value };
            handleFieldChange('medicationsOnDischarge', updatedMeds);
        }
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-white rounded-lg shadow-md">
            {/* Patient List */}
            <div className="w-1/4 border-r flex flex-col">
                <div className="p-4 border-b"><h3 className="text-lg font-bold">In-Ward Patients</h3></div>
                <div className="flex-grow overflow-y-auto">
                    {dischargeablePatients.map(p => (
                        <div key={p.id} onClick={() => handleSelectPatient(p.id)} className={`p-4 cursor-pointer hover:bg-indigo-50 ${selectedPatientId === p.id ? 'bg-indigo-100' : ''}`}>
                            <p className="font-semibold">{p.firstName} {p.lastName}</p>
                            <p className="text-sm text-gray-500">Bed: {p.bedNumber}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Workspace */}
            <div className="w-3/4 flex flex-col">
                <div className="p-4 border-b flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-800">Discharge Summary Workspace</h2>
                </div>
                <div className="flex-grow overflow-y-auto p-6 bg-gray-50">
                    {!selectedPatient ? (
                        <div className="text-center text-gray-500 mt-10">Select a patient to begin.</div>
                    ) : isLoading ? (
                        <div className="text-center text-gray-500 mt-10">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className="mt-4">AI is generating summary...</p>
                        </div>
                    ) : !activeSummary ? (
                        <div className="text-center mt-10">
                            <h3 className="text-lg font-semibold">{selectedPatient.firstName} {selectedPatient.lastName}</h3>
                            <p className="text-gray-600 mb-4">No summary started for this patient.</p>
                            <button onClick={handleGenerateSummary} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">Generate Summary with AI</button>
                        </div>
                    ) : (
                        <SummaryForm 
                            summary={activeSummary} 
                            onFieldChange={handleFieldChange} 
                            onMedicationChange={handleMedicationChange}
                            onSave={handleSaveSummary}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

// Sub-component for the form
const SummaryForm: React.FC<{
    summary: DischargeSummary;
    onFieldChange: (field: keyof DischargeSummary, value: any) => void;
    onMedicationChange: (index: number, field: keyof DischargeMedication, value: string) => void;
    onSave: (isFinalizing: boolean) => void;
}> = ({ summary, onFieldChange, onMedicationChange, onSave }) => {
    const isFinalized = summary.status === DischargeSummaryStatus.Finalized;
    
    const FormField: React.FC<{label: string, field: keyof DischargeSummary, rows?: number}> = ({label, field, rows=3}) => (
        <div>
            <label className="block text-sm font-semibold text-gray-700">{label}</label>
            <textarea 
                value={summary[field] as string}
                onChange={e => onFieldChange(field, e.target.value)}
                readOnly={isFinalized}
                rows={rows}
                className="mt-1 w-full p-2 border rounded-md bg-white read-only:bg-gray-100"
            />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Summary for {summary.patientName}</h3>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${isFinalized ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{summary.status}</span>
            </div>

            <FormField label="Brief History & Reason for Admission" field="briefHistoryAndReasonForAdmission" rows={4} />
            <FormField label="Course in Hospital" field="courseInHospital" rows={8} />
            <FormField label="Condition at Discharge" field="conditionAtDischarge" />

            <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Medications on Discharge</h4>
                <div className="space-y-2">
                    {summary.medicationsOnDischarge.map((med, index) => (
                        <div key={index} className="grid grid-cols-3 gap-2">
                            <input value={med.name} onChange={e => onMedicationChange(index, 'name', e.target.value)} readOnly={isFinalized} placeholder="Name" className="p-2 border rounded-md read-only:bg-gray-100"/>
                            <input value={med.dosage} onChange={e => onMedicationChange(index, 'dosage', e.target.value)} readOnly={isFinalized} placeholder="Dosage" className="p-2 border rounded-md read-only:bg-gray-100"/>
                            <input value={med.frequency} onChange={e => onMedicationChange(index, 'frequency', e.target.value)} readOnly={isFinalized} placeholder="Frequency" className="p-2 border rounded-md read-only:bg-gray-100"/>
                        </div>
                    ))}
                </div>
            </div>
            
            <FormField label="Follow-up Instructions" field="followUpInstructions" rows={4} />

            <div className="pt-4 border-t flex justify-end gap-3">
                {isFinalized ? (
                     <>
                        <button onClick={() => alert("Printing PDF...")} className="px-4 py-2 bg-gray-600 text-white rounded-md">Export PDF</button>
                        <button onClick={() => alert("Showing QR Code...")} className="px-4 py-2 bg-gray-600 text-white rounded-md">Meds QR</button>
                        <button onClick={() => alert("Creating FHIR Bundle...")} className="px-4 py-2 bg-gray-600 text-white rounded-md">FHIR Bundle</button>
                     </>
                ) : (
                    <>
                        <button onClick={() => onSave(false)} className="px-4 py-2 bg-blue-600 text-white rounded-md">Save Draft</button>
                        <button onClick={() => onSave(true)} className="px-4 py-2 bg-green-600 text-white rounded-md">Finalize Summary</button>
                    </>
                )}
            </div>
        </div>
    );
};

export default DischargeSummaryManagement;