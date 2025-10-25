import React, { useState, useMemo } from 'react';
import { User, Patient, LabTest, ICUNote, SOFAScore } from '../types';
import { MOCK_PATIENTS, MOCK_LAB_TESTS, MOCK_STAFF } from '../constants';

interface ICUDigitalMonitoringProps {
    user: User;
}

const ICUDigitalMonitoring: React.FC<ICUDigitalMonitoringProps> = ({ user }) => {
    const icuPatients = useMemo(() => MOCK_PATIENTS.filter(p => p.icuBedNumber), []);
    const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(icuPatients[0]?.id || null);

    const [modal, setModal] = useState<{ type: 'note' | 'handoff', data?: any }>({ type: null });

    const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId), [patients, selectedPatientId]);
    const patientLabs = useMemo(() => MOCK_LAB_TESTS.filter(l => l.patientId === selectedPatientId), [selectedPatientId]);
    
    const handleSaveNote = (note: Omit<ICUNote, 'id' | 'timestamp' | 'author'>) => {
        if (!selectedPatient) return;
        const newNote: ICUNote = {
            id: `icunote${Date.now()}`,
            timestamp: new Date().toISOString(),
            author: user.name,
            ...note,
        };
        setPatients(prev => prev.map(p => p.id === selectedPatientId ? {...p, icuNotes: [newNote, ...(p.icuNotes || [])]} : p));
        setModal({type: null});
    };

    const getVitalColor = (key: string, value: number) => {
        if ((key === 'heartRate' && (value < 60 || value > 120)) ||
            (key === 'map' && (value < 65)) ||
            (key === 'oxygenSaturation' && value < 92)) {
            return 'text-red-500 font-bold';
        }
        return 'text-gray-900';
    };
    
    // Derived alerts based on current patient data
    const criticalAlerts = useMemo(() => {
        const alerts = [];
        const latestVitals = selectedPatient?.vitals[0];
        if (latestVitals?.map && latestVitals.map < 65) alerts.push('Hypotension (MAP < 65)');
        if (latestVitals?.oxygenSaturation && latestVitals.oxygenSaturation < 90) alerts.push('Severe Hypoxia (SpO2 < 90%)');
        const abg = patientLabs.find(l => l.testName.includes('ABG'));
        const ph = abg?.results.find(r => r.name === 'pH');
        if (ph && parseFloat(ph.value) < 7.35) alerts.push('Acidosis (pH < 7.35)');
        return alerts;
    }, [selectedPatient, patientLabs]);


    const VitalsCard: React.FC<{patient: Patient}> = ({patient}) => (
        <div className="bg-white p-4 rounded-lg shadow">
            <h4 className="font-bold text-gray-800 mb-2">Vitals</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {patient.vitals[0] && Object.entries(patient.vitals[0]).map(([key, value]) => {
                    if (key === 'date') return null;
                    const formattedKey = key.replace(/([A-Z])/g, ' $1').toUpperCase();
                    return (
                        <div key={key}>
                            <p className="text-gray-500">{formattedKey}</p>
                            <p className={`text-lg font-semibold ${getVitalColor(key, value as number)}`}>{value}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
    
    const VentilatorCard: React.FC<{patient: Patient}> = ({patient}) => patient.ventilatorSettings ? (
         <div className="bg-white p-4 rounded-lg shadow">
            <h4 className="font-bold text-gray-800 mb-2">Ventilator</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {Object.entries(patient.ventilatorSettings).map(([key, value]) => (
                     <div key={key}>
                        <p className="text-gray-500">{key.toUpperCase()}</p>
                        <p className="text-lg font-semibold text-gray-900">{value}{key === 'fio2' ? '%' : ''}</p>
                    </div>
                ))}
            </div>
        </div>
    ) : null;

    const InfusionsCard: React.FC<{patient: Patient}> = ({patient}) => patient.activeInfusions ? (
         <div className="bg-white p-4 rounded-lg shadow">
            <h4 className="font-bold text-gray-800 mb-2">Active Infusions</h4>
            <ul className="space-y-2">
                {patient.activeInfusions.map(inf => (
                    <li key={inf.id} className="text-sm">
                        <p className="font-semibold">{inf.drugName}</p>
                        <p className="text-gray-600">{inf.rate} {inf.unit}</p>
                    </li>
                ))}
            </ul>
        </div>
    ) : null;

    const LabsCard: React.FC<{labs: LabTest[]}> = ({labs}) => (
        <div className="bg-white p-4 rounded-lg shadow">
            <h4 className="font-bold text-gray-800 mb-2">Recent Labs</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto text-sm">
                {labs.map(lab => (
                    <div key={lab.id} className="p-2 bg-gray-50 rounded">
                        <p className="font-semibold">{lab.testName}</p>
                        {lab.results.filter(r => r.isAbnormal).map(res => <p key={res.name} className="text-red-600">{res.name}: {res.value} {res.unit}</p>)}
                    </div>
                ))}
            </div>
        </div>
    );
    
    const SOFACard: React.FC<{patient: Patient}> = ({patient}) => {
        const score = patient.sofaScoreHistory?.[0]?.score;
        return score ? (
            <div className="bg-white p-4 rounded-lg shadow text-center">
                <h4 className="font-bold text-gray-800">SOFA Score</h4>
                <p className="text-5xl font-bold text-indigo-600 my-2">{score.totalScore}</p>
                <p className="text-xs text-gray-500">Updated: {patient.sofaScoreHistory?.[0]?.date}</p>
            </div>
        ) : null;
    };
    
    const AlertsCard: React.FC<{alerts: string[]}> = ({alerts}) => (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow">
             <h4 className="font-bold mb-2">Critical Alerts</h4>
             <ul className="list-disc list-inside text-sm font-semibold">
                {alerts.map((alert, i) => <li key={i}>{alert}</li>)}
             </ul>
        </div>
    );
    
    const NotesModal: React.FC = () => {
        const [noteType, setNoteType] = useState<'SOAP' | 'System Review' | 'Event'>('SOAP');
        const [text, setText] = useState('');
        const SOAP_TEMPLATE = "S: \nO: \nA: \nP: ";

        const handleSave = () => {
            handleSaveNote({ noteType, text });
        };
        
        return (
             <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                 <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-full flex flex-col">
                    <h3 className="text-xl font-bold mb-4">New ICU Note for {selectedPatient?.firstName} {selectedPatient?.lastName}</h3>
                    <div className="flex gap-2 mb-4">
                        <select value={noteType} onChange={e => setNoteType(e.target.value as any)} className="border rounded-md p-2 bg-white">
                            <option>SOAP</option><option>System Review</option><option>Event</option>
                        </select>
                        <button onClick={() => setText(SOAP_TEMPLATE)} className="text-sm px-3 py-1 bg-gray-200 rounded-md">Use SOAP Template</button>
                    </div>
                    <textarea value={text} onChange={e => setText(e.target.value)} rows={15} className="w-full border rounded-md p-2 flex-grow"></textarea>
                    <div className="flex justify-end space-x-2 pt-4"><button onClick={() => setModal({type: null})} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button><button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Save Note</button></div>
                 </div>
             </div>
        )
    };
    
    const HandoffModal: React.FC = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-full overflow-y-auto">
                <h3 className="text-xl font-bold mb-4 text-center">ICU Handoff Report</h3>
                <div className="space-y-3 text-sm border-t pt-4">
                    <p><strong>Patient:</strong> {selectedPatient?.firstName} {selectedPatient?.lastName}, {selectedPatient?.age}, {selectedPatient?.gender}</p>
                    <p><strong>Diagnosis:</strong> {selectedPatient?.primaryDiagnosis}</p>
                    <p><strong>Vitals:</strong> BP {selectedPatient?.vitals[0]?.bloodPressure}, HR {selectedPatient?.vitals[0]?.heartRate}, SpO2 {selectedPatient?.vitals[0]?.oxygenSaturation}%</p>
                    <p><strong>Ventilator:</strong> {selectedPatient?.ventilatorSettings?.mode}, FiO2 {selectedPatient?.ventilatorSettings?.fio2}%, PEEP {selectedPatient?.ventilatorSettings?.peep}</p>
                    <p><strong>Infusions:</strong> {selectedPatient?.activeInfusions?.map(i => i.drugName).join(', ')}</p>
                    <p><strong>Key Events/Concerns:</strong></p>
                    <p className="p-2 bg-gray-100 rounded border">{criticalAlerts.join('. ')}</p>
                    <p><strong>To-Do:</strong></p>
                    <p className="p-2 bg-gray-100 rounded border">Follow up on morning labs. Titrate pressors to MAP &gt; 65. Assess for sedation holiday.</p>
                </div>
                <div className="flex justify-end space-x-2 pt-4 mt-4 border-t"><button onClick={() => setModal({type: null})} className="px-4 py-2 bg-gray-200 rounded-md">Close</button><button onClick={() => alert("Printing...")} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Print</button></div>
            </div>
        </div>
    );


    return (
        <div className="flex h-[calc(100vh-8rem)] bg-gray-100">
            {/* Patient List */}
            <div className="w-1/4 bg-white border-r flex flex-col">
                <div className="p-4 border-b"><h2 className="text-lg font-bold">ICU Patients</h2></div>
                <div className="flex-grow overflow-y-auto">
                    {icuPatients.map(p => (
                        <div key={p.id} onClick={() => setSelectedPatientId(p.id)} className={`p-4 cursor-pointer hover:bg-indigo-50 ${selectedPatientId === p.id ? 'bg-indigo-100 border-r-4 border-indigo-500' : ''}`}>
                            <p className="font-semibold">{p.firstName} {p.lastName}</p>
                            <p className="text-sm text-gray-500">Bed: {p.icuBedNumber}</p>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Main Dashboard */}
            <main className="w-3/4 flex flex-col">
                {!selectedPatient ? (
                    <div className="flex items-center justify-center h-full text-gray-500">Select a patient to view their ICU dashboard.</div>
                ) : (
                    <>
                    <div className="p-4 border-b bg-white flex justify-between items-center flex-shrink-0">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{selectedPatient.firstName} {selectedPatient.lastName}</h2>
                            <p className="text-sm text-gray-600">{selectedPatient.age}, {selectedPatient.gender} | Bed: {selectedPatient.icuBedNumber} | Dx: {selectedPatient.primaryDiagnosis}</p>
                        </div>
                        <div className="flex items-center gap-2">
                             <button onClick={() => setModal({type: 'handoff'})} className="text-sm px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Handoff</button>
                             <button onClick={() => setModal({type: 'note'})} className="text-sm px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">+ New Note</button>
                        </div>
                    </div>
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        {criticalAlerts.length > 0 && <AlertsCard alerts={criticalAlerts} />}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-2 space-y-4">
                                <VitalsCard patient={selectedPatient} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <VentilatorCard patient={selectedPatient} />
                                    <InfusionsCard patient={selectedPatient} />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <SOFACard patient={selectedPatient} />
                                <LabsCard labs={patientLabs} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Progress Notes</h3>
                             <div className="bg-white p-4 rounded-lg shadow max-h-64 overflow-y-auto space-y-3">
                                {selectedPatient.icuNotes?.map(note => (
                                    <div key={note.id} className="text-sm border-b pb-2">
                                        <p className="font-semibold">{note.noteType} Note by {note.author}</p>
                                        <p className="text-xs text-gray-500 mb-1">{new Date(note.timestamp).toLocaleString()}</p>
                                        <p className="whitespace-pre-wrap">{note.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    </>
                )}
            </main>
            {modal.type === 'note' && <NotesModal />}
            {modal.type === 'handoff' && <HandoffModal />}
        </div>
    );
};

export default ICUDigitalMonitoring;