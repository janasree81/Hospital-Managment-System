import React, { useMemo } from 'react';
import { User, Patient } from '../types';
import { MOCK_PATIENTS } from '../constants';

interface PatientVitalsViewProps {
    user: User;
}

const PatientVitalsView: React.FC<PatientVitalsViewProps> = ({ user }) => {
    // In a real app, you might fetch this data. Here, we find it from the mock data.
    const patientData = useMemo(() => 
        MOCK_PATIENTS.find(p => p.id === user.id || p.contactEmail === user.email),
        [user]
    );

    if (!patientData) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-800">My Vitals</h2>
                <p className="mt-4 text-gray-600">Could not find your patient record to display vitals.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">My Vitals History</h2>
            <p className="text-sm text-gray-600 mb-6">This is a read-only view of your vital signs as recorded by our staff.</p>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Blood Pressure</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Heart Rate</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Temperature</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Oxygen Sat.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Logged By</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {patientData.vitals.length > 0 ? (
                            patientData.vitals.map((vital) => (
                                <tr key={vital.timestamp}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(vital.timestamp).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vital.bloodPressure}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vital.heartRate} bpm</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vital.temperature}°F</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vital.oxygenSaturation}%</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vital.loggedBy}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No vitals have been recorded for you yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PatientVitalsView;
