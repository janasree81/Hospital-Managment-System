import React, { useState, useMemo } from 'react';
import { User, ExternalLabResult, IntegrationAuditLog } from '../types';
// FIX: Added missing imports.
import { MOCK_FHIR_OBSERVATION, MOCK_EXTERNAL_RESULTS, MOCK_INTEGRATION_LOGS } from '../constants';
import { processFhirBundle } from '../services/geminiService';

const OutsourcedTestIntegration: React.FC<{ user: User }> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'feed' | 'queue' | 'log'>('feed');
    
    const [results, setResults] = useState<ExternalLabResult[]>(MOCK_EXTERNAL_RESULTS);
    const [auditLog, setAuditLog] = useState<IntegrationAuditLog[]>(MOCK_INTEGRATION_LOGS);
    const [fhirInput, setFhirInput] = useState(MOCK_FHIR_OBSERVATION);

    const [isLoading, setIsLoading] = useState(false);

    const addLog = (action: string) => {
        const newLog: IntegrationAuditLog = {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            user: user.name,
            action: action,
        };
        setAuditLog(prev => [newLog, ...prev]);
    };

    const handleProcessBundle = async () => {
        setIsLoading(true);
        try {
            const parsedData = await processFhirBundle(fhirInput);
            const newResult: ExternalLabResult = {
                id: `ext-lab-${Date.now()}`,
                status: 'Pending Review',
                rawFhirData: fhirInput,
                ...parsedData,
            };
            setResults(prev => [newResult, ...prev]);
            addLog(`Processed FHIR bundle for ${parsedData.patientName} from ${parsedData.externalLabName}.`);
            if (parsedData.isCritical) {
                addLog(`CRITICAL VALUE FLAGGED for ${parsedData.testName} on patient ${parsedData.patientName}.`);
            }
            setActiveTab('queue'); // Switch to queue to see the new result
        } catch (error) {
            console.error(error);
            alert('Failed to process FHIR bundle. Check the data format.');
            addLog(`Failed to process incoming FHIR bundle. Error.`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleVerifyResult = (resultId: string) => {
        setResults(prev => prev.map(r => r.id === resultId ? { ...r, status: 'Verified' } : r));
        const result = results.find(r => r.id === resultId);
        if (result) {
            addLog(`Verified result ${result.id} (${result.testName}) for patient ${result.patientName}.`);
        }
    };

    const TabButton: React.FC<{ tabId: typeof activeTab, children: React.ReactNode }> = ({ tabId, children }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md ${activeTab === tabId ? 'bg-gray-100 border-b-2 border-indigo-600' : 'text-gray-500'}`}
        >
            {children}
        </button>
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">Outsourced Test Integration</h2>
                <div className="flex space-x-2 border-b">
                    <TabButton tabId="feed">Incoming FHIR Feed</TabButton>
                    <TabButton tabId="queue">Processing Queue</TabButton>
                    <TabButton tabId="log">Audit Log</TabButton>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto bg-gray-50 -m-6 p-6">
                {activeTab === 'feed' && <FeedView fhirInput={fhirInput} setFhirInput={setFhirInput} onProcess={handleProcessBundle} isLoading={isLoading} />}
                {activeTab === 'queue' && <QueueView results={results} onVerify={handleVerifyResult} />}
                {activeTab === 'log' && <LogView logs={auditLog} />}
            </div>
        </div>
    );
};

const FeedView: React.FC<{ fhirInput: string, setFhirInput: (v: string) => void, onProcess: () => void, isLoading: boolean }> = ({ fhirInput, setFhirInput, onProcess, isLoading }) => (
    <div className="space-y-4">
        <h3 className="text-xl font-bold">Simulated API Endpoint</h3>
        <p className="text-sm text-gray-600">This simulates a new FHIR Observation bundle being received from an external lab's API.</p>
        <textarea
            value={fhirInput}
            onChange={(e) => setFhirInput(e.target.value)}
            rows={15}
            className="w-full p-2 border rounded-md font-mono text-xs bg-gray-900 text-green-400"
        />
        <button onClick={onProcess} disabled={isLoading} className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
            {isLoading ? 'Processing with AI...' : 'Process Incoming Bundle'}
        </button>
    </div>
);

const QueueView: React.FC<{ results: ExternalLabResult[], onVerify: (id: string) => void }> = ({ results, onVerify }) => {
    const getStatusColor = (status: ExternalLabResult['status']) => {
        if (status === 'Pending Review') return 'bg-yellow-100 text-yellow-800';
        if (status === 'Verified') return 'bg-green-100 text-green-800';
        return 'bg-red-100 text-red-800';
    };
    return (
        <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-bold text-lg mb-2">Processing Queue</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50"><tr>
                        <th className="px-4 py-2 text-left">Patient</th>
                        <th className="px-4 py-2 text-left">Test</th>
                        <th className="px-4 py-2 text-left">Result</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2"></th>
                    </tr></thead>
                    <tbody className="divide-y">
                        {results.map(r => (
                            <tr key={r.id} className={r.isCritical ? 'bg-red-50' : ''}>
                                <td className="px-4 py-2 font-semibold">{r.patientName}</td>
                                <td className="px-4 py-2">{r.testName}<div className="text-xs text-gray-500">{r.externalLabName}</div></td>
                                <td className={`px-4 py-2 font-mono ${r.isCritical ? 'font-bold text-red-600' : ''}`}>{r.resultValue} {r.units} <span className="text-gray-500">({r.referenceRange})</span></td>
                                <td className="px-4 py-2"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(r.status)}`}>{r.status}</span></td>
                                <td className="px-4 py-2 text-right">
                                    {r.status === 'Pending Review' && <button onClick={() => onVerify(r.id)} className="px-3 py-1 text-xs bg-blue-500 text-white rounded">Verify & Push to EMR</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const LogView: React.FC<{ logs: IntegrationAuditLog[] }> = ({ logs }) => (
    <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-bold text-lg mb-2">Audit Log</h3>
        <div className="space-y-2 max-h-[calc(100vh-18rem)] overflow-y-auto">
            {logs.map(log => (
                <div key={log.id} className="p-2 bg-gray-50 border-l-4 border-gray-300">
                    <p className="text-sm font-mono text-gray-800">{log.action}</p>
                    <p className="text-xs text-gray-500 text-right">-- {log.user} at {new Date(log.timestamp).toLocaleString()}</p>
                </div>
            ))}
        </div>
    </div>
);


export default OutsourcedTestIntegration;