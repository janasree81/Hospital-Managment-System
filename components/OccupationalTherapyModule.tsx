
import React, { useState, useMemo } from 'react';
import { User, Patient, OTGoal, OTEquipment, OTActivity, OTSessionNote, OTAssessment, Role } from '../types';
import { MOCK_PATIENTS, MOCK_OT_ACTIVITIES, MOCK_OT_EQUIPMENT } from '../constants';

interface OccupationalTherapyModuleProps {
    user: User;
}

const PlusCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const PencilIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 19.5a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
);

const GoalModal: React.FC<{
    goal: OTGoal | null;
    patient: Patient;
    onSave: (patientWithUpdatedGoal: Patient) => void;
    onClose: () => void;
}> = ({ goal, patient, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        description: goal?.description || '',
        targetDate: goal?.targetDate || new Date().toISOString().split('T')[0],
        status: goal?.status || 'In Progress',
        progress: goal?.progress || 0,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) || 0 : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        let updatedGoals: OTGoal[];
        
        if (goal) { // Editing existing goal
            updatedGoals = (patient.otGoals || []).map(g => 
                g.id === goal.id ? { ...g, ...formData, status: formData.status as OTGoal['status'] } : g
            );
        } else { // Adding new goal
            const newGoal: OTGoal = {
                id: `goal${Date.now()}`,
                ...formData,
                status: formData.status as OTGoal['status'],
            };
            updatedGoals = [...(patient.otGoals || []), newGoal];
        }

        const updatedPatient: Patient = {
            ...patient,
            otGoals: updatedGoals,
        };
        
        onSave(updatedPatient);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg space-y-4">
                <h3 className="text-xl font-bold">{goal ? 'Edit Goal' : 'Add New Goal'} for {patient.firstName} {patient.lastName}</h3>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Goal Description</label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} required rows={4} className="mt-1 w-full border rounded-md p-2"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700">Target Date</label>
                        <input type="date" name="targetDate" id="targetDate" value={formData.targetDate} onChange={handleChange} required className="mt-1 w-full border rounded-md p-2"/>
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                        <select name="status" id="status" value={formData.status} onChange={handleChange} className="mt-1 w-full border rounded-md p-2 bg-white">
                            <option>In Progress</option>
                            <option>Achieved</option>
                            <option>Revised</option>
                            <option>On Hold</option>
                        </select>
                    </div>
                </div>
                 <div>
                    <label htmlFor="progress" className="block text-sm font-medium text-gray-700">Progress ({formData.progress}%)</label>
                    <input type="range" name="progress" id="progress" min="0" max="100" value={formData.progress} onChange={handleChange} className="mt-1 w-full"/>
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Save Goal</button>
                </div>
            </form>
        </div>
    );
};


const OccupationalTherapyModule: React.FC<OccupationalTherapyModuleProps> = ({ user }) => {
    const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
    const [equipment, setEquipment] = useState<OTEquipment[]>(MOCK_OT_EQUIPMENT);
    const [activities] = useState<OTActivity[]>(MOCK_OT_ACTIVITIES);

    const otPatients = useMemo(() => patients.filter(p => p.otGoals || p.otAssessments), [patients]);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(otPatients[0]?.id || null);
    const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'equipment'>('overview');
    
    const [modal, setModal] = useState<{ type: 'goal' | 'session' | 'assessment' | 'assignEquipment' | null, data?: any }>({ type: null });

    const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId), [patients, selectedPatientId]);

    const handleSavePatientData = (updatedPatient: Patient) => {
        setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
        setModal({ type: null });
    };

    const handleAssignEquipment = (patientId: string, equipmentId: string) => {
        const equipmentItem = equipment.find(e => e.id === equipmentId);
        const patientItem = patients.find(p => p.id === patientId);
        if (!equipmentItem || !patientItem) return;

        // Update equipment status
        setEquipment(prev => prev.map(e => e.id === equipmentId ? { ...e, status: 'In Use', patientId, patientName: `${patientItem.firstName} ${patientItem.lastName}` } : e));
        
        // Update patient's assigned equipment
        const updatedPatient = {
            ...patientItem,
            assignedEquipment: [
                ...(patientItem.assignedEquipment || []),
                { equipmentId, name: equipmentItem.name, assignedDate: new Date().toISOString() }
            ]
        };
        handleSavePatientData(updatedPatient);
    };

    const GoalProgressBar: React.FC<{ goal: OTGoal }> = ({ goal }) => (
        <div className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <p className="font-semibold text-gray-800 pr-2">{goal.description}</p>
                {user.role === Role.OccupationalTherapist && (
                     <button onClick={() => setModal({ type: 'goal', data: goal })} className="text-gray-400 hover:text-indigo-600 flex-shrink-0">
                        <PencilIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
                <span>Progress</span>
                <span className="font-medium">{goal.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${goal.progress}%` }}></div>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
                 <span>Status: {goal.status}</span>
                <span>Target: {goal.targetDate}</span>
            </div>
        </div>
    );
    
    // Main Content Panes
    const PatientOverview = () => !selectedPatient ? null : (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Patient Goals</h3>
                {user.role === Role.OccupationalTherapist && <button onClick={() => setModal({ type: 'goal', data: null })} className="flex items-center gap-1 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700"><PlusCircleIcon className="w-5 h-5"/> Add Goal</button>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedPatient.otGoals?.map(goal => <GoalProgressBar key={goal.id} goal={goal} />)}
                {(!selectedPatient.otGoals || selectedPatient.otGoals.length === 0) && <p className="text-gray-500 md:col-span-2 text-center py-4">No goals set for this patient.</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800">Assessments</h3>
                        {user.role === Role.OccupationalTherapist && <button onClick={() => setModal({ type: 'assessment', data: null })} className="text-sm text-indigo-600 hover:underline">New Assessment</button>}
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                        {selectedPatient.otAssessments?.map(asm => (
                             <div key={asm.id} className="p-3 bg-white border rounded-lg">
                                <p className="font-semibold">{asm.type} - {new Date(asm.date).toLocaleDateString()}</p>
                                <p className="text-xs text-gray-500">By {asm.therapistName}</p>
                                <p className="text-sm mt-1">{asm.summary}</p>
                             </div>
                        ))}
                         {(!selectedPatient.otAssessments || selectedPatient.otAssessments.length === 0) && <p className="text-gray-500">No assessments found.</p>}
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800">Session Notes</h3>
                        {user.role === Role.OccupationalTherapist && <button onClick={() => setModal({ type: 'session', data: null })} className="text-sm text-indigo-600 hover:underline">Log Session</button>}
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                        {selectedPatient.otSessionNotes?.map(note => (
                            <div key={note.id} className="p-3 bg-white border rounded-lg">
                                <p className="font-semibold">{new Date(note.date).toLocaleDateString()}</p>
                                <p className="text-sm mt-1"><strong>Observations:</strong> {note.observations}</p>
                            </div>
                        ))}
                         {(!selectedPatient.otSessionNotes || selectedPatient.otSessionNotes.length === 0) && <p className="text-gray-500">No session notes found.</p>}
                    </div>
                </div>
            </div>
        </div>
    );

    const ActivityLibrary = () => (
        <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Activity Library</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activities.map(activity => (
                    <div key={activity.id} className="p-4 bg-white border rounded-lg flex flex-col">
                        <div className="w-full h-32 bg-gray-200 rounded-md flex items-center justify-center mb-3">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h4 className="font-semibold">{activity.name}</h4>
                        <p className="text-xs bg-indigo-100 text-indigo-700 inline-block px-2 py-0.5 rounded-full my-1">{activity.category}</p>
                        <p className="text-sm text-gray-600 flex-grow">{activity.description}</p>
                        <button onClick={() => alert('This would add the activity to a treatment plan.')} className="mt-3 w-full text-sm bg-gray-200 text-gray-800 px-3 py-1.5 rounded-md hover:bg-gray-300">Prescribe Activity</button>
                    </div>
                ))}
            </div>
        </div>
    );
    
    const EquipmentManagement = () => (
         <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Equipment Management</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipment</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {equipment.map(item => (
                            <tr key={item.id}>
                                <td className="px-6 py-4 font-medium">{item.name}</td>
                                <td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'Available' ? 'bg-green-100 text-green-800' : item.status === 'In Use' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{item.status}</span></td>
                                <td className="px-6 py-4">{item.patientName || 'N/A'}</td>
                                <td className="px-6 py-4 text-right">
                                    {item.status === 'Available' && user.role === Role.OccupationalTherapist && (
                                        <button onClick={() => setModal({ type: 'assignEquipment', data: item })} className="text-sm text-indigo-600 hover:underline">Assign</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
    
    return (
        <div className="flex h-full bg-gray-100">
            {/* Patient List Sidebar */}
            <div className="w-1/4 bg-white border-r flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-bold">OT Patients</h2>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {otPatients.map(p => (
                        <div key={p.id} onClick={() => setSelectedPatientId(p.id)} className={`p-4 cursor-pointer hover:bg-indigo-50 ${selectedPatientId === p.id ? 'bg-indigo-100 border-r-4 border-indigo-500' : ''}`}>
                            <p className="font-semibold">{p.firstName} {p.lastName}</p>
                            <p className="text-sm text-gray-500">Room: {p.roomNumber}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="w-3/4 flex flex-col">
                <div className="p-4 border-b bg-white flex justify-between items-center">
                    <div className="flex space-x-2">
                        <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>Patient Overview</button>
                        <button onClick={() => setActiveTab('activities')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'activities' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>Activity Library</button>
                        <button onClick={() => setActiveTab('equipment')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'equipment' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>Equipment</button>
                    </div>
                     {selectedPatient && <div className="text-right"><p className="font-bold">{selectedPatient.firstName} {selectedPatient.lastName}</p><p className="text-sm text-gray-500">{selectedPatient.age}, {selectedPatient.gender}</p></div>}
                </div>
                <main className="flex-grow overflow-y-auto p-6">
                     {!selectedPatientId ? (
                        <div className="text-center py-20 text-gray-500">Please select a patient to view their OT dashboard.</div>
                    ) : (
                        <>
                            {activeTab === 'overview' && <PatientOverview />}
                            {activeTab === 'activities' && <ActivityLibrary />}
                            {activeTab === 'equipment' && <EquipmentManagement />}
                        </>
                    )}
                </main>
            </div>
            {modal.type === 'goal' && selectedPatient && (
                <GoalModal 
                    goal={modal.data} 
                    patient={selectedPatient} 
                    onSave={handleSavePatientData} 
                    onClose={() => setModal({ type: null })} 
                />
            )}
        </div>
    );
};

export default OccupationalTherapyModule;
