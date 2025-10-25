import React, { useState, useMemo } from 'react';
import { Patient } from '../types';
import { MOCK_PATIENTS } from '../constants';

const PatientFormModal: React.FC<{
    patient: Partial<Patient> | null;
    onClose: () => void;
    onSave: (patientData: Patient) => void;
}> = ({ patient, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Patient>>(
        patient || {
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            gender: 'Other',
            contactNumber: '',
            contactEmail: '',
            address: '',
            bloodType: '',
            allergies: [],
            chronicConditions: [],
            emergencyContactName: '',
            emergencyContactPhone: '',
        }
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleArrayChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value.split(',').map(s => s.trim()).filter(Boolean) }));
    };
    
    // Simple age calculation from DOB
    const calculateAge = (dob: string): number => {
        if (!dob) return 0;
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalData: Patient = {
            id: formData.id || `p${Date.now()}`,
            avatarUrl: formData.avatarUrl || `https://picsum.photos/seed/${formData.firstName}/100`,
            vitals: formData.vitals || [],
            consultationHistory: formData.consultationHistory || [],
            referrals: formData.referrals || [],
            age: calculateAge(formData.dateOfBirth!),
            ...formData,
        } as Patient; // We cast here assuming the form is validated
        onSave(finalData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-full overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <h3 className="text-2xl font-bold text-gray-800">{patient?.id ? 'Edit Patient Record' : 'Add New Patient'}</h3>
                    
                    <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold text-gray-700 mb-4">Personal Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><label className="block text-sm font-medium">First Name</label><input name="firstName" value={formData.firstName || ''} onChange={handleChange} required className="mt-1 w-full border rounded-md p-2"/></div>
                             <div><label className="block text-sm font-medium">Last Name</label><input name="lastName" value={formData.lastName || ''} onChange={handleChange} required className="mt-1 w-full border rounded-md p-2"/></div>
                            <div><label className="block text-sm font-medium">Date of Birth</label><input name="dateOfBirth" type="date" value={formData.dateOfBirth || ''} onChange={handleChange} required className="mt-1 w-full border rounded-md p-2"/></div>
                            <div><label className="block text-sm font-medium">Gender</label><select name="gender" value={formData.gender || 'Other'} onChange={handleChange} className="mt-1 w-full border rounded-md p-2 bg-white"><option>Male</option><option>Female</option><option>Other</option></select></div>
                            <div><label className="block text-sm font-medium">Blood Type</label><input name="bloodType" value={formData.bloodType || ''} onChange={handleChange} className="mt-1 w-full border rounded-md p-2"/></div>
                        </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold text-gray-700 mb-4">Contact Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium">Phone Number</label><input name="contactNumber" type="tel" value={formData.contactNumber || ''} onChange={handleChange} required className="mt-1 w-full border rounded-md p-2"/></div>
                            <div><label className="block text-sm font-medium">Email Address</label><input name="contactEmail" type="email" value={formData.contactEmail || ''} onChange={handleChange} required className="mt-1 w-full border rounded-md p-2"/></div>
                            <div className="md:col-span-2"><label className="block text-sm font-medium">Address</label><input name="address" value={formData.address || ''} onChange={handleChange} className="mt-1 w-full border rounded-md p-2"/></div>
                        </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold text-gray-700 mb-4">Emergency Contact</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium">Contact Name</label><input name="emergencyContactName" value={formData.emergencyContactName || ''} onChange={handleChange} className="mt-1 w-full border rounded-md p-2"/></div>
                            <div><label className="block text-sm font-medium">Contact Phone</label><input name="emergencyContactPhone" type="tel" value={formData.emergencyContactPhone || ''} onChange={handleChange} className="mt-1 w-full border rounded-md p-2"/></div>
                        </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold text-gray-700 mb-4">Medical History</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium">Allergies (comma-separated)</label><textarea name="allergies" value={(formData.allergies || []).join(', ')} onChange={handleArrayChange} rows={3} className="mt-1 w-full border rounded-md p-2"></textarea></div>
                            <div><label className="block text-sm font-medium">Chronic Conditions (comma-separated)</label><textarea name="chronicConditions" value={(formData.chronicConditions || []).join(', ')} onChange={handleArrayChange} rows={3} className="mt-1 w-full border rounded-md p-2"></textarea></div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save Record</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const PatientRecords: React.FC = () => {
    const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);

    const filteredPatients = useMemo(() =>
        patients.filter(p =>
            `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.contactNumber.includes(searchTerm)
        ).sort((a,b) => a.firstName.localeCompare(b.firstName)),
        [patients, searchTerm]
    );

    const handleSavePatient = (patientData: Patient) => {
        if (isAddingNew) {
            setPatients(prev => [patientData, ...prev]);
        } else {
            setPatients(prev => prev.map(p => p.id === patientData.id ? patientData : p));
        }
        setIsAddingNew(false);
        setEditingPatient(null);
    };

    const handleCloseModal = () => {
        setIsAddingNew(false);
        setEditingPatient(null);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Patient Records</h2>
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm w-80"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                        </div>
                    </div>
                    <button onClick={() => setIsAddingNew(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                        + Add New Patient
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age / Gender</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Blood Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredPatients.map(patient => (
                            <tr key={patient.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <img className="h-10 w-10 rounded-full" src={patient.avatarUrl} alt={`${patient.firstName} ${patient.lastName}`} />
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{patient.firstName} {patient.lastName}</div>
                                            <div className="text-sm text-gray-500">{patient.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{patient.contactNumber}</div>
                                    <div className="text-sm text-gray-500">{patient.contactEmail}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.age} / {patient.gender}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-700">{patient.bloodType}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => setEditingPatient(patient)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {(isAddingNew || editingPatient) && (
                <PatientFormModal
                    patient={editingPatient}
                    onClose={handleCloseModal}
                    onSave={handleSavePatient}
                />
            )}
        </div>
    );
};

export default PatientRecords;
