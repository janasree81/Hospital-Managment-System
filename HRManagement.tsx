import React, { useState } from 'react';
import { Staff, Role } from '../types';
import { MOCK_STAFF } from '../constants';

const HRManagement: React.FC = () => {
    const [staff, setStaff] = useState<Staff[]>(MOCK_STAFF);
    const [showForm, setShowForm] = useState(false);
    const [newStaff, setNewStaff] = useState({
        name: '',
        role: Role.Nurse,
        department: '',
        contact: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewStaff(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const staffToAdd: Staff = {
            id: `staff${Date.now()}`,
            status: 'Active',
            ...newStaff,
        };
        setStaff(prev => [...prev, staffToAdd]);
        setShowForm(false);
        setNewStaff({ name: '', role: Role.Nurse, department: '', contact: '' });
    };

    const getStatusColor = (status: 'Active' | 'On Leave' | 'Inactive') => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-800';
            case 'On Leave': return 'bg-yellow-100 text-yellow-800';
            case 'Inactive': return 'bg-red-100 text-red-800';
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">HR Management</h2>
                <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    {showForm ? 'Cancel' : '+ Add New Staff'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 border rounded-lg bg-gray-50">
                    <div className="col-span-1">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input type="text" name="name" id="name" value={newStaff.name} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <div className="col-span-1">
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                        <select name="role" id="role" value={newStaff.role} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm">
                            {Object.values(Role).filter(r => r !== Role.Patient).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="col-span-1">
                        <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
                        <input type="text" name="department" id="department" value={newStaff.department} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <div className="col-span-1">
                        <label htmlFor="contact" className="block text-sm font-medium text-gray-700">Contact Email</label>
                        <input type="email" name="contact" id="contact" value={newStaff.contact} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <div className="col-span-full text-right">
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Add Staff Member</button>
                    </div>
                </form>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {staff.map(member => (
                            <tr key={member.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.role}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.department}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.contact}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(member.status)}`}>
                                        {member.status}
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

export default HRManagement;