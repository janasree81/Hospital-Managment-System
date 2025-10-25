import React, { useState, useMemo } from 'react';
import { Patient, Vital, User } from '../types';
import { MOCK_PATIENTS } from '../constants';

// FIX: Add props interface to accept the logged-in user.
interface PatientVitalsProps {
    user: User;
}

// FIX: Accept `user` prop to correctly log who recorded the vitals.
const PatientVitals: React.FC<PatientVitalsProps> = ({ user }) => {
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [showForm, setShowForm] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // FIX: Define an initial state object to reuse for state and reset.
  const initialVitalState: Omit<Vital, 'timestamp' | 'loggedBy' | 'map' | 'cvp'> = {
      bloodPressure: '',
      heartRate: 0,
      temperature: 0,
      respiratoryRate: 0,
      oxygenSaturation: 0,
  };

  // FIX line 10: State should only contain form fields, not generated fields like timestamp.
  // The type is updated to reflect this, resolving the error about missing properties.
  const [newVitalData, setNewVitalData] = useState(initialVitalState);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type } = e.target;
      setNewVitalData(prev => ({
          ...prev,
          [name]: type === 'number' ? parseFloat(value) || 0 : value
      }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
        alert("Please select a patient.");
        return;
    }

    // FIX line 34: Use `timestamp` and `loggedBy` according to the Vital type, removing the incorrect `date` property.
    const newVital: Vital = {
        timestamp: new Date().toISOString(),
        loggedBy: user.name,
        ...newVitalData,
    };

    setPatients(prevPatients =>
        prevPatients.map(p =>
            p.id === selectedPatientId
                ? { ...p, vitals: [newVital, ...p.vitals] }
                : p
        )
    );

    setShowForm(false);
    setSelectedPatientId('');
    // FIX line 48: Reset state to the initial state object, which matches the required type.
    setNewVitalData(initialVitalState);
  };

  const filteredPatients = useMemo(() =>
    patients.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [patients, searchTerm]
  );
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Patient Vitals</h2>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            {showForm ? 'Cancel' : '+ Record Vitals'}
        </button>
      </div>
      
      {showForm && (
          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-6 border rounded-lg bg-gray-50">
             <div className="col-span-full">
                <label htmlFor="patient-select" className="block text-sm font-medium text-gray-700">Select Patient</label>
                <select id="patient-select" value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm">
                    <option value="">-- Please select a patient --</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-sm font-medium">Blood Pressure</label>
                <input name="bloodPressure" value={newVitalData.bloodPressure} onChange={handleInputChange} className="mt-1 w-full border rounded-md p-2"/>
             </div>
              <div>
                <label className="block text-sm font-medium">Heart Rate (bpm)</label>
                <input name="heartRate" type="number" value={newVitalData.heartRate} onChange={handleInputChange} className="mt-1 w-full border rounded-md p-2"/>
             </div>
              <div>
                <label className="block text-sm font-medium">Temperature (°F)</label>
                <input name="temperature" type="number" step="0.1" value={newVitalData.temperature} onChange={handleInputChange} className="mt-1 w-full border rounded-md p-2"/>
             </div>
              <div>
                <label className="block text-sm font-medium">Respiratory Rate (bpm)</label>
                <input name="respiratoryRate" type="number" value={newVitalData.respiratoryRate} onChange={handleInputChange} className="mt-1 w-full border rounded-md p-2"/>
             </div>
              <div>
                <label className="block text-sm font-medium">Oxygen Saturation (%)</label>
                <input name="oxygenSaturation" type="number" value={newVitalData.oxygenSaturation} onChange={handleInputChange} className="mt-1 w-full border rounded-md p-2"/>
             </div>
             <div className="col-span-full text-right">
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save Vitals</button>
             </div>
          </form>
      )}

      <input
        type="text"
        placeholder="Search patients..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 border rounded-md mb-4"
      />

      <div className="space-y-6">
        {filteredPatients.map(patient => (
            <div key={patient.id} className="p-4 border rounded-lg">
                <h3 className="font-bold text-lg">{patient.firstName} {patient.lastName}</h3>
                <div className="overflow-x-auto mt-2">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left">Date</th>
                                <th className="px-4 py-2 text-left">BP</th>
                                <th className="px-4 py-2 text-left">HR</th>
                                <th className="px-4 py-2 text-left">Temp</th>
                                <th className="px-4 py-2 text-left">RR</th>
                                <th className="px-4 py-2 text-left">SpO2</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {patient.vitals.slice(0, 5).map((vital, i) => (
                                <tr key={i}>
                                    {/* FIX line 135: Use `timestamp` property instead of `date`. */}
                                    <td className="px-4 py-2">{new Date(vital.timestamp).toLocaleString()}</td>
                                    <td className="px-4 py-2">{vital.bloodPressure}</td>
                                    <td className="px-4 py-2">{vital.heartRate}</td>
                                    <td className="px-4 py-2">{vital.temperature}</td>
                                    <td className="px-4 py-2">{vital.respiratoryRate}</td>
                                    <td className="px-4 py-2">{vital.oxygenSaturation}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default PatientVitals;