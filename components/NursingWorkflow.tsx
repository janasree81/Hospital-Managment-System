import React, { useState, useMemo } from 'react';
import { User, Role, Patient, NursingTask, SBARReport, TaskStatus, TaskPriority } from '../types';
import { MOCK_STAFF, MOCK_NURSING_TASKS, MOCK_PATIENTS } from '../constants';
import { generateSBARSummary } from '../services/geminiService';

interface NursingWorkflowProps {
    user: User;
}

const NursingWorkflow: React.FC<NursingWorkflowProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'roster' | 'tasks' | 'handoff' | 'analytics'>('tasks');

    const TabButton: React.FC<{ tabId: typeof activeTab, children: React.ReactNode }> = ({ tabId, children }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md ${activeTab === tabId ? 'bg-gray-100 border-b-2 border-indigo-600' : 'text-gray-500'}`}
        >
            {children}
        </button>
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">Nursing Deployment & Workflow</h2>
                 <div className="flex space-x-2 border-b">
                    <TabButton tabId="roster">AI Rostering</TabButton>
                    <TabButton tabId="tasks">Task Board</TabButton>
                    <TabButton tabId="handoff">SBAR Handoff</TabButton>
                    <TabButton tabId="analytics">Analytics</TabButton>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto bg-gray-50 -m-6 p-6">
                {activeTab === 'roster' && <RosteringView />}
                {activeTab === 'tasks' && <TaskBoardView />}
                {activeTab === 'handoff' && <SBARHandoffView />}
                {activeTab === 'analytics' && <AnalyticsView />}
            </div>
        </div>
    );
};

const RosteringView = () => {
    const nurses = useMemo(() => MOCK_STAFF.filter(s => s.role === Role.Nurse), []);
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const shifts = ['Morning (7am-3pm)', 'Evening (3pm-11pm)', 'Night (11pm-7am)'];
    
    const initialRoster = () => {
        const roster: Record<string, Record<string, string[]>> = {};
        days.forEach(day => {
            roster[day] = {};
            shifts.forEach(shift => {
                roster[day][shift] = [];
            });
        });
        return roster;
    };
    
    const [roster, setRoster] = useState(initialRoster());

    const handleGenerateRoster = () => {
        const newRoster = initialRoster();
        const availableNurses = [...nurses];
        days.forEach(day => {
            shifts.forEach(shift => {
                // Simple random assignment for simulation
                const numNurses = Math.min(availableNurses.length, Math.floor(Math.random() * 2) + 1); // 1-2 nurses per shift
                for(let i = 0; i < numNurses; i++) {
                    const nurseIndex = Math.floor(Math.random() * availableNurses.length);
                    newRoster[day][shift].push(availableNurses[nurseIndex].name);
                    availableNurses.splice(nurseIndex, 1);
                    if (availableNurses.length === 0) availableNurses.push(...nurses); // a simple reset
                }
            });
        });
        setRoster(newRoster);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Weekly Roster</h3>
                <button onClick={handleGenerateRoster} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Generate with AI</button>
            </div>
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Shift</th>
                            {days.map(day => <th key={day} className="px-4 py-2 text-left text-sm font-semibold text-gray-700">{day}</th>)}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {shifts.map(shift => (
                            <tr key={shift}>
                                <td className="px-4 py-2 font-medium">{shift}</td>
                                {days.map(day => (
                                    <td key={day} className="px-4 py-2 align-top">
                                        <div className="space-y-1">
                                            {roster[day][shift].map((nurse, i) => <div key={i} className="text-xs bg-blue-100 text-blue-800 rounded px-2 py-1">{nurse}</div>)}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </div>
    );
};

const TaskDetailsModal: React.FC<{ task: NursingTask, onClose: () => void }> = ({ task, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold">{task.task}</h3>
                        <p className="text-sm text-gray-500">For: {task.patientName}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                </div>
                <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold text-gray-700">Details:</h4>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{task.details || 'No additional details provided.'}</p>
                </div>
                 <div className="mt-4 pt-4 border-t text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Close</button>
                </div>
            </div>
        </div>
    );
};

const TaskBoardView = () => {
    const nursesOnDuty = useMemo(() => MOCK_STAFF.filter(s => s.role === Role.Nurse && s.status === 'Active'), []);
    
    const [tasks, setTasks] = useState<NursingTask[]>(() => {
        const pendingTasks = MOCK_NURSING_TASKS.filter(t => t.status === 'Pending');
        // Simple round-robin assignment for demo on initial load
        return pendingTasks.map((task, i) => {
            const nurseIndex = i % (nursesOnDuty.length || 1);
            return {
                ...task,
                assignedTo: nursesOnDuty[nurseIndex]?.name || 'Unassigned',
            };
        });
    });

    const [viewingTask, setViewingTask] = useState<NursingTask | null>(null);

    const handleReassignTask = (taskId: string, newNurseName: string) => {
        setTasks(currentTasks => 
            currentTasks.map(task => 
                task.id === taskId ? { ...task, assignedTo: newNurseName } : task
            )
        );
    };

    const tasksByNurse = useMemo(() => {
        const assignments: Record<string, NursingTask[]> = {};
        nursesOnDuty.forEach(n => assignments[n.name] = []);
        assignments['Unassigned'] = []; // Column for any unassigned tasks
        
        tasks.forEach((task) => {
            if (task.assignedTo && assignments[task.assignedTo]) {
                assignments[task.assignedTo].push(task);
            } else {
                assignments['Unassigned'].push(task);
            }
        });
        return assignments;
    }, [nursesOnDuty, tasks]);

    const getAcuityColor = (score?: number) => {
        if (!score) return 'bg-gray-200';
        if (score >= 4) return 'bg-red-500';
        if (score === 3) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getPriorityStyles = (priority: TaskPriority) => {
        switch (priority) {
            case TaskPriority.High: return { border: 'border-red-500', bg: 'bg-red-100', text: 'text-red-800' };
            case TaskPriority.Medium: return { border: 'border-yellow-500', bg: 'bg-yellow-100', text: 'text-yellow-800' };
            case TaskPriority.Low: return { border: 'border-green-500', bg: 'bg-green-100', text: 'text-green-800' };
            default: return { border: 'border-gray-300', bg: 'bg-gray-100', text: 'text-gray-800' };
        }
    };


    return (
        <>
            <div className="flex space-x-4 overflow-x-auto h-full pb-4">
                {nursesOnDuty.map(nurse => (
                    <div key={nurse.id} className="bg-gray-100 rounded-lg p-3 w-72 flex-shrink-0">
                        <h3 className="font-semibold text-gray-800 mb-4">{nurse.name}</h3>
                        <div className="space-y-3">
                            {tasksByNurse[nurse.name].map(task => {
                                const patient = MOCK_PATIENTS.find(p => p.id === task.patientId);
                                const priorityStyles = getPriorityStyles(task.priority);
                                return (
                                    <div 
                                        key={task.id}
                                        onClick={() => setViewingTask(task)}
                                        className={`bg-white p-3 rounded-lg shadow-sm border-l-4 ${priorityStyles.border} cursor-pointer hover:shadow-md`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold text-sm pr-2">{task.task}</p>
                                            <div className={`w-4 h-4 rounded-full flex-shrink-0 ${getAcuityColor(patient?.acuityScore)}`} title={`Acuity: ${patient?.acuityScore}`}></div>
                                        </div>
                                        <p className="text-xs text-gray-600">{patient?.firstName} {patient?.lastName}</p>
                                        <div className="flex justify-between items-center mt-1">
                                            <p className="text-xs text-gray-500">Due: {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityStyles.bg} ${priorityStyles.text}`}>
                                                {task.priority}
                                            </span>
                                        </div>
                                        
                                        <div className="mt-2 pt-2 border-t">
                                            <select
                                                value={task.assignedTo}
                                                onChange={(e) => handleReassignTask(task.id, e.target.value)}
                                                onClick={(e) => e.stopPropagation()} // Prevent modal from opening
                                                className="w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                                aria-label={`Reassign task for ${patient?.firstName} ${patient?.lastName}`}
                                            >
                                                {nursesOnDuty.map(n => (
                                                    <option key={n.id} value={n.name}>{n.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
            {viewingTask && <TaskDetailsModal task={viewingTask} onClose={() => setViewingTask(null)} />}
        </>
    );
};


const SBARHandoffView = () => {
    const wardPatients = useMemo(() => MOCK_PATIENTS.filter(p => p.wardId === 'ward01'), []);
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [report, setReport] = useState<SBARReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        const patient = wardPatients.find(p => p.id === selectedPatientId);
        if (!patient) return;
        setIsLoading(true);
        const patientTasks = MOCK_NURSING_TASKS.filter(t => t.patientId === patient.id);
        const { assessment, recommendation } = await generateSBARSummary(patient, patientTasks);
        
        const newReport: SBARReport = {
            id: `sbar${Date.now()}`,
            patientId: patient.id,
            patientName: `${patient.firstName} ${patient.lastName}`,
            situation: `${patient.firstName} ${patient.lastName} is a ${patient.age}-year-old ${patient.gender.toLowerCase()} admitted for ${patient.chronicConditions[0]}.`,
            background: `Key past medical history includes ${patient.chronicConditions.join(', ')}. No known allergies.`,
            assessment: assessment,
            recommendation: recommendation,
            generatedBy: 'AI Assistant',
            timestamp: new Date().toISOString(),
        };
        setReport(newReport);
        setIsLoading(false);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-4">
             <div className="p-4 bg-gray-100 border rounded-lg flex items-center gap-4">
                <select value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)} className="w-full p-2 border rounded-md bg-white">
                    <option value="">Select a patient for handoff</option>
                    {wardPatients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
                <button onClick={handleGenerate} disabled={!selectedPatientId || isLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400">
                    {isLoading ? 'Generating...' : 'Generate SBAR'}
                </button>
             </div>
             {report && (
                <div className="p-4 border rounded-lg bg-white space-y-3 animate-fade-in">
                    <h3 className="text-xl font-bold text-center">SBAR Handoff: {report.patientName}</h3>
                    <div className="space-y-2">
                        <div><strong className="text-blue-700">S (Situation):</strong><p className="pl-4 text-sm">{report.situation}</p></div>
                        <div><strong className="text-blue-700">B (Background):</strong><p className="pl-4 text-sm">{report.background}</p></div>
                        <div><strong className="text-blue-700">A (Assessment - AI):</strong><p className="pl-4 text-sm">{report.assessment}</p></div>
                        <div><strong className="text-blue-700">R (Recommendation - AI):</strong><p className="pl-4 text-sm">{report.recommendation}</p></div>
                    </div>
                </div>
             )}
        </div>
    );
};

const AnalyticsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border rounded-lg bg-white">
            <h3 className="font-bold mb-2">Task Completion Rate (Today)</h3>
            <div className="w-full bg-gray-200 rounded-full h-4">
                <div className="bg-green-500 h-4 rounded-full text-center text-white text-xs" style={{width: '85%'}}>85%</div>
            </div>
        </div>
        <div className="p-4 border rounded-lg bg-white">
            <h3 className="font-bold mb-2">Shift Coverage</h3>
             <div className="space-y-2">
                <div className="flex items-center"><span className="w-24 text-sm">Morning:</span><div className="w-full bg-gray-200 rounded-full h-4"><div className="bg-blue-500 h-4 rounded-full" style={{width: '100%'}}></div></div></div>
                <div className="flex items-center"><span className="w-24 text-sm">Evening:</span><div className="w-full bg-gray-200 rounded-full h-4"><div className="bg-blue-500 h-4 rounded-full" style={{width: '90%'}}></div></div></div>
                <div className="flex items-center"><span className="w-24 text-sm">Night:</span><div className="w-full bg-gray-200 rounded-full h-4"><div className="bg-blue-500 h-4 rounded-full" style={{width: '75%'}}></div></div></div>
            </div>
        </div>
        <div className="p-4 border rounded-lg bg-white md:col-span-2">
             <h3 className="font-bold mb-2">Patient Acuity Distribution</h3>
             <div className="flex w-full h-8 rounded-md overflow-hidden">
                <div className="bg-green-500 flex items-center justify-center text-white text-sm font-semibold" style={{width: '30%'}} title="Acuity 1-2">30%</div>
                <div className="bg-yellow-500 flex items-center justify-center text-white text-sm font-semibold" style={{width: '50%'}} title="Acuity 3">50%</div>
                <div className="bg-red-500 flex items-center justify-center text-white text-sm font-semibold" style={{width: '20%'}} title="Acuity 4-5">20%</div>
             </div>
        </div>
    </div>
);


export default NursingWorkflow;
