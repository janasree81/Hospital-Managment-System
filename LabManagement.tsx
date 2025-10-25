import React, { useState, useMemo } from 'react';
import { LabTest, Role, User, Patient, TestResultItem } from '../types';
import { MOCK_LAB_TESTS, MOCK_PATIENTS, MOCK_STAFF } from '../constants';

interface LabManagementProps {
    user: User;
}

const LabManagement: React.FC<LabManagementProps> = ({ user }) => {
    const [labTests, setLabTests] = useState<LabTest[]>(MOCK_LAB_TESTS.sort((a, b) => new Date(b.dateOrdered).getTime() - new Date(a.dateOrdered).getTime()));
    const [showNewTestForm, setShowNewTestForm] = useState(false);
    const [editingTest, setEditingTest] = useState<LabTest | null>(null);
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

    const TEST_CATEGORIES: LabTest['testCategory'][] = ['Pathology', 'Microbiology', 'Biochemistry', 'Hematology', 'Radiology', 'Histopathology', 'Special Panel'];

    const initialNewTestState = {
        patientId: '',
        doctorName: '',
        testName: '',
        testCategory: 'Pathology' as LabTest['testCategory'],
        sampleType: 'Blood',
        sampleCollectionDate: new Date().toISOString().slice(0, 16),
        sampleId: `S${Date.now().toString().slice(-6)}`,
    };
    const [newTest, setNewTest] = useState(initialNewTestState);

    const doctors = useMemo(() => MOCK_STAFF.filter(s => s.role === Role.Doctor), []);
    const labStaff = useMemo(() => MOCK_STAFF.filter(s => s.role === Role.LabTech), []);
    const patientsList = useMemo(() => MOCK_PATIENTS, []);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewTest(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const patient = patientsList.find(p => p.id === newTest.patientId);
        if (!patient) return;

        const testToAdd: LabTest = {
            id: `lab${Date.now()}`,
            patientName: `${patient.firstName} ${patient.lastName}`,
            dateOrdered: new Date().toISOString().split('T')[0],
            status: 'Pending',
            isCritical: false,
            safetyProtocolsFollowed: true,
            results: [],
            ...newTest
        };
        setLabTests(prev => [testToAdd, ...prev]);
        setShowNewTestForm(false);
        setNewTest(initialNewTestState);
    };

    const handleUpdateStatus = (testId: string, status: LabTest['status']) => {
        setLabTests(prev => prev.map(test =>
            test.id === testId ? { ...test, status } : test
        ));
    };

    const handleSaveResults = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTest) return;

        setLabTests(prev => prev.map(test =>
            test.id === editingTest.id 
            ? { ...editingTest, status: 'Completed', reportGeneratedDate: new Date().toISOString() } 
            : test
        ));
        setEditingTest(null);
    };
    
    const toggleRow = (id: string) => {
        setExpandedRowId(prevId => (prevId === id ? null : id));
    };

    const getStatusColor = (status: LabTest['status']) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'In Progress': return 'bg-blue-100 text-blue-800';
            case 'Completed': return 'bg-green-100 text-green-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
        }
    };
    
    const ReportView: React.FC<{ test: LabTest, patient: Patient | undefined }> = ({ test, patient }) => (
        <div className="p-6 bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg border">
                <div className="flex justify-between items-start pb-4 border-b">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800">Laboratory Report</h3>
                        <p className="text-sm text-gray-500">HMS Connect</p>
                    </div>
                    {test.isCritical && <div className="px-3 py-1 bg-red-100 text-red-700 font-bold rounded-full text-sm">CRITICAL RESULT</div>}
                </div>
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 py-4 border-b">
                    <div><strong className="text-gray-600">Patient Name:</strong> {test.patientName}</div>
                    <div><strong className="text-gray-600">Patient ID:</strong> {test.patientId}</div>
                    <div><strong className="text-gray-600">Age / Gender:</strong> {patient?.age} / {patient?.gender}</div>
                    <div><strong className="text-gray-600">Referring Doctor:</strong> {test.doctorName}</div>
                    <div><strong className="text-gray-600">Sample ID:</strong> {test.sampleId}</div>
                    <div><strong className="text-gray-600">Sample Type:</strong> {test.sampleType}</div>
                    <div><strong className="text-gray-600">Collection Date:</strong> {new Date(test.sampleCollectionDate).toLocaleString()}</div>
                    <div><strong className="text-gray-600">Report Date:</strong> {test.reportGeneratedDate ? new Date(test.reportGeneratedDate).toLocaleString() : 'N/A'}</div>
                </div>

                <div className="py-4">
                    <h4 className="text-xl font-semibold text-gray-800 mb-2">{test.testName} ({test.testCategory})</h4>
                    
                    {test.results && test.results.length > 0 ? (
                         <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 border">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reference Range</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {test.results.map((item, index) => (
                                        <tr key={index} className={item.isAbnormal ? 'bg-red-50' : ''}>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-800">{item.name}</td>
                                            <td className={`px-4 py-2 whitespace-nowrap text-sm font-bold ${item.isAbnormal ? 'text-red-600' : 'text-gray-900'}`}>{item.value}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{item.unit}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{item.referenceRange}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <p className="text-sm text-gray-600 italic">No structured results for this test type.</p>}

                    {test.interpretation && (
                        <div className="mt-4">
                            <h5 className="font-semibold text-gray-700">Interpretation</h5>
                            <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-md mt-1 border">{test.interpretation}</p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-8 pt-4 border-t">
                     <div>
                        <h5 className="font-semibold text-gray-700">Additional Information</h5>
                        <p className="text-xs text-gray-600 mt-1"><strong>Method:</strong> {test.testMethod || 'N/A'}</p>
                        <p className="text-xs text-gray-600"><strong>Notes:</strong> {test.additionalNotes || 'None'}</p>
                        <p className="text-xs text-gray-600"><strong>Safety Compliance:</strong> {test.safetyProtocolsFollowed ? 'Adhered' : 'Not Adhered'}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-gray-200 flex items-center justify-center text-xs text-gray-500">[QR Code]</div>
                         <div className="w-48 h-12 mt-2 border-b border-gray-400 border-dashed"></div>
                        <p className="text-sm font-semibold mt-1">{test.verifiedBy || 'Pending Verification'}</p>
                        <p className="text-xs text-gray-500">Signature, Lab-in-charge / Pathologist</p>
                    </div>
                </div>

                 <div className="flex justify-end space-x-2 pt-6">
                    <button className="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300">Print Report</button>
                    <button className="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300">Email to Patient</button>
                    <button className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Send to Doctor</button>
                </div>
            </div>
        </div>
    );
    
    // Results Entry Modal Dynamic Fields
    const handleResultItemChange = (index: number, field: keyof TestResultItem, value: any) => {
        if (!editingTest || !editingTest.results) return;
        const updatedResults = [...editingTest.results];
        (updatedResults[index] as any)[field] = value;
        setEditingTest({...editingTest, results: updatedResults});
    };
    const addResultItem = () => {
        if (!editingTest) return;
        const newItem: TestResultItem = { name: '', value: '', unit: '', referenceRange: '', isAbnormal: false };
        setEditingTest({
            ...editingTest,
            results: [...(editingTest.results || []), newItem]
        });
    };
    const removeResultItem = (index: number) => {
        if (!editingTest || !editingTest.results) return;
        setEditingTest({
            ...editingTest,
            results: editingTest.results.filter((_, i) => i !== index)
        });
    }

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Lab Report Center</h2>
                    {user.role === Role.LabTech && (
                        <button onClick={() => setShowNewTestForm(!showNewTestForm)} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                            {showNewTestForm ? 'Cancel' : '+ New Test Request'}
                        </button>
                    )}
                </div>

                {showNewTestForm && (
                    <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 p-6 border rounded-lg bg-gray-50">
                        {/* Form fields... */}
                        <div className="lg:col-span-1">
                            <label htmlFor="patientId" className="block text-sm font-medium text-gray-700">Patient</label>
                            <select name="patientId" value={newTest.patientId} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border bg-white rounded-md">
                                <option value="">Select Patient</option>
                                {patientsList.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} (ID: {p.id})</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="doctorName" className="block text-sm font-medium text-gray-700">Ordering Doctor</label>
                            <select name="doctorName" value={newTest.doctorName} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border bg-white rounded-md">
                                <option value="">Select Doctor</option>
                                {doctors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="testCategory" className="block text-sm font-medium text-gray-700">Test Category</label>
                            <select name="testCategory" value={newTest.testCategory} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border bg-white rounded-md">
                                {TEST_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="testName" className="block text-sm font-medium text-gray-700">Test Name</label>
                            <input type="text" name="testName" value={newTest.testName} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border rounded-md" />
                        </div>
                         <div>
                            <label htmlFor="sampleType" className="block text-sm font-medium text-gray-700">Sample Type</label>
                            <input type="text" name="sampleType" value={newTest.sampleType} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="sampleCollectionDate" className="block text-sm font-medium text-gray-700">Sample Collection Date/Time</label>
                            <input type="datetime-local" name="sampleCollectionDate" value={newTest.sampleCollectionDate} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border rounded-md" />
                        </div>
                        <div className="col-span-full text-right">
                            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Add Request</button>
                        </div>
                    </form>
                )}

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Report</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                {user.role === Role.LabTech && <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {labTests.map(test => {
                                const patient = patientsList.find(p => p.id === test.patientId);
                                return (
                                <React.Fragment key={test.id}>
                                <tr className="hover:bg-gray-50">
                                    <td className="px-6 py-4"><button onClick={() => toggleRow(test.id)} className="text-indigo-600 hover:text-indigo-800"><svg className={`w-5 h-5 transition-transform ${expandedRowId === test.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></button></td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium flex items-center">{test.isCritical && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>}{test.patientName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{test.testName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{test.testCategory}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{test.dateOrdered}</td>
                                    <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(test.status)}`}>{test.status}</span></td>
                                    {user.role === Role.LabTech && (<td className="px-6 py-4 whitespace-nowrap text-center space-x-2">{test.status === 'Pending' && <button onClick={() => handleUpdateStatus(test.id, 'In Progress')} className="px-3 py-1 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600">Start</button>}{test.status === 'In Progress' && <button onClick={() => setEditingTest(test)} className="px-3 py-1 text-sm text-white bg-green-500 rounded-md hover:bg-green-600">Enter Results</button>}</td>)}
                                </tr>
                                {expandedRowId === test.id && (<tr><td colSpan={7}><ReportView test={test} patient={patient} /></td></tr>)}
                                </React.Fragment>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingTest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <h3 className="text-xl font-bold mb-4 text-gray-800 flex-shrink-0">Enter Results for {editingTest.testName}</h3>
                        <form onSubmit={handleSaveResults} className="flex-grow overflow-y-auto pr-2 space-y-4">
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Results</label>
                                <div className="space-y-2 mt-1 p-2 border rounded-md bg-gray-50">
                                    <div className="grid grid-cols-12 gap-x-2 text-xs font-medium text-gray-500 px-1">
                                        <div className="col-span-3">Test Name</div>
                                        <div className="col-span-2">Value</div>
                                        <div className="col-span-2">Unit</div>
                                        <div className="col-span-3">Reference Range</div>
                                        <div className="col-span-2 text-center">Abnormal</div>
                                    </div>
                                    {(editingTest.results || []).map((item, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-x-2 items-center">
                                            <input type="text" placeholder="e.g. Hemoglobin" value={item.name} onChange={e => handleResultItemChange(index, 'name', e.target.value)} required className="col-span-3 mt-1 block w-full text-sm p-1 border rounded-md"/>
                                            <input type="text" placeholder="e.g. 12.5" value={item.value} onChange={e => handleResultItemChange(index, 'value', e.target.value)} required className="col-span-2 mt-1 block w-full text-sm p-1 border rounded-md"/>
                                            <input type="text" placeholder="e.g. g/dL" value={item.unit} onChange={e => handleResultItemChange(index, 'unit', e.target.value)} className="col-span-2 mt-1 block w-full text-sm p-1 border rounded-md"/>
                                            <input type="text" placeholder="e.g. 11.5-15.5" value={item.referenceRange} onChange={e => handleResultItemChange(index, 'referenceRange', e.target.value)} className="col-span-3 mt-1 block w-full text-sm p-1 border rounded-md"/>
                                            <div className="col-span-2 flex items-center justify-around">
                                                <input type="checkbox" checked={item.isAbnormal} onChange={e => handleResultItemChange(index, 'isAbnormal', e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded"/>
                                                <button type="button" onClick={() => removeResultItem(index)} className="text-red-500 hover:text-red-700">&times;</button>
                                            </div>
                                        </div>
                                    ))}
                                    <button type="button" onClick={addResultItem} className="text-sm text-indigo-600 hover:text-indigo-800">+ Add Result Item</button>
                                </div>
                            </div>

                             <div>
                                <label className="block text-sm font-medium text-gray-700">Interpretation</label>
                                <textarea rows={3} value={editingTest.interpretation || ''} onChange={e => setEditingTest({...editingTest, interpretation: e.target.value})} className="mt-1 w-full border rounded-md p-2 text-sm" />
                            </div>

                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">Test Method / Panel</label>
                                    <input type="text" value={editingTest.testMethod || ''} onChange={e => setEditingTest({...editingTest, testMethod: e.target.value})} className="mt-1 w-full border rounded-md p-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Verified By</label>
                                     <select value={editingTest.verifiedBy || ''} onChange={e => setEditingTest({...editingTest, verifiedBy: e.target.value})} required className="mt-1 w-full border rounded-md p-2 text-sm bg-white">
                                        <option value="">Select Staff</option>
                                        {labStaff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Additional Notes / Compliance</label>
                                <textarea rows={2} value={editingTest.additionalNotes || ''} onChange={e => setEditingTest({...editingTest, additionalNotes: e.target.value})} className="mt-1 w-full border rounded-md p-2 text-sm" />
                            </div>

                             <div className="flex items-center">
                                <input id="isCritical" type="checkbox" checked={editingTest.isCritical} onChange={e => setEditingTest({...editingTest, isCritical: e.target.checked})} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                                <label htmlFor="isCritical" className="ml-2 block text-sm font-medium text-red-600">Flag as Critical Value</label>
                            </div>
                        </form>
                         <div className="mt-6 flex justify-end space-x-3 flex-shrink-0">
                            <button type="button" onClick={() => setEditingTest(null)} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                            <button type="submit" onClick={handleSaveResults} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Save & Complete Report</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabManagement;