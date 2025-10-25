import React, { useState, useMemo } from 'react';
import { User, Patient, Ward, Bed, BedStatus, EmergencyCase, CaseStatus } from '../types';
import { MOCK_WARDS, MOCK_PATIENTS, MOCK_EMERGENCY_CASES } from '../constants';

interface BedManagementProps {
    user: User;
}

const BedManagement: React.FC<BedManagementProps> = ({ user }) => {
    const [wards, setWards] = useState<Ward[]>(MOCK_WARDS);
    const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
    const [emergencyCases, setEmergencyCases] = useState<EmergencyCase[]>(MOCK_EMERGENCY_CASES);
    
    const [activeWardId, setActiveWardId] = useState<string>(MOCK_WARDS[0]?.id || '');
    const [modal, setModal] = useState<{ type: 'admit' | 'verify' | null, data?: any }>({ type: null });

    const handleStateUpdate = (updatedPatient: Patient, updatedWard: Ward) => {
        setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
        setWards(prev => prev.map(w => w.id === updatedWard.id ? updatedWard : w));
        const erCase = emergencyCases.find(c => c.patientId === updatedPatient.id);
        if (erCase) {
            setEmergencyCases(prev => prev.map(c => c.id === erCase.id ? { ...c, status: CaseStatus.InTreatment } : c));
        }
    };

    const handleAdmitPatient = (patientId: string, bedId: string, wardId: string) => {
        const patient = patients.find(p => p.id === patientId);
        const ward = wards.find(w => w.id === wardId);
        if (!patient || !ward) return;
        
        const bed = ward.beds.find(b => b.id === bedId);
        if (!bed) return;

        const updatedBeds = ward.beds.map(b => 
            b.id === bedId ? { ...b, status: BedStatus.Occupied, patientId: patient.id, patientName: `${patient.firstName} ${patient.lastName}` } : b
        );
        const updatedWard = { ...ward, beds: updatedBeds };
        const updatedPatient = { ...patient, wardId: ward.id, bedNumber: bed.bedNumber, roomNumber: bed.bedNumber };
        
        handleStateUpdate(updatedPatient, updatedWard);
        setModal({ type: null });
    };

    const handleDischargePatient = (bedId: string, wardId: string) => {
        const ward = wards.find(w => w.id === wardId);
        if (!ward) return;
        
        const bed = ward.beds.find(b => b.id === bedId);
        if (!bed || !bed.patientId) return;

        const patientId = bed.patientId;
        const updatedBeds = ward.beds.map(b => b.id === bedId ? { ...b, status: BedStatus.Cleaning, patientId: undefined, patientName: undefined } : b);
        const updatedWard = { ...ward, beds: updatedBeds };
        const patient = patients.find(p => p.id === patientId);

        if (patient) {
            const updatedPatient = { ...patient, wardId: undefined, bedNumber: undefined, roomNumber: 'Discharged' };
            handleStateUpdate(updatedPatient, updatedWard);
        }
    };
    
    const handleUpdateBedStatus = (bedId: string, wardId: string, newStatus: BedStatus) => {
         const ward = wards.find(w => w.id === wardId);
        if (!ward) return;
        
        const updatedBeds = ward.beds.map(b => b.id === bedId ? { ...b, status: newStatus } : b);
        setWards(prev => prev.map(w => w.id === wardId ? { ...w, beds: updatedBeds } : w));
        setModal({ type: null });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex-shrink-0">Admission & Bed Management</h2>
            <div className="flex space-x-2 border-b mb-4 flex-shrink-0">
                {wards.map(ward => (
                    <button
                        key={ward.id}
                        onClick={() => setActiveWardId(ward.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-t-md ${activeWardId === ward.id ? 'bg-gray-100 border-b-2 border-indigo-600' : 'text-gray-500'}`}
                    >
                        {ward.name}
                    </button>
                ))}
            </div>
            <div className="flex-grow overflow-y-auto bg-gray-50 -m-6 p-6">
                <BedBoardView
                    ward={wards.find(w => w.id === activeWardId)!}
                    patients={patients}
                    onAdmitClick={(bedId) => setModal({ type: 'admit', data: { bedId, wardId: activeWardId } })}
                    onDischargeClick={handleDischargePatient}
                    onVerifyClick={(bedId) => setModal({ type: 'verify', data: { bedId, wardId: activeWardId } })}
                />
            </div>
            {modal.type === 'admit' && modal.data && (
                <AdmitPatientModal
                    bedId={modal.data.bedId}
                    wardId={modal.data.wardId}
                    patientsToAdmit={emergencyCases.filter(c => c.status === CaseStatus.Admitted)}
                    onAdmit={handleAdmitPatient}
                    onClose={() => setModal({ type: null })}
                />
            )}
             {modal.type === 'verify' && modal.data && (
                <VerifyStatusModal
                    bed={wards.find(w => w.id === modal.data.wardId)?.beds.find(b => b.id === modal.data.bedId)!}
                    onSave={(newStatus) => handleUpdateBedStatus(modal.data.bedId, modal.data.wardId, newStatus)}
                    onClose={() => setModal({ type: null })}
                />
            )}
        </div>
    );
};

const BedBoardView: React.FC<{
    ward: Ward;
    patients: Patient[];
    onAdmitClick: (bedId: string) => void;
    onDischargeClick: (bedId: string, wardId: string) => void;
    onVerifyClick: (bedId: string) => void;
}> = ({ ward, patients, onAdmitClick, onDischargeClick, onVerifyClick }) => {
    if (!ward) return <p>Ward not found.</p>;
    
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {ward.beds.map(bed => {
                const patient = bed.patientId ? patients.find(p => p.id === bed.patientId) : null;
                return (
                    <BedCard 
                        key={bed.id} 
                        bed={bed} 
                        patient={patient} 
                        onAdmit={() => onAdmitClick(bed.id)} 
                        onDischarge={() => onDischargeClick(bed.id, ward.id)}
                        onVerify={() => onVerifyClick(bed.id)}
                    />
                );
            })}
        </div>
    );
};

const BedCard: React.FC<{
    bed: Bed;
    patient?: Patient | null;
    onAdmit: () => void;
    onDischarge: () => void;
    onVerify: () => void;
}> = ({ bed, patient, onAdmit, onDischarge, onVerify }) => {
    const statusStyles = {
        [BedStatus.Available]: { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-800' },
        [BedStatus.Occupied]: { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-800' },
        [BedStatus.Cleaning]: { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-800' },
    };

    return (
        <div className={`p-3 rounded-lg border-l-4 flex flex-col justify-between ${statusStyles[bed.status].bg} ${statusStyles[bed.status].border}`}>
            <div>
                <div className="flex justify-between items-center">
                    <p className="font-bold text-gray-800">{bed.bedNumber}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyles[bed.status].bg} ${statusStyles[bed.status].text}`}>{bed.status}</span>
                </div>
                <div className="mt-2 text-sm">
                    {bed.status === BedStatus.Occupied && patient ? (
                        <div>
                            <p className="font-semibold truncate">{patient.firstName} {patient.lastName}</p>
                            <p className="text-xs text-gray-600">{patient.age}, {patient.gender}</p>
                            <p className="text-xs text-gray-500 mt-1">Tag ID: {patient.tagId}</p>
                        </div>
                    ) : bed.status === BedStatus.Available ? (
                        <p className="text-green-700">Ready for admission.</p>
                    ) : (
                        <p className="text-yellow-700">Awaiting cleaning.</p>
                    )}
                </div>
            </div>
            <div className="mt-3 pt-2 border-t flex items-center justify-between text-xs">
                 {bed.status === BedStatus.Occupied && <button onClick={onDischarge} className="font-medium text-red-600 hover:underline">Discharge</button>}
                 {bed.status === BedStatus.Available && <button onClick={onAdmit} className="font-medium text-indigo-600 hover:underline">Admit</button>}
                 <button onClick={onVerify} className="font-medium text-gray-500 hover:underline">Verify</button>
            </div>
        </div>
    );
};

const AdmitPatientModal: React.FC<{
    bedId: string;
    wardId: string;
    patientsToAdmit: EmergencyCase[];
    onAdmit: (patientId: string, bedId: string, wardId: string) => void;
    onClose: () => void;
}> = ({ bedId, wardId, patientsToAdmit, onAdmit, onClose }) => {
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">Admit Patient</h3>
                <select value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)} className="w-full p-2 border rounded-md bg-white mb-4">
                    <option value="">Select a patient from ER</option>
                    {patientsToAdmit.map(p => <option key={p.id} value={p.patientId}>{p.patientName} ({p.chiefComplaint})</option>)}
                    {patientsToAdmit.length === 0 && <option disabled>No patients awaiting admission from ER</option>}
                </select>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                    <button onClick={() => onAdmit(selectedPatientId, bedId, wardId)} disabled={!selectedPatientId} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400">Confirm Admission</button>
                </div>
            </div>
        </div>
    );
};

const VerifyStatusModal: React.FC<{
    bed: Bed;
    onSave: (newStatus: BedStatus) => void;
    onClose: () => void;
}> = ({ bed, onSave, onClose }) => {
    const [status, setStatus] = useState<BedStatus>(bed.status);
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">Verify Status for Bed {bed.bedNumber}</h3>
                <p className="text-sm mb-4">System status is <strong>{bed.status}</strong>. Please confirm the actual physical status of the bed.</p>
                 <div className="space-y-2">
                    {Object.values(BedStatus).map(s => (
                        <label key={s} className="flex items-center p-2 border rounded-md has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-400">
                            <input type="radio" name="status" value={s} checked={status === s} onChange={e => setStatus(e.target.value as BedStatus)} className="h-4 w-4 mr-3"/>
                            {s}
                        </label>
                    ))}
                 </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                    <button onClick={() => onSave(status)} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Update Status</button>
                </div>
            </div>
        </div>
    );
}

export default BedManagement;
