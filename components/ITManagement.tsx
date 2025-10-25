import React, { useState, useMemo } from 'react';
import { User, ITTicket, ITAsset, ITTicketStatus, ITTicketPriority, ITTicketLogEntry, Role } from '../types';
import { MOCK_IT_TICKETS, MOCK_IT_ASSETS, MOCK_STAFF, USERS_DB } from '../constants';
import { analyzeITSupportTicket } from '../services/geminiService';

const ITManagement: React.FC<{ user: User }> = ({ user }) => {
    const [tickets, setTickets] = useState<ITTicket[]>(MOCK_IT_TICKETS);
    const [assets] = useState<ITAsset[]>(MOCK_IT_ASSETS);
    const [modal, setModal] = useState<{ type: 'new' | 'details', data?: ITTicket }>({ type: null });
    const [isLoadingAI, setIsLoadingAI] = useState(false);

    const handleCreateTicket = async (formData: { title: string; description: string; assetId?: string }) => {
        setIsLoadingAI(true);
        try {
            const { category, priority } = await analyzeITSupportTicket(formData.title, formData.description);
            const newTicket: ITTicket = {
                id: `IT-${Date.now().toString().slice(-4)}`,
                ...formData,
                reportedBy: user.name,
                // FIX: Cast category to the correct type to resolve type error.
                category: category as ITTicket['category'],
                priority,
                status: ITTicketStatus.New,
                createdTimestamp: new Date().toISOString(),
                log: [{ timestamp: new Date().toISOString(), user: 'System', note: `Ticket created by ${user.name} and analyzed by AI.` }],
            };
            setTickets(prev => [newTicket, ...prev]);
            setModal({ type: null });
        } catch (error) {
            console.error(error);
            alert("Failed to create ticket with AI analysis. Please try again.");
        } finally {
            setIsLoadingAI(false);
        }
    };
    
    const handleUpdateTicket = (updatedTicket: ITTicket) => {
        setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
        setModal({ type: 'details', data: updatedTicket });
    };

    const ticketsByStatus = useMemo(() => {
        const grouped: Record<ITTicketStatus, ITTicket[]> = {
            [ITTicketStatus.New]: [],
            [ITTicketStatus.Assigned]: [],
            [ITTicketStatus.InProgress]: [],
            [ITTicketStatus.Resolved]: [],
            [ITTicketStatus.Closed]: [],
        };
        tickets.forEach(t => grouped[t.status].push(t));
        return grouped;
    }, [tickets]);

    const columns: ITTicketStatus[] = [ITTicketStatus.New, ITTicketStatus.Assigned, ITTicketStatus.InProgress, ITTicketStatus.Resolved, ITTicketStatus.Closed];

    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">IT Support Dashboard</h2>
                <button onClick={() => setModal({ type: 'new' })} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    + New IT Ticket
                </button>
            </div>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto">
                {columns.map(status => (
                    <div key={status} className="bg-gray-100 rounded-lg p-3 flex flex-col">
                        <h3 className="font-semibold text-gray-700 mb-4 px-1 text-center">{status} ({ticketsByStatus[status].length})</h3>
                        <div className="space-y-3 overflow-y-auto">
                            {ticketsByStatus[status].map(t => <TicketCard key={t.id} ticket={t} onClick={() => setModal({ type: 'details', data: t })} />)}
                        </div>
                    </div>
                ))}
            </div>
            {modal.type === 'new' && <NewTicketModal assets={assets} onSubmit={handleCreateTicket} onClose={() => setModal({ type: null })} isLoading={isLoadingAI} />}
            {modal.type === 'details' && modal.data && <TicketDetailsModal ticket={modal.data} user={user} onUpdate={handleUpdateTicket} onClose={() => setModal({ type: null })} />}
        </div>
    );
};

const TicketCard: React.FC<{ ticket: ITTicket, onClick: () => void }> = ({ ticket, onClick }) => {
    const priorityColor = 
        ticket.priority === ITTicketPriority.Critical ? 'border-red-600' :
        ticket.priority === ITTicketPriority.High ? 'border-red-400' :
        ticket.priority === ITTicketPriority.Medium ? 'border-yellow-400' :
        'border-gray-300';
    return (
        <div onClick={onClick} className={`p-3 bg-white rounded-md shadow-sm border-l-4 ${priorityColor} cursor-pointer hover:shadow-md`}>
            <p className="font-semibold text-sm">{ticket.title}</p>
            <p className="text-xs text-gray-600 mt-1">Reported by: {ticket.reportedBy}</p>
            <div className="mt-2 flex justify-between items-center">
                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">{ticket.category}</span>
                <span className="text-xs text-gray-500">{new Date(ticket.createdTimestamp).toLocaleDateString()}</span>
            </div>
        </div>
    );
};

const NewTicketModal: React.FC<{ assets: ITAsset[], onSubmit: (data: any) => void, onClose: () => void, isLoading: boolean }> = ({ assets, onSubmit, onClose, isLoading }) => {
    const [formData, setFormData] = useState({ title: '', description: '', assetId: '' });
    if (isLoading) return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg p-8 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div><p className="mt-4">AI is analyzing your ticket...</p></div></div>;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <form onSubmit={e => { e.preventDefault(); onSubmit(formData); }} className="bg-white rounded-lg p-6 w-full max-w-lg space-y-4">
                <h3 className="text-xl font-bold">Submit New IT Ticket</h3>
                <div><label className="text-sm">Title</label><input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required className="mt-1 w-full border rounded p-2" /></div>
                <div><label className="text-sm">Description</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required rows={5} className="mt-1 w-full border rounded p-2" /></div>
                <div><label className="text-sm">Related Asset (Optional)</label><select value={formData.assetId} onChange={e => setFormData({...formData, assetId: e.target.value})} className="mt-1 w-full border rounded p-2 bg-white"><option value="">None</option>{assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.location})</option>)}</select></div>
                <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Submit for AI Triage</button></div>
            </form>
        </div>
    );
};

const TicketDetailsModal: React.FC<{ ticket: ITTicket, user: User, onUpdate: (data: ITTicket) => void, onClose: () => void }> = ({ ticket, user, onUpdate, onClose }) => {
    const [status, setStatus] = useState(ticket.status);
    const [assignedTo, setAssignedTo] = useState(ticket.assignedTo || '');
    const [resolutionNotes, setResolutionNotes] = useState(ticket.resolutionNotes || '');
    
    const assignableStaff = useMemo(() => {
        const adminUser = USERS_DB.find(u => u.role === Role.Admin);
        // Combine admin user with other staff, ensuring no duplicates by name
        const allStaff = [...MOCK_STAFF];
        if (adminUser && !allStaff.some(s => s.name === adminUser.name)) {
            // Adapt admin user to look like Staff for this list
            allStaff.unshift({
                id: `user-${adminUser.id}`,
                name: adminUser.name,
                role: adminUser.role,
                department: 'Administration',
                contact: adminUser.email || '',
                status: 'Active',
            });
        }
        return allStaff;
    }, []);
    
    const handleSave = () => {
        let updatedTicket = { ...ticket, status, assignedTo, resolutionNotes };
        const logEntries: string[] = [];
        if (status !== ticket.status) logEntries.push(`Status changed to ${status}.`);
        if (assignedTo !== ticket.assignedTo) logEntries.push(`Assigned to ${assignedTo}.`);
        if (resolutionNotes !== ticket.resolutionNotes) logEntries.push(`Resolution notes updated.`);
        if (status === ITTicketStatus.Resolved && !ticket.resolvedTimestamp) updatedTicket.resolvedTimestamp = new Date().toISOString();

        if (logEntries.length > 0) {
            const newLog: ITTicketLogEntry = { timestamp: new Date().toISOString(), user: user.name, note: logEntries.join(' ') };
            updatedTicket.log = [...updatedTicket.log, newLog];
        }
        onUpdate(updatedTicket);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-full flex flex-col">
                <div className="p-6 border-b"><h3 className="text-xl font-bold">Ticket: {ticket.id}</h3></div>
                <div className="flex-grow overflow-y-auto p-6 space-y-4 text-sm">
                    <div className="p-4 bg-gray-50 rounded border">
                        <p><strong>Title:</strong> {ticket.title}</p>
                        <p><strong>Description:</strong> {ticket.description}</p>
                        <p><strong>AI Category:</strong> {ticket.category} ({ticket.priority})</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label>Status</label><select value={status} onChange={e => setStatus(e.target.value as ITTicketStatus)} className="mt-1 w-full border rounded p-2 bg-white">{Object.values(ITTicketStatus).map(s => <option key={s}>{s}</option>)}</select></div>
                        <div>
                            <label>Assign To</label>
                            <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="mt-1 w-full border rounded p-2 bg-white">
                                <option value="">Unassigned</option>
                                {assignableStaff.map(staff => (
                                    <option key={staff.id} value={staff.name}>{staff.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div><label>Resolution Notes</label><textarea value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} rows={4} className="mt-1 w-full border rounded p-2" /></div>
                    <div>
                        <h4 className="font-semibold">Log</h4>
                        <div className="mt-2 space-y-2 text-xs border rounded p-2 bg-gray-50 max-h-32 overflow-y-auto">
                            {[...ticket.log].reverse().map(log => <div key={log.timestamp} className="border-b pb-1"><p>{log.note}</p><p className="text-gray-500 text-right">-- {log.user} at {new Date(log.timestamp).toLocaleTimeString()}</p></div>)}
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button><button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button></div>
            </div>
        </div>
    );
};

export default ITManagement;