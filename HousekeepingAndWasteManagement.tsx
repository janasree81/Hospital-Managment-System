import React, { useState, useMemo } from 'react';
import { User, HousekeepingTask, HousekeepingStaff, BioWasteLog, HousekeepingTaskStatus, HousekeepingChecklistItem, BioWasteCategory } from '../types';
// FIX: Added missing imports.
import { MOCK_HOUSEKEEPING_TASKS, MOCK_HOUSEKEEPING_STAFF, MOCK_BIOWASTE_LOGS } from '../constants';
import { getAIHousekeepingSchedule, getBioWasteAnalysis } from '../services/geminiService';

const HousekeepingAndWasteManagement: React.FC<{ user: User }> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'waste'>('dashboard');

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
                <h2 className="text-2xl font-bold text-gray-800">Housekeeping & Waste Mgmt</h2>
                <div className="flex space-x-2 border-b">
                    <TabButton tabId="dashboard">Dashboard</TabButton>
                    <TabButton tabId="tasks">Housekeeping Tasks</TabButton>
                    <TabButton tabId="waste">Waste Management</TabButton>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto bg-gray-50 -m-6 p-6">
                {activeTab === 'dashboard' && <DashboardView />}
                {activeTab === 'tasks' && <TasksView user={user} />}
                {activeTab === 'waste' && <WasteView user={user} />}
            </div>
        </div>
    );
};

const DashboardView = () => {
    const taskStats = useMemo(() => {
        const total = MOCK_HOUSEKEEPING_TASKS.length;
        const pending = MOCK_HOUSEKEEPING_TASKS.filter(t => t.status === HousekeepingTaskStatus.Pending).length;
        return { total, pending, completed: total - pending };
    }, []);

    const staffStats = useMemo(() => {
        return {
            idle: MOCK_HOUSEKEEPING_STAFF.filter(s => s.status === 'Idle').length,
            onTask: MOCK_HOUSEKEEPING_STAFF.filter(s => s.status === 'On Task').length,
        };
    }, []);

    const wasteStats = useMemo(() => {
        const stats: Record<string, number> = {};
        MOCK_BIOWASTE_LOGS.forEach(log => {
            stats[log.category] = (stats[log.category] || 0) + log.weightKg;
        });
        return stats;
    }, []);
    const totalWaste = Object.values(wasteStats).reduce((sum, val) => sum + val, 0);

    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-lg border text-center"><p className="text-gray-600">Pending Tasks</p><p className="text-3xl font-bold text-yellow-600">{taskStats.pending}</p></div>
                <div className="p-4 bg-white rounded-lg border text-center"><p className="text-gray-600">Idle Staff</p><p className="text-3xl font-bold text-green-600">{staffStats.idle}</p></div>
                <div className="p-4 bg-white rounded-lg border text-center"><p className="text-gray-600">Staff on Task</p><p className="text-3xl font-bold text-blue-600">{staffStats.onTask}</p></div>
            </div>
            <div className="p-4 bg-white rounded-lg border">
                <h3 className="font-bold mb-2">Bio-Waste Collected (kg)</h3>
                <div className="flex items-end h-40 space-x-2">
                    {Object.entries(wasteStats).map(([category, weight]) => (
                        <div key={category} className="flex-1 flex flex-col items-center justify-end">
                            <div className="w-full bg-indigo-500 rounded-t-lg" style={{ height: `${(weight / (totalWaste || 1)) * 100}%` }} title={`${category}: ${weight.toFixed(1)} kg`}></div>
                            <p className="text-xs mt-1">{category}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const TasksView: React.FC<{user: User}> = ({user}) => {
    const [tasks, setTasks] = useState<HousekeepingTask[]>(MOCK_HOUSEKEEPING_TASKS);
    const [staff, setStaff] = useState<HousekeepingStaff[]>(MOCK_HOUSEKEEPING_STAFF);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [viewingTask, setViewingTask] = useState<HousekeepingTask | null>(null);

    const handleGenerateSchedule = async () => {
        setIsLoadingAI(true);
        try {
            const updatedTasks = await getAIHousekeepingSchedule(tasks, staff);
            setTasks(updatedTasks);
            // Also update staff status based on new assignments
            const assignedStaffNames = new Set(updatedTasks.filter(t => t.assignedTo).map(t => t.assignedTo));
            setStaff(prevStaff => prevStaff.map(s => assignedStaffNames.has(s.name) ? { ...s, status: 'On Task' } : { ...s, status: 'Idle'}));
        } catch (error) {
            alert('Failed to generate AI schedule.');
        } finally {
            setIsLoadingAI(false);
        }
    };
    
    const handleUpdateTask = (updatedTask: HousekeepingTask) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
        setViewingTask(updatedTask);
    };

    const columns: HousekeepingTaskStatus[] = [HousekeepingTaskStatus.Pending, HousekeepingTaskStatus.InProgress, HousekeepingTaskStatus.Completed];
    const tasksByStatus = useMemo(() => {
        const grouped: Record<HousekeepingTaskStatus, HousekeepingTask[]> = {
            [HousekeepingTaskStatus.Pending]: [],
            [HousekeepingTaskStatus.InProgress]: [],
            [HousekeepingTaskStatus.Completed]: [],
            [HousekeepingTaskStatus.Blocked]: [],
        };
        tasks.forEach(task => grouped[task.status].push(task));
        return grouped;
    }, [tasks]);

    return (
        <div className="h-full flex flex-col">
            <div className="mb-4"><button onClick={handleGenerateSchedule} disabled={isLoadingAI} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400">{isLoadingAI ? 'Scheduling...' : 'Generate AI Schedule'}</button></div>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
                {columns.map(status => (
                    <div key={status} className="bg-gray-100 rounded-lg p-3">
                        <h3 className="font-semibold text-gray-800 mb-4 text-center">{status}</h3>
                        <div className="space-y-3 h-[calc(100vh-22rem)] overflow-y-auto">
                            {tasksByStatus[status].map(task => <TaskCard key={task.id} task={task} onClick={() => setViewingTask(task)} />)}
                        </div>
                    </div>
                ))}
            </div>
            {viewingTask && <TaskDetailsModal task={viewingTask} onUpdate={handleUpdateTask} onClose={() => setViewingTask(null)} />}
        </div>
    );
};

const TaskCard: React.FC<{ task: HousekeepingTask, onClick: () => void }> = ({ task, onClick }) => {
    const priorityColor = task.priority === 'High' ? 'border-red-500' : task.priority === 'Medium' ? 'border-yellow-500' : 'border-gray-300';
    return (
        <div onClick={onClick} className={`p-3 bg-white rounded-md shadow-sm border-l-4 ${priorityColor} cursor-pointer`}>
            <p className="font-semibold text-sm">{task.task}</p>
            <p className="text-xs text-gray-600">{task.location}</p>
            {task.assignedTo && <p className="text-xs mt-1">Assigned to: <strong>{task.assignedTo}</strong></p>}
        </div>
    );
};

const TaskDetailsModal: React.FC<{ task: HousekeepingTask, onUpdate: (task: HousekeepingTask) => void, onClose: () => void }> = ({ task, onUpdate, onClose }) => {
    const handleChecklistChange = (itemId: string, isCompleted: boolean) => {
        const updatedChecklist = task.checklist.map(item => item.id === itemId ? { ...item, isCompleted } : item);
        onUpdate({ ...task, checklist: updatedChecklist });
    };
    const handleStatusChange = (status: HousekeepingTaskStatus) => {
        onUpdate({ ...task, status });
        if(status === HousekeepingTaskStatus.Completed) onClose();
    }
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                <h3 className="text-xl font-bold mb-2">{task.task}</h3>
                <p className="text-sm text-gray-600 mb-4">{task.location}</p>
                <div className="space-y-2">{task.checklist.map(item => (
                    <label key={item.id} className="flex items-center"><input type="checkbox" checked={item.isCompleted} onChange={e => handleChecklistChange(item.id, e.target.checked)} className="h-4 w-4 mr-2"/>{item.text}</label>
                ))}</div>
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <select value={task.status} onChange={e => handleStatusChange(e.target.value as HousekeepingTaskStatus)} className="p-2 border rounded-md bg-white text-sm">
                        {Object.values(HousekeepingTaskStatus).map(s => <option key={s}>{s}</option>)}
                    </select>
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Close</button>
                </div>
            </div>
        </div>
    );
};

const WasteView: React.FC<{user: User}> = ({ user }) => {
    const [logs, setLogs] = useState<BioWasteLog[]>(MOCK_BIOWASTE_LOGS);
    const [showForm, setShowForm] = useState(false);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<{ keyFindings: string[], recommendations: string[] } | null>(null);

    const handleLogWaste = (formData: Omit<BioWasteLog, 'id' | 'manifestId' | 'collectionTimestamp' | 'collectedBy' | 'status'>) => {
        const newLog: BioWasteLog = {
            id: `bw${Date.now()}`,
            manifestId: `BMW-${new Date().toISOString().split('T')[0]}-${Date.now().toString().slice(-3)}`,
            collectionTimestamp: new Date().toISOString(),
            collectedBy: user.name,
            status: 'Collected',
            ...formData,
        };
        setLogs(prev => [newLog, ...prev]);
        setShowForm(false);
    };

    const handleRunAnalysis = async () => {
        setIsLoadingAI(true);
        try {
            const result = await getBioWasteAnalysis(logs);
            setAiAnalysis(result);
        } catch (error) {
            alert("Failed to get AI analysis.");
        } finally {
            setIsLoadingAI(false);
        }
    };
    
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-green-600 text-white rounded-md">+ Log New Waste</button>
                <button onClick={handleRunAnalysis} disabled={isLoadingAI} className="px-4 py-2 bg-indigo-600 text-white rounded-md">{isLoadingAI ? 'Analyzing...' : 'Analyze Waste Data with AI'}</button>
            </div>
            {showForm && <LogWasteForm onSubmit={handleLogWaste} onClose={() => setShowForm(false)} />}
            {aiAnalysis && <AnalysisModal analysis={aiAnalysis} onClose={() => setAiAnalysis(null)} />}
            <div className="overflow-x-auto bg-white rounded-lg border">
                <table className="min-w-full divide-y text-sm">
                    <thead className="bg-gray-50"><tr><th className="p-2 text-left">Manifest ID</th><th className="p-2 text-left">Category</th><th className="p-2 text-left">Weight (kg)</th><th className="p-2 text-left">Origin</th><th className="p-2 text-left">Collected By</th><th className="p-2 text-left">Status</th></tr></thead>
                    <tbody className="divide-y">{logs.map(log => <tr key={log.id}><td className="p-2 font-mono">{log.manifestId}</td><td className="p-2">{log.category}</td><td className="p-2">{log.weightKg}</td><td className="p-2">{log.origin}</td><td className="p-2">{log.collectedBy}</td><td className="p-2">{log.status}</td></tr>)}</tbody>
                </table>
            </div>
        </div>
    );
};

const LogWasteForm: React.FC<{ onSubmit: (data: any) => void, onClose: () => void }> = ({ onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
        category: BioWasteCategory.General,
        weightKg: 0,
        origin: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded-lg bg-gray-100 grid grid-cols-4 gap-4 items-end">
            <div>
                <label className="text-sm">Category</label>
                <select value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value as BioWasteCategory }))} className="mt-1 w-full p-2 border rounded bg-white">
                    {Object.values(BioWasteCategory).map(c => <option key={c}>{c}</option>)}
                </select>
            </div>
            <div>
                <label className="text-sm">Weight (kg)</label>
                <input type="number" step="0.1" value={formData.weightKg} onChange={e => setFormData(p => ({ ...p, weightKg: parseFloat(e.target.value) || 0 }))} required className="mt-1 w-full p-2 border rounded" />
            </div>
            <div>
                <label className="text-sm">Origin (Ward/Dept)</label>
                <input value={formData.origin} onChange={e => setFormData(p => ({ ...p, origin: e.target.value }))} required className="mt-1 w-full p-2 border rounded" />
            </div>
            <div className="flex gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded w-full">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded w-full">Save</button>
            </div>
        </form>
    );
};

const AnalysisModal: React.FC<{ analysis: { keyFindings: string[], recommendations: string[] }, onClose: () => void }> = ({ analysis, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                <h3 className="text-xl font-bold mb-4">AI Bio-Waste Analysis</h3>
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-indigo-800">Key Findings</h4>
                        <ul className="list-disc list-inside text-sm text-indigo-700">{analysis.keyFindings.map((f, i) => <li key={i}>{f}</li>)}</ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-indigo-800">Recommendations</h4>
                        <ul className="list-disc list-inside text-sm text-indigo-700">{analysis.recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
                    </div>
                </div>
                <div className="mt-6 text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Close</button>
                </div>
            </div>
        </div>
    );
};

export default HousekeepingAndWasteManagement;