import React, { useState, useEffect } from 'react';
import { Complaint, User, ComplaintStatus } from '../types';
import { fileComplaint, getComplaintsByPatient } from '../services/complaintService';

interface ComplaintAndQueryProps {
    user: User;
}

const ComplaintAndQuery: React.FC<ComplaintAndQueryProps> = ({ user }) => {
    const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [complaintText, setComplaintText] = useState('');
    const [contactMethod, setContactMethod] = useState<'In-App' | 'Phone' | 'In-Person'>('In-App');

    const fetchComplaints = async () => {
        try {
            setIsLoading(true);
            const complaints = await getComplaintsByPatient(user.id);
            setMyComplaints(complaints);
            setError(null);
        } catch (err) {
            setError('Failed to load your complaint history.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, [user.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!complaintText.trim()) {
            alert('Please describe your complaint or query.');
            return;
        }

        try {
            await fileComplaint({
                patientId: user.id,
                patientName: user.name,
                complaintText,
                preferredContactMethod: contactMethod,
            });
            setComplaintText('');
            // Refetch complaints to show the new one
            await fetchComplaints();
        } catch (err) {
            alert('Failed to submit your complaint. Please try again.');
        }
    };

    const getStatusColor = (status: ComplaintStatus) => {
        switch (status) {
            case ComplaintStatus.Open: return 'bg-blue-100 text-blue-800';
            case ComplaintStatus.InProgress: return 'bg-yellow-100 text-yellow-800';
            case ComplaintStatus.Resolved: return 'bg-green-100 text-green-800';
            case ComplaintStatus.Escalated: return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">File a Complaint or Query</h2>
            
            <form onSubmit={handleSubmit} className="mb-8 p-6 border rounded-lg bg-gray-50 space-y-4">
                <div>
                     <label htmlFor="contactMethod" className="block text-sm font-medium text-gray-700">How should we follow up with you?</label>
                     <select
                        id="contactMethod"
                        value={contactMethod}
                        onChange={(e) => setContactMethod(e.target.value as any)}
                        className="mt-1 block w-full px-3 py-2 border bg-white rounded-md"
                     >
                        <option value="In-App">In-App Message</option>
                        <option value="Phone">Phone Call</option>
                        <option value="In-Person">In-Person Meeting</option>
                     </select>
                </div>
                <div>
                    <label htmlFor="complaintText" className="block text-sm font-medium text-gray-700">Describe your issue</label>
                    <textarea 
                        id="complaintText"
                        rows={5}
                        value={complaintText}
                        onChange={(e) => setComplaintText(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border rounded-md"
                        placeholder="Please provide as much detail as possible..."
                        required
                    />
                </div>
                <div className="text-right">
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                        Submit
                    </button>
                </div>
            </form>

            <h3 className="text-xl font-bold text-gray-800 mb-4">Your Complaint History</h3>
            {isLoading ? (
                <p>Loading history...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : myComplaints.length === 0 ? (
                <p className="text-gray-500">You have not filed any complaints yet.</p>
            ) : (
                <div className="space-y-4">
                    {myComplaints.map(complaint => (
                        <div key={complaint.id} className="p-4 border rounded-lg bg-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs text-gray-500">Filed on: {new Date(complaint.dateFiled).toLocaleDateString()}</p>
                                    <p className="mt-1">{complaint.complaintText}</p>
                                </div>
                                <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${getStatusColor(complaint.status)}`}>
                                    {complaint.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ComplaintAndQuery;
