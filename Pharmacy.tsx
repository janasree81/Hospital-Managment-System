import React, { useState, useMemo } from 'react';
import { Prescription, Drug, Role, Patient } from '../types';
import { MOCK_PRESCRIPTIONS, MOCK_DRUGS, MOCK_PATIENTS, MOCK_STAFF } from '../constants';

const Pharmacy: React.FC = () => {
    const [prescriptions, setPrescriptions] = useState<Prescription[]>(MOCK_PRESCRIPTIONS);
    const [drugs, setDrugs] = useState<Drug[]>(MOCK_DRUGS);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [newPrescription, setNewPrescription] = useState({
        patientId: '',
        doctorName: '',
        drugId: '',
        quantity: 1,
        date: new Date().toISOString().split('T')[0],
    });

    const doctors = useMemo(() => MOCK_STAFF.filter(s => s.role === Role.Doctor), []);
    const patientsList = useMemo(() => MOCK_PATIENTS, []);
    const selectedDrugForForm = useMemo(() => drugs.find(d => d.id === newPrescription.drugId), [drugs, newPrescription.drugId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewPrescription(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const patient = patientsList.find(p => p.id === newPrescription.patientId);

        if (!selectedDrugForForm || !patient || !newPrescription.doctorName) {
            alert('Please fill out all fields.');
            return;
        }

        const prescriptionToAdd: Prescription = {
            id: `presc${Date.now()}`,
            patientId: newPrescription.patientId,
            patientName: `${patient.firstName} ${patient.lastName}`,
            doctorName: newPrescription.doctorName,
            drugName: selectedDrugForForm.name,
            dosage: selectedDrugForForm.dosage,
            quantity: Number(newPrescription.quantity),
            date: newPrescription.date,
            status: 'Pending',
        };

        setPrescriptions(prev => [prescriptionToAdd, ...prev]);
        setShowForm(false);
        setNewPrescription({ patientId: '', doctorName: '', drugId: '', quantity: 1, date: new Date().toISOString().split('T')[0] });
    };

    const handleFillPrescription = (prescriptionId: string) => {
        const prescription = prescriptions.find(p => p.id === prescriptionId);
        if (!prescription) return;

        const drugIndex = drugs.findIndex(d => d.name === prescription.drugName);
        if (drugIndex === -1) {
            alert(`Drug "${prescription.drugName}" not found in inventory.`);
            return;
        }

        const drug = drugs[drugIndex];
        if (drug.stock < prescription.quantity) {
            alert(`Not enough stock for "${drug.name}". Required: ${prescription.quantity}, Available: ${drug.stock}.`);
            return;
        }

        // Update prescription status
        setPrescriptions(prev => prev.map(p => p.id === prescriptionId ? { ...p, status: 'Filled' } : p));

        // Update drug stock
        setDrugs(prev => prev.map(d => d.id === drug.id ? { ...d, stock: d.stock - prescription.quantity } : d));
    };

    const handleCancelPrescription = (prescriptionId: string) => {
        setPrescriptions(prev => prev.map(p => p.id === prescriptionId ? { ...p, status: 'Cancelled' } : p));
    };

    const getStatusColor = (status: 'Pending' | 'Filled' | 'Cancelled') => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Filled': return 'bg-green-100 text-green-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
        }
    };
    
    const pendingPrescriptions = prescriptions.filter(p => p.status === 'Pending');
    const processedPrescriptions = prescriptions.filter(p => p.status !== 'Pending');

    const filteredDrugs = useMemo(() =>
        drugs.filter(drug =>
            drug.name.toLowerCase().includes(searchTerm.toLowerCase())
        ), [drugs, searchTerm]
    );

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Pending Prescriptions</h2>
                    <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        {showForm ? 'Cancel' : '+ New Prescription'}
                    </button>
                </div>

                {showForm && (
                     <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 p-6 border rounded-lg bg-gray-50">
                        <div className="col-span-1">
                            <label htmlFor="patientId" className="block text-sm font-medium text-gray-700">Patient</label>
                            <select name="patientId" value={newPrescription.patientId} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border bg-white rounded-md shadow-sm">
                                <option value="">Select Patient</option>
                                {patientsList.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                            </select>
                        </div>
                         <div className="col-span-1">
                            <label htmlFor="doctorName" className="block text-sm font-medium text-gray-700">Doctor</label>
                            <select name="doctorName" value={newPrescription.doctorName} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border bg-white rounded-md shadow-sm">
                                <option value="">Select Doctor</option>
                                {doctors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label htmlFor="drugId" className="block text-sm font-medium text-gray-700">Drug</label>
                            <select name="drugId" value={newPrescription.drugId} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border bg-white rounded-md shadow-sm">
                                <option value="">Select Drug</option>
                                {drugs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                         <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Dosage</label>
                            <input type="text" readOnly value={selectedDrugForForm?.dosage || ''} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"/>
                        </div>
                         <div className="col-span-1">
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                            <input type="number" name="quantity" min="1" value={newPrescription.quantity} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                        </div>
                        <div className="col-span-full md:col-span-1 text-right self-end">
                            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 w-full md:w-auto">Add Prescription</button>
                        </div>
                    </form>
                )}

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Drug</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {pendingPrescriptions.length > 0 ? pendingPrescriptions.map(p => (
                                <tr key={p.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{p.patientName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{p.doctorName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{p.drugName} ({p.dosage})</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{p.quantity}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{p.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center space-x-2">
                                        <button onClick={() => handleFillPrescription(p.id)} className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Fill</button>
                                        <button onClick={() => handleCancelPrescription(p.id)} className="px-3 py-1 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600">Cancel</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-4 text-gray-500">No pending prescriptions.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Drug Inventory */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Drug Inventory</h2>
                    <input 
                        type="text"
                        placeholder="Search for a drug..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                 <div className="overflow-x-auto max-h-96">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                             <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Drug Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dosage</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                            </tr>
                        </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                            {filteredDrugs.map(d => (
                                <tr key={d.id} className={d.stock < 10 ? 'bg-red-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{d.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{d.dosage}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap font-semibold ${d.stock < 10 ? 'text-red-600' : 'text-gray-900'}`}>{d.stock} {d.unit}(s)</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Processed Prescriptions History */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Processed Prescriptions</h2>
                 <div className="overflow-x-auto max-h-64">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Drug</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                           {processedPrescriptions.map(p => (
                               <tr key={p.id}>
                                   <td className="px-6 py-4 whitespace-nowrap">{p.patientName}</td>
                                   <td className="px-6 py-4 whitespace-nowrap">{p.drugName}</td>
                                   <td className="px-6 py-4 whitespace-nowrap">{p.date}</td>
                                   <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(p.status)}`}>
                                            {p.status}
                                        </span>
                                   </td>
                               </tr>
                           ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default Pharmacy;
