import React, { useState } from 'react';
import { Surgery, User, Role } from '../types';
import { MOCK_OPERATIONS, MOCK_STAFF } from '../constants';

interface OperationTheatreSchedulerProps {
    user: User;
}

const OperationTheatreScheduler: React.FC<OperationTheatreSchedulerProps> = ({ user }) => {
    const [surgeries, setSurgeries] = useState<Surgery[]>(MOCK_OPERATIONS);
    const [showForm, setShowForm] = useState(false);
    const [newSurgery, setNewSurgery] = useState<Omit<Surgery, 'id' | 'status'>>({
        patientName: '',
        surgeonName: '',
        procedure: '',
        date: '',
        time: '',
        theatreNumber: 'OT-01'
    });

    const surgeons = MOCK_STAFF.filter(s => s.role === 'Doctor');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewSurgery(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const surgeryToAdd: Surgery = {
            id: `op${Date.now()}`,
            status: 'Scheduled',
            ...newSurgery
        };
        setSurgeries(prev => [...prev, surgeryToAdd].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        setShowForm(false);
        setNewSurgery({ patientName: '', surgeonName: '', procedure: '', date: '', time: '', theatreNumber: 'OT-01' });
    };
    
    const getStatusColor = (status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled') => {
        switch (status) {
            case 'Scheduled': return 'bg-blue-100 text-blue-800';
            case 'In Progress': return 'bg-purple-100 text-purple-800';
            case 'Completed': return 'bg-green-100 text-green-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
        }
    };
    
    const filteredSurgeries = surgeries.filter(surgery => {
        if (user.role === Role.Doctor) return surgery.surgeonName === user.name;
        return true; // Admin sees all
    });

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Operation Theatre Schedule</h2>
                 {user.role === Role.Admin && (
                    <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                        {showForm ? 'Cancel' : '+ Schedule Surgery'}
                    </button>
                )}
            </div>

            {showForm && user.role === Role.Admin && (
                 <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 border rounded-lg bg-gray-50">
                    <div className="col-span-1">
                        <label htmlFor="patientName" className="block text-sm font-medium text-gray-700">Patient Name</label>
                        <input type="text" name="patientName" value={newSurgery.patientName} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border rounded-md"/>
                    </div>
                     <div className="col-span-1">
                        <label htmlFor="surgeonName" className="block text-sm font-medium text-gray-700">Surgeon</label>
                        <select name="surgeonName" value={newSurgery.surgeonName} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border bg-white rounded-md">
                            <option value="">Select Surgeon</option>
                            {surgeons.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                     <div className="col-span-2">
                        <label htmlFor="procedure" className="block text-sm font-medium text-gray-700">Procedure</label>
                        <input type="text" name="procedure" value={newSurgery.procedure} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border rounded-md"/>
                    </div>
                     <div className="col-span-1">
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                        <input type="date" name="date" value={newSurgery.date} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border rounded-md"/>
                    </div>
                      <div className="col-span-1">
                        <label htmlFor="time" className="block text-sm font-medium text-gray-700">Time</label>
                        <input type="time" name="time" value={newSurgery.time} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border rounded-md"/>
                    </div>
                     <div className="col-span-1">
                        <label htmlFor="theatreNumber" className="block text-sm font-medium text-gray-700">Theatre Number</label>
                        <select name="theatreNumber" value={newSurgery.theatreNumber} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border bg-white rounded-md">
                           <option value="OT-01">OT-01</option>
                           <option value="OT-02">OT-02</option>
                           <option value="OT-03">OT-03</option>
                           <option value="OT-04">OT-04</option>
                        </select>
                    </div>
                    <div className="col-span-full text-right mt-4">
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Confirm Schedule</button>
                    </div>
                </form>
            )}

             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Surgeon</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Procedure</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Theatre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredSurgeries.map(op => (
                            <tr key={op.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{op.patientName}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{op.surgeonName}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{op.procedure}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{op.date} - {op.time}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{op.theatreNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(op.status)}`}>
                                        {op.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OperationTheatreScheduler;