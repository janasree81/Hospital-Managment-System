import React, { useState, useMemo } from 'react';
import { User, Visitor, VisitorStatus, SecurityLogEntry, SecurityIncident, IncidentStatus, IncidentPriority, IncidentFollowUp } from '../types';
import { MOCK_VISITORS, MOCK_SECURITY_LOGS, MOCK_INCIDENTS } from '../constants';

interface SecurityHubProps {
    user: User;
}

type ActiveTab = 'visitors' | 'logs' | 'incidents';

const SecurityHub: React.FC<SecurityHubProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('visitors');
    const [visitors, setVisitors] = useState<Visitor[]>(MOCK_VISITORS);
    const [securityLogs, setSecurityLogs] = useState<SecurityLogEntry[]>(MOCK_SECURITY_LOGS);
    const [incidents, setIncidents] = useState<SecurityIncident[]>(MOCK_INCIDENTS);
    const [visitorSearchTerm, setVisitorSearchTerm] = useState('');

    const [modal, setModal] = useState<{ type: 'registerVisitor' | 'viewBadge' | 'fileIncident' | 'viewIncident' | null, data?: any }>({ type: null });

    const timeSince = (dateString: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
        let interval = seconds / 3600;
        if (interval > 1) return `${Math.floor(interval)}h ago`;
        interval = seconds / 60;
        if (interval > 1) return `${Math.floor(interval)}m ago`;
        return `${Math.floor(seconds)}s ago`;
    };

    // Visitor Management
    const handleRegisterVisitor = (formData: Omit<Visitor, 'id'|'checkInTime'|'status'>) => {
        const newVisitor: Visitor = {
            id: `vis${Date.now()}`,
            checkInTime: new Date().toISOString(),
            status: VisitorStatus.CheckedIn,
            ...formData,
        };
        setVisitors(prev => [newVisitor, ...prev]);
        setModal({ type: null });
    };

    const handleCheckoutVisitor = (visitorId: string) => {
        setVisitors(prev => prev.map(v => 
            v.id === visitorId 
            ? { ...v, status: VisitorStatus.CheckedOut, checkOutTime: new Date().toISOString() } 
            : v
        ));
    };

    // Security Log Management
    const handleAddLogEntry = (entry: string) => {
        if (!entry.trim()) return;
        const newLog: SecurityLogEntry = {
            id: `log${Date.now()}`,
            timestamp: new Date().toISOString(),
            officerName: user.name,
            entry: entry.trim(),
        };
        setSecurityLogs(prev => [newLog, ...prev]);
    };
    
    // Incident Management
    const handleFileIncident = (formData: Omit<SecurityIncident, 'id' | 'reportedBy' | 'status' | 'followUpNotes'>) => {
        const newIncident: SecurityIncident = {
            id: `INC-${Date.now().toString().slice(-4)}`,
            reportedBy: user.name,
            status: IncidentStatus.Open,
            followUpNotes: [],
            ...formData,
        };
        setIncidents(prev => [newIncident, ...prev]);
        setModal({ type: null });
    };

    const handleUpdateIncident = (updatedIncident: SecurityIncident) => {
        setIncidents(prev => prev.map(i => i.id === updatedIncident.id ? updatedIncident : i));
        // Keep the modal open with updated data
        setModal({ type: 'viewIncident', data: updatedIncident });
    };

    const TabButton: React.FC<{ tabId: ActiveTab, activeTab: ActiveTab, children: React.ReactNode }> = ({ tabId, activeTab, children }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === tabId ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
        >
            {children}
        </button>
    );

    const VisitorLogView = () => {
        const filteredVisitors = useMemo(() => {
            if (!visitorSearchTerm.trim()) {
                return visitors;
            }
            const lowercasedFilter = visitorSearchTerm.toLowerCase();
            return visitors.filter(v =>
                v.name.toLowerCase().includes(lowercasedFilter) ||
                v.company.toLowerCase().includes(lowercasedFilter)
            );
        }, [visitors, visitorSearchTerm]);

        return (
            <div>
                <div className="flex justify-between items-center mb-4">
                    <input
                        type="text"
                        placeholder="Search by name or company..."
                        value={visitorSearchTerm}
                        onChange={(e) => setVisitorSearchTerm(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm w-64"
                    />
                    <button onClick={() => setModal({ type: 'registerVisitor' })} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm">+ Register New Visitor</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visitor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visiting</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-in</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-out</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredVisitors.map(v => (
                                <tr key={v.id}>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{v.name}</div>
                                        <div className="text-sm text-gray-500">{v.company}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{v.visiting}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(v.checkInTime).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{v.checkOutTime ? new Date(v.checkOutTime).toLocaleString() : 'N/A'}</td>
                                    <td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${v.status === VisitorStatus.CheckedIn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{v.status}</span></td>
                                    <td className="px-6 py-4 text-sm space-x-2">
                                        {v.status === VisitorStatus.CheckedIn && <button onClick={() => handleCheckoutVisitor(v.id)} className="text-red-600 hover:text-red-800 font-medium">Check-out</button>}
                                        <button onClick={() => setModal({ type: 'viewBadge', data: v })} className="text-indigo-600 hover:text-indigo-800 font-medium">Badge</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };
    
    const SecurityLogView = () => {
        const [entryText, setEntryText] = useState('');
        const [logSearchTerm, setLogSearchTerm] = useState('');
        const [logStartDate, setLogStartDate] = useState('');
        const [logEndDate, setLogEndDate] = useState('');

        const filteredLogs = useMemo(() => {
            return securityLogs.filter(log => {
                const logDate = new Date(log.timestamp);
                const start = logStartDate ? new Date(logStartDate) : null;
                const end = logEndDate ? new Date(logEndDate) : null;
                
                if (start && logDate < start) return false;
                if (end) {
                    end.setHours(23, 59, 59, 999); // Include the whole day
                    if (logDate > end) return false;
                }

                if (logSearchTerm && !(log.entry.toLowerCase().includes(logSearchTerm.toLowerCase()) || log.officerName.toLowerCase().includes(logSearchTerm.toLowerCase()))) {
                    return false;
                }
                
                return true;
            });
        }, [securityLogs, logSearchTerm, logStartDate, logEndDate]);

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            handleAddLogEntry(entryText);
            setEntryText('');
        };
        return (
            <div>
                 <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
                    <input type="text" value={entryText} onChange={e => setEntryText(e.target.value)} placeholder="Enter new log entry..." className="flex-grow w-full px-3 py-2 border rounded-md" />
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Add Log</button>
                </form>
                <div className="p-4 bg-gray-50 border rounded-md mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={logSearchTerm}
                        onChange={e => setLogSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                    />
                    <div className="flex items-center gap-2">
                        <label className="text-sm">From:</label>
                        <input type="date" value={logStartDate} onChange={e => setLogStartDate(e.target.value)} className="w-full px-3 py-2 border rounded-md"/>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm">To:</label>
                        <input type="date" value={logEndDate} onChange={e => setLogEndDate(e.target.value)} className="w-full px-3 py-2 border rounded-md"/>
                    </div>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredLogs.map(log => (
                        <div key={log.id} className="p-3 bg-gray-50 border rounded-md">
                            <p className="text-sm text-gray-800">{log.entry}</p>
                            <p className="text-xs text-gray-500 text-right">-- {log.officerName} at {new Date(log.timestamp).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const IncidentReportView = () => {
        const getPriorityColor = (p: IncidentPriority) => p === IncidentPriority.High ? 'text-red-600' : p === IncidentPriority.Medium ? 'text-yellow-600' : 'text-gray-500';
        const [filters, setFilters] = useState({ term: '', startDate: '', endDate: '', type: 'all', status: 'all' });

        const incidentTypes = ['Theft', 'Unauthorized Access', 'Safety Hazard', 'Disturbance', 'Other'];

        const filteredIncidents = useMemo(() => {
            return incidents.filter(inc => {
                // Date filtering
                const incDate = new Date(inc.incidentTimestamp);
                const start = filters.startDate ? new Date(filters.startDate) : null;
                const end = filters.endDate ? new Date(filters.endDate) : null;
                if (start && incDate < start) return false;
                if (end) { end.setHours(23, 59, 59, 999); if (incDate > end) return false; }

                // Type and Status filtering
                if (filters.type !== 'all' && inc.type !== filters.type) return false;
                if (filters.status !== 'all' && inc.status !== filters.status) return false;
                
                // Search term filtering
                const lowerTerm = filters.term.toLowerCase();
                if (filters.term && !(
                    inc.id.toLowerCase().includes(lowerTerm) ||
                    inc.description.toLowerCase().includes(lowerTerm) ||
                    inc.location.toLowerCase().includes(lowerTerm) ||
                    inc.reportedBy.toLowerCase().includes(lowerTerm)
                )) return false;

                return true;
            });
        }, [incidents, filters]);

        const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
        };
        
        const clearFilters = () => setFilters({ term: '', startDate: '', endDate: '', type: 'all', status: 'all' });

        return (
             <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Incident Reports</h3>
                    <button onClick={() => setModal({ type: 'fileIncident' })} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm">+ File New Incident</button>
                </div>
                <div className="p-4 bg-gray-50 border rounded-md mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                     <div className="lg:col-span-3">
                        <label className="text-sm font-medium">Search</label>
                        <input name="term" value={filters.term} onChange={handleFilterChange} placeholder="Search ID, location, description..." className="mt-1 w-full px-3 py-2 border rounded-md"/>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm">From:</label>
                        <input name="startDate" type="date" value={filters.startDate} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-md"/>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm">To:</label>
                        <input name="endDate" type="date" value={filters.endDate} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-md"/>
                    </div>
                    <div>
                         <label className="text-sm font-medium">Type</label>
                        <select name="type" value={filters.type} onChange={handleFilterChange} className="mt-1 w-full px-3 py-2 border rounded-md bg-white">
                            <option value="all">All Types</option>
                            {incidentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Status</label>
                        <select name="status" value={filters.status} onChange={handleFilterChange} className="mt-1 w-full px-3 py-2 border rounded-md bg-white">
                            <option value="all">All Statuses</option>
                            {Object.values(IncidentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="lg:col-start-3">
                         <button onClick={clearFilters} className="w-full px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 text-sm">Clear Filters</button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                     <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Incident ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type & Priority</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                            {filteredIncidents.map(inc => (
                                <tr key={inc.id}>
                                    <td className="px-6 py-4 font-mono text-sm">{inc.id}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{inc.type}</div>
                                        <div className={`text-sm ${getPriorityColor(inc.priority)}`}>{inc.priority} Priority</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(inc.incidentTimestamp).toLocaleString()}</td>
                                    <td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800`}>{inc.status}</span></td>
                                    <td className="px-6 py-4 text-right"><button onClick={() => setModal({ type: 'viewIncident', data: inc })} className="text-indigo-600 hover:text-indigo-800 font-medium">View</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };
    
    // Modals
    const RegisterVisitorModal = () => {
        const [formData, setFormData] = useState({ name: '', company: '', phone: '', visiting: '', purpose: ''});
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({...p, [e.target.name]: e.target.value}));
        const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); handleRegisterVisitor(formData); };
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg space-y-4">
                     <h3 className="text-xl font-bold">Register Visitor</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm">Full Name</label><input name="name" onChange={handleChange} required className="mt-1 w-full border rounded-md p-2"/></div>
                        <div><label className="block text-sm">Company</label><input name="company" onChange={handleChange} required className="mt-1 w-full border rounded-md p-2"/></div>
                        <div><label className="block text-sm">Phone</label><input name="phone" type="tel" onChange={handleChange} required className="mt-1 w-full border rounded-md p-2"/></div>
                        <div><label className="block text-sm">Person to Visit</label><input name="visiting" onChange={handleChange} required className="mt-1 w-full border rounded-md p-2"/></div>
                     </div>
                     <div><label className="block text-sm">Purpose of Visit</label><input name="purpose" onChange={handleChange} required className="mt-1 w-full border rounded-md p-2"/></div>
                     <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={() => setModal({ type: null })} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Register & Check-in</button>
                    </div>
                </form>
            </div>
        );
    };
    const ViewBadgeModal = ({ visitor }: { visitor: Visitor }) => (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center">
                 <h3 className="text-xl font-bold mb-4">Visitor Badge</h3>
                 <div className="p-8 border-2 border-dashed">
                    <p className="text-2xl font-bold">{visitor.name}</p>
                    <p className="text-gray-600">{visitor.company}</p>
                    <p className="mt-4">Visiting:</p>
                    <p className="font-semibold">{visitor.visiting}</p>
                    <p className="mt-2 text-xs text-gray-500">Date: {new Date(visitor.checkInTime).toLocaleDateString()}</p>
                 </div>
                 <div className="flex justify-end space-x-2 pt-4 mt-2">
                    <button type="button" onClick={() => setModal({ type: null })} className="px-4 py-2 bg-gray-200 rounded-md">Close</button>
                    <button type="button" onClick={() => alert("Printing... (simulation)")} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Print</button>
                 </div>
            </div>
         </div>
    );
    const FileIncidentModal = () => {
        const [formData, setFormData] = useState<Omit<SecurityIncident, 'id'|'reportedBy'|'status'|'followUpNotes'>>({type: 'Other', incidentTimestamp: new Date().toISOString().slice(0,16), location: '', description: '', personsInvolved: '', actionsTaken: '', priority: IncidentPriority.Low});
        const handleChange = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => setFormData(p => ({...p, [e.target.name]: e.target.value}));
        const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); handleFileIncident(formData); };
         return (
             <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                 <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-full overflow-y-auto space-y-4">
                    <h3 className="text-xl font-bold">File New Incident Report</h3>
                    <div className="grid grid-cols-3 gap-4">
                         <div><label className="block text-sm">Incident Type</label><select name="type" onChange={handleChange} className="mt-1 w-full border rounded-md p-2 bg-white"><option>Theft</option><option>Unauthorized Access</option><option>Safety Hazard</option><option>Disturbance</option><option>Other</option></select></div>
                         <div><label className="block text-sm">Date & Time</label><input name="incidentTimestamp" type="datetime-local" value={formData.incidentTimestamp} onChange={handleChange} required className="mt-1 w-full border rounded-md p-2"/></div>
                         <div><label className="block text-sm">Priority</label><select name="priority" onChange={handleChange} className="mt-1 w-full border rounded-md p-2 bg-white">{Object.values(IncidentPriority).map(p => <option key={p}>{p}</option>)}</select></div>
                    </div>
                     <div><label className="block text-sm">Location</label><input name="location" onChange={handleChange} required className="mt-1 w-full border rounded-md p-2"/></div>
                     <div><label className="block text-sm">Description of Incident</label><textarea name="description" rows={3} onChange={handleChange} required className="mt-1 w-full border rounded-md p-2"></textarea></div>
                     <div><label className="block text-sm">Persons Involved</label><input name="personsInvolved" onChange={handleChange} className="mt-1 w-full border rounded-md p-2"/></div>
                     <div><label className="block text-sm">Immediate Actions Taken</label><textarea name="actionsTaken" rows={2} onChange={handleChange} required className="mt-1 w-full border rounded-md p-2"></textarea></div>
                     <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={() => setModal({ type: null })} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-md">File Report</button>
                    </div>
                 </form>
             </div>
        );
    };
     const ViewIncidentModal = ({ incident }: { incident: SecurityIncident }) => {
        const [newNote, setNewNote] = useState('');
        const [newStatus, setNewStatus] = useState(incident.status);
        const handleAddNote = () => {
            if (!newNote.trim()) return;
            const followUp: IncidentFollowUp = { timestamp: new Date().toISOString(), user: user.name, note: newNote };
            handleUpdateIncident({ ...incident, status: newStatus, followUpNotes: [...incident.followUpNotes, followUp]});
            setNewNote('');
        };
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-full flex flex-col">
                    <div className="flex justify-between items-start">
                         <h3 className="text-xl font-bold">Incident: {incident.id}</h3>
                         <button onClick={() => setModal({ type: null })} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                    </div>
                    <div className="mt-4 flex-grow overflow-y-auto pr-2 space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg border text-sm space-y-1">
                             <p><strong>Type:</strong> {incident.type} ({incident.priority} Priority)</p>
                             <p><strong>Location:</strong> {incident.location}</p>
                             <p><strong>Description:</strong> {incident.description}</p>
                             <p><strong>Actions Taken:</strong> {incident.actionsTaken}</p>
                             <p><strong>Reported By:</strong> {incident.reportedBy} at {new Date(incident.incidentTimestamp).toLocaleString()}</p>
                        </div>
                         <div>
                            <h4 className="font-semibold">Investigation Log</h4>
                            <div className="mt-2 space-y-2 text-xs border rounded-md p-2 bg-gray-50 max-h-40 overflow-y-auto">
                                {incident.followUpNotes.length === 0 && <p className="text-gray-500">No follow-up notes yet.</p>}
                                {incident.followUpNotes.slice().reverse().map(note => (
                                    <div key={note.timestamp} className="border-b pb-1"><p>{note.note}</p><p className="text-gray-500 text-right">-- {note.user} ({timeSince(note.timestamp)})</p></div>
                                ))}
                            </div>
                         </div>
                        <div className="flex gap-2">
                             <input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a follow-up note..." className="flex-grow w-full px-3 py-2 border rounded-md"/>
                             <select value={newStatus} onChange={e => setNewStatus(e.target.value as IncidentStatus)} className="border rounded-md p-2 bg-white">
                                {Object.values(IncidentStatus).map(s => <option key={s}>{s}</option>)}
                             </select>
                             <button onClick={handleAddNote} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Save</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Security Hub</h2>
            <div className="flex space-x-2 border-b mb-4">
                <TabButton tabId="visitors" activeTab={activeTab}>Visitor Log</TabButton>
                <TabButton tabId="logs" activeTab={activeTab}>Security Log</TabButton>
                <TabButton tabId="incidents" activeTab={activeTab}>Incident Reports</TabButton>
            </div>
            <div>
                {activeTab === 'visitors' && <VisitorLogView />}
                {activeTab === 'logs' && <SecurityLogView />}
                {activeTab === 'incidents' && <IncidentReportView />}
            </div>

            {modal.type === 'registerVisitor' && <RegisterVisitorModal />}
            {modal.type === 'viewBadge' && modal.data && <ViewBadgeModal visitor={modal.data} />}
            {modal.type === 'fileIncident' && <FileIncidentModal />}
            {modal.type === 'viewIncident' && modal.data && <ViewIncidentModal incident={modal.data} />}
        </div>
    );
};

export default SecurityHub;