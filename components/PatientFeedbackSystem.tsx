import React, { useState, useMemo } from 'react';
import { User, Feedback, FeedbackStatus, FeedbackPriority } from '../types';
// FIX: Added missing imports for MOCK_FEEDBACK and DEPARTMENTS.
import { MOCK_FEEDBACK, MOCK_PATIENTS, DEPARTMENTS, MOCK_STAFF } from '../constants';
import { analyzePatientFeedback } from '../services/geminiService';

const PatientFeedbackSystem: React.FC<{ user: User }> = ({ user }) => {
    const [feedback, setFeedback] = useState<Feedback[]>(MOCK_FEEDBACK);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'inbox'>('dashboard');
    const [modal, setModal] = useState<{ type: 'new' | 'details', data?: Feedback } | null>(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);

    const handleFileNewFeedback = async (formData: { patientId: string; department: string; channel: Feedback['channel']; feedbackText: string; }) => {
        setIsLoadingAI(true);
        const patient = MOCK_PATIENTS.find(p => p.id === formData.patientId);
        if (!patient) {
            setIsLoadingAI(false);
            return;
        }

        const aiAnalysis = await analyzePatientFeedback(formData.feedbackText);

        const newFeedback: Feedback = {
            id: `fb-${Date.now()}`,
            patientId: formData.patientId,
            patientName: `${patient.firstName} ${patient.lastName}`,
            submissionDate: new Date().toISOString(),
            status: FeedbackStatus.Open,
            ...formData,
            ...aiAnalysis,
        };
        setFeedback(prev => [newFeedback, ...prev]);
        setIsLoadingAI(false);
        setModal({ type: null });
    };

    const handleUpdateFeedback = (updatedFeedback: Feedback) => {
        setFeedback(prev => prev.map(f => f.id === updatedFeedback.id ? updatedFeedback : f));
        setModal({ type: 'details', data: updatedFeedback });
    };

    const TabButton: React.FC<{ tabId: typeof activeTab, children: React.ReactNode }> = ({ tabId, children }) => (
        <button onClick={() => setActiveTab(tabId)} className={`px-4 py-2 text-sm font-medium rounded-t-md ${activeTab === tabId ? 'bg-gray-100 border-b-2 border-indigo-600' : 'text-gray-500'}`}>
            {children}
        </button>
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">Patient Feedback System</h2>
                <div className="flex space-x-2 border-b">
                    <TabButton tabId="dashboard">Analytics Dashboard</TabButton>
                    <TabButton tabId="inbox">Feedback Inbox</TabButton>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto bg-gray-50 -m-6 p-6">
                {activeTab === 'dashboard' && <AnalyticsDashboard feedback={feedback} onNewFeedback={() => setModal({type: 'new'})}/>}
                {activeTab === 'inbox' && <FeedbackInbox feedback={feedback} onSelectFeedback={(data) => setModal({type: 'details', data})} />}
            </div>
            {modal?.type === 'new' && <NewFeedbackModal onSubmit={handleFileNewFeedback} onClose={() => setModal(null)} isLoading={isLoadingAI} />}
            {modal?.type === 'details' && modal.data && <DetailsModal feedback={modal.data} onUpdate={handleUpdateFeedback} onClose={() => setModal(null)} user={user} />}
        </div>
    );
};

const AnalyticsDashboard: React.FC<{feedback: Feedback[], onNewFeedback: () => void}> = ({ feedback, onNewFeedback }) => {
    const stats = useMemo(() => {
        const total = feedback.length;
        const sentiments = { Positive: 0, Neutral: 0, Negative: 0 };
        const tags = new Map<string, number>();
        feedback.forEach(f => {
            sentiments[f.sentiment]++;
            (f.tags || []).forEach(tag => {
                tags.set(tag, (tags.get(tag) || 0) + 1);
            });
        });
        const topTags = Array.from(tags.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
        return { total, sentiments, topTags };
    }, [feedback]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-lg border text-center"><p className="text-gray-600">Total Feedback</p><p className="text-3xl font-bold">{stats.total}</p></div>
                <div className="p-4 bg-white rounded-lg border text-center"><p className="text-gray-600">Positive Sentiment</p><p className="text-3xl font-bold text-green-600">{((stats.sentiments.Positive / (stats.total || 1)) * 100 || 0).toFixed(0)}%</p></div>
                <div className="p-4 bg-white rounded-lg border text-center"><p className="text-gray-600">Open Tickets</p><p className="text-3xl font-bold text-yellow-600">{feedback.filter(f => f.status === 'Open').length}</p></div>
                <button onClick={onNewFeedback} className="bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">Submit New Feedback</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 p-4 bg-white rounded-lg border">
                    <h3 className="font-bold mb-2">Sentiment Breakdown</h3>
                    <div className="w-48 h-48 mx-auto my-4 rounded-full flex items-center justify-center" style={{background: `conic-gradient(rgb(34,197,94) 0% ${((stats.sentiments.Positive/(stats.total || 1))*100).toFixed(1)}%, rgb(234,179,8) ${((stats.sentiments.Positive/(stats.total || 1))*100).toFixed(1)}% ${(((stats.sentiments.Positive+stats.sentiments.Neutral)/(stats.total || 1))*100).toFixed(1)}%, rgb(239,68,68) ${(((stats.sentiments.Positive+stats.sentiments.Neutral)/(stats.total || 1))*100).toFixed(1)}% 100%)`}}>
                       <div className="w-32 h-32 bg-white rounded-full"></div>
                    </div>
                    <div className="text-sm space-y-1"><p><span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>Positive: {stats.sentiments.Positive}</p><p><span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>Neutral: {stats.sentiments.Neutral}</p><p><span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>Negative: {stats.sentiments.Negative}</p></div>
                </div>
                <div className="lg:col-span-2 p-4 bg-white rounded-lg border">
                    <h3 className="font-bold mb-2">Top Feedback Themes</h3>
                    <div className="space-y-2">{stats.topTags.map(([tag, count]) => <div key={tag}><p className="text-sm font-medium">{tag}</p><div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-indigo-600 h-2.5 rounded-full" style={{width: `${(count / (stats.topTags[0]?.[1] || 1) * 100)}%`}}></div></div></div>)}</div>
                </div>
            </div>
        </div>
    );
};

const FeedbackInbox: React.FC<{feedback: Feedback[], onSelectFeedback: (f: Feedback) => void}> = ({ feedback, onSelectFeedback }) => (
    <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-bold text-lg mb-2">Feedback Inbox</h3>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">Patient</th><th className="px-4 py-2 text-left">Department</th><th className="px-4 py-2 text-left">Sentiment</th><th className="px-4 py-2 text-left">Status</th><th className="px-4 py-2"></th></tr></thead>
                <tbody>
                    {feedback.map(f => <tr key={f.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => onSelectFeedback(f)}><td className="px-4 py-2">{f.patientName}</td><td className="px-4 py-2">{f.department}</td><td className="px-4 py-2">{f.sentiment}</td><td className="px-4 py-2">{f.status}</td><td className="px-4 py-2 text-right"><span className="text-indigo-600">Details</span></td></tr>)}
                </tbody>
            </table>
        </div>
    </div>
);

const NewFeedbackModal: React.FC<{onSubmit: (data: any) => void, onClose: () => void, isLoading: boolean}> = ({ onSubmit, onClose, isLoading }) => {
    const [formData, setFormData] = useState({ patientId: '', department: '', channel: 'In-person' as Feedback['channel'], feedbackText: '' });
    if (isLoading) return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg p-8 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div><p className="mt-4">AI is analyzing feedback...</p></div></div>;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="bg-white rounded-lg p-6 w-full max-w-lg space-y-4">
                <h3 className="text-xl font-bold">Submit New Feedback</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-sm">Patient</label><select value={formData.patientId} onChange={e => setFormData({...formData, patientId: e.target.value})} required className="mt-1 w-full border rounded p-2 bg-white"><option value="">Select</option>{MOCK_PATIENTS.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}</select></div>
                    <div><label className="text-sm">Department</label><select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} required className="mt-1 w-full border rounded p-2 bg-white"><option value="">Select</option>{DEPARTMENTS.map(d => <option key={d.name}>{d.name}</option>)}</select></div>
                </div>
                <div><label className="text-sm">Feedback Text</label><textarea value={formData.feedbackText} onChange={e => setFormData({...formData, feedbackText: e.target.value})} required rows={5} className="mt-1 w-full border rounded p-2" /></div>
                <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Submit</button></div>
            </form>
        </div>
    );
};

const DetailsModal: React.FC<{feedback: Feedback, onUpdate: (data: Feedback) => void, onClose: () => void, user: User}> = ({ feedback, onUpdate, onClose, user }) => {
    const [status, setStatus] = useState(feedback.status);
    const [assignedTo, setAssignedTo] = useState(feedback.assignedTo || '');
    const [resolutionNotes, setResolutionNotes] = useState(feedback.resolutionNotes || '');

    const handleSave = () => {
        const updatedFeedback = { ...feedback, status, assignedTo, resolutionNotes };
        onUpdate(updatedFeedback);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-full flex flex-col">
                <h3 className="text-xl font-bold">Feedback Details: {feedback.id}</h3>
                <div className="mt-4 flex-grow overflow-y-auto pr-2 space-y-4">
                    <div className="p-4 bg-gray-50 rounded border text-sm">
                        <p><strong>Patient:</strong> {feedback.patientName}</p>
                        <p><strong>Department:</strong> {feedback.department}</p>
                        <p><strong>AI Sentiment:</strong> {feedback.sentiment} ({feedback.priority} Priority)</p>
                        <p><strong>AI Tags:</strong> {(feedback.tags || []).join(', ')}</p>
                        <p className="mt-2"><strong>Feedback:</strong> "{feedback.feedbackText}"</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm">Status</label>
                            <select value={status} onChange={e => setStatus(e.target.value as FeedbackStatus)} className="mt-1 w-full border rounded p-2 bg-white">
                                {Object.values(FeedbackStatus).map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm">Assign To</label>
                            <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="mt-1 w-full border rounded p-2 bg-white">
                                <option value="">Unassigned</option>
                                {MOCK_STAFF.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm">Resolution Notes</label>
                        <textarea value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} rows={4} className="mt-1 w-full border rounded p-2" />
                    </div>
                </div>
                <div className="p-6 border-t flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default PatientFeedbackSystem;