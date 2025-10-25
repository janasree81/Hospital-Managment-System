import React, { useState, useMemo } from 'react';
import { User, HousekeepingTask, HousekeepingStaff, BioWasteLog, HousekeepingTaskStatus, HousekeepingChecklistItem, BioWasteCategory } from '../types';
// FIX: Added missing imports.
import { MOCK_HOUSEKEEPING_TASKS, MOCK_HOUSEKEEPING_STAFF, MOCK_BIOWASTE_LOGS } from '../constants';
import { getAIHousekeepingSchedule, getBioWasteAnalysis } from '../services/geminiService';

const DashboardView = () => {
    const totalTasks = MOCK_HOUSEKEEPING_TASKS.length;
    const pendingTasks = MOCK_HOUSEKEEPING_TASKS.filter(t => t.status === 'Pending').length;
    const wasteLogsCount = MOCK_BIOWASTE_LOGS.length;
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg border text-center">
                <p className="text-gray-600">Total Tasks</p>
                <p className="text-3xl font-bold">{totalTasks}</p>
            </div>
            <div className="p-4 bg-white rounded-lg border text-center">
                <p className="text-gray-600">Pending Tasks</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingTasks}</p>
            </div>
            <div className="p-4 bg-white rounded-lg border text-center">
                <p className="text-gray-600">Waste Logs Today</p>
                <p className="text-3xl font-bold text-red-600">{wasteLogsCount}</p>
            </div>
        </div>
    );
};

const TasksView: React.FC<{ user: User }> = ({ user }) => {
    const [tasks, setTasks] = useState<HousekeepingTask[]>(MOCK_HOUSEKEEPING_TASKS);
    const [staff] = useState<HousekeepingStaff[]>(MOCK_HOUSEKEEPING_STAFF);
    const [isLoadingAI, setIsLoadingAI] = useState(false);

    const handleScheduleAI = async () => {
        setIsLoadingAI(true);
        try {
            const updatedTasks = await getAIHousekeepingSchedule(tasks, staff);
            setTasks(updatedTasks);
        } catch (error) {
            alert("Failed to get AI schedule.");
        } finally {
            setIsLoadingAI(false);
        }
    };
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Task Board</h3>
                <button onClick={handleScheduleAI} disabled={isLoadingAI} className="px-4 py-2 bg-indigo-600 text-white rounded-md">
                    {isLoadingAI ? "Scheduling..." : "Optimize with AI"}
                </button>
            </div>
            <div className="space-y-3">
                {tasks.map(task => (
                    <div key={task.id} className="p-3 bg-white border rounded-md">
                        <p className="font-semibold">{task.task} @ {task.location}</p>
                        <p className="text-sm">Status: {task.status} | Assigned to: {task.assignedTo || 'Unassigned'}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const WasteView: React.FC<{ user: User }> = ({ user }) => {
    const [logs] = useState<BioWasteLog[]>(MOCK_BIOWASTE_LOGS);
    const [aiAnalysis, setAiAnalysis] = useState<{ keyFindings: string[], recommendations: string[] } | null>(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);

    const handleAnalyzeAI = async () => {
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
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Bio-Medical Waste Log</h3>
                <button onClick={handleAnalyzeAI} disabled={isLoadingAI} className="px-4 py-2 bg-indigo-600 text-white rounded-md">
                    {isLoadingAI ? "Analyzing..." : "Analyze with AI"}
                </button>
            </div>
            {aiAnalysis && (
                <div className="p-4 bg-indigo-50 border rounded-lg mb-4">
                    <h4 className="font-bold text-indigo-800">AI Analysis</h4>
                    <p className="font-semibold">Findings:</p>
                    <ul className="list-disc list-inside text-sm">{aiAnalysis.keyFindings.map((f, i) => <li key={i}>{f}</li>)}</ul>
                    <p className="font-semibold mt-2">Recommendations:</p>
                    <ul className="list-disc list-inside text-sm">{aiAnalysis.recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
                </div>
            )}
            <div className="space-y-3">
                {logs.length === 0 && <p>No waste logs recorded yet.</p>}
                {logs.map(log => (
                    <div key={log.id} className="p-3 bg-white border rounded-md">
                        <p><strong>Category:</strong> {log.category} | <strong>Weight:</strong> {log.weightKg}kg | <strong>Origin:</strong> {log.origin}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};


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

export default HousekeepingAndWasteManagement;