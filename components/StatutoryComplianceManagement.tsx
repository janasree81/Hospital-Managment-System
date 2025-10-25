import React, { useState, useMemo } from 'react';
import { User, License, ComplianceAuditLog, LicenseStatus, ComplianceStatus } from '../types';
// FIX: Added missing imports.
import { MOCK_LICENSES, MOCK_COMPLIANCE_LOGS } from '../constants';
import { getRegulatoryImpactAnalysis } from '../services/geminiService';

interface StatutoryComplianceManagementProps {
    user: User;
}

const StatutoryComplianceManagement: React.FC<StatutoryComplianceManagementProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'registry' | 'audit'>('dashboard');
    const [licenses, setLicenses] = useState<License[]>(MOCK_LICENSES);
    const [auditLogs, setAuditLogs] = useState<ComplianceAuditLog[]>(MOCK_COMPLIANCE_LOGS);
    
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [aiReport, setAiReport] = useState<{ reportTitle: string; impacts: any[] } | null>(null);

    const addAuditLog = (action: string, licenseId?: string) => {
        const newLog: ComplianceAuditLog = {
            id: `clog-${Date.now()}`,
            timestamp: new Date().toISOString(),
            user: user.name,
            action,
            licenseId,
        };
        setAuditLogs(prev => [newLog, ...prev]);
    };

    const handleRunAIAnalysis = async () => {
        setIsLoadingAI(true);
        setAiReport(null);
        try {
            const report = await getRegulatoryImpactAnalysis(licenses);
            setAiReport(report);
            addAuditLog('Performed AI regulatory impact analysis.');
        } catch (error) {
            console.error("AI Analysis failed:", error);
            alert("Failed to get AI analysis.");
        } finally {
            setIsLoadingAI(false);
        }
    };
    
    const handleInitiateRenewal = (licenseId: string) => {
        setLicenses(prev => prev.map(lic => 
            lic.id === licenseId ? { ...lic, status: LicenseStatus.Renewing } : lic
        ));
        addAuditLog(`Initiated renewal process for license ${licenseId}.`, licenseId);
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
                <h2 className="text-2xl font-bold text-gray-800">Statutory & Regulatory Compliance</h2>
                <div className="flex space-x-2 border-b">
                    <TabButton tabId="dashboard">Dashboard</TabButton>
                    <TabButton tabId="registry">License Registry</TabButton>
                    <TabButton tabId="audit">Audit Trail</TabButton>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto bg-gray-50 -m-6 p-6">
                {activeTab === 'dashboard' && <DashboardView licenses={licenses} onRunAI={handleRunAIAnalysis} isLoadingAI={isLoadingAI} aiReport={aiReport} />}
                {activeTab === 'registry' && <RegistryView licenses={licenses} onRenew={handleInitiateRenewal} />}
                {activeTab === 'audit' && <AuditTrailView logs={auditLogs} />}
            </div>
        </div>
    );
};

const DashboardView: React.FC<{ licenses: License[], onRunAI: () => void, isLoadingAI: boolean, aiReport: { reportTitle: string; impacts: any[] } | null }> = ({ licenses, onRunAI, isLoadingAI, aiReport }) => {
    const stats = useMemo(() => {
        const expiringSoon = licenses.filter(l => {
            const expiry = new Date(l.expiryDate);
            const today = new Date();
            const thirtyDays = new Date(today.getTime() + 30 * 24 * 3600 * 1000);
            return l.status === LicenseStatus.Active && expiry > today && expiry <= thirtyDays;
        }).length;
        const overdue = licenses.filter(l => l.status === LicenseStatus.Expired).length;
        const compliance = {
            [ComplianceStatus.Compliant]: licenses.filter(l => l.complianceStatus === ComplianceStatus.Compliant).length,
            [ComplianceStatus.AtRisk]: licenses.filter(l => l.complianceStatus === ComplianceStatus.AtRisk).length,
            [ComplianceStatus.NonCompliant]: licenses.filter(l => l.complianceStatus === ComplianceStatus.NonCompliant).length,
        };
        return { total: licenses.length, expiringSoon, overdue, compliance };
    }, [licenses]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-lg border"><p className="text-gray-600">Total Licenses</p><p className="text-3xl font-bold">{stats.total}</p></div>
                <div className="p-4 bg-white rounded-lg border"><p className="text-gray-600">Expiring in 30 Days</p><p className="text-3xl font-bold text-yellow-600">{stats.expiringSoon}</p></div>
                <div className="p-4 bg-white rounded-lg border"><p className="text-gray-600">Overdue</p><p className="text-3xl font-bold text-red-600">{stats.overdue}</p></div>
                {/* FIX: Use bracket notation for object keys that contain spaces to prevent syntax errors. */}
                <div className="p-4 bg-white rounded-lg border"><p className="text-gray-600">Compliance Status</p><div className="flex w-full h-4 rounded-md overflow-hidden mt-2"><div className="bg-green-500" style={{width: `${(stats.compliance[ComplianceStatus.Compliant] / (stats.total || 1)) * 100}%`}}></div><div className="bg-yellow-500" style={{width: `${(stats.compliance[ComplianceStatus.AtRisk] / (stats.total || 1)) * 100}%`}}></div><div className="bg-red-500" style={{width: `${(stats.compliance[ComplianceStatus.NonCompliant] / (stats.total || 1)) * 100}%`}}></div></div></div>
            </div>
            <div className="p-4 bg-white rounded-lg border">
                <h3 className="font-bold text-lg mb-2">AI-Powered Regulatory Analysis</h3>
                <p className="text-sm text-gray-600 mb-4">Simulate scanning for new regulations and assess their impact on your current licenses.</p>
                <button onClick={onRunAI} disabled={isLoadingAI} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-indigo-300">
                    {isLoadingAI ? 'Analyzing...' : 'Scan for Regulatory Changes with AI'}
                </button>
                {aiReport && (
                    <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <h4 className="font-bold text-indigo-800">{aiReport.reportTitle}</h4>
                        <div className="mt-2 space-y-2 text-sm">
                            {aiReport.impacts.map((impact, i) => (
                                <div key={i} className="p-2 border-b">
                                    <p><strong>License:</strong> {impact.licenseName}</p>
                                    <p><strong>Impact:</strong> {impact.impactAssessment}</p>
                                    <p><strong>Action:</strong> {impact.recommendedAction}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const RegistryView: React.FC<{ licenses: License[], onRenew: (id: string) => void }> = ({ licenses, onRenew }) => {
    const getRowClass = (license: License) => {
        if (license.status === LicenseStatus.Expired) return 'bg-red-50';
        const expiry = new Date(license.expiryDate);
        const thirtyDays = new Date(new Date().getTime() + 30 * 24 * 3600 * 1000);
        if (license.status === LicenseStatus.Active && expiry < thirtyDays) return 'bg-yellow-50';
        return '';
    };
    return (
        <div className="bg-white p-4 rounded-lg border">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50"><tr>
                        <th className="px-4 py-2 text-left font-semibold">License Name</th>
                        <th className="px-4 py-2 text-left font-semibold">Authority</th>
                        <th className="px-4 py-2 text-left font-semibold">Expiry Date</th>
                        <th className="px-4 py-2 text-left font-semibold">Status</th>
                        <th className="px-4 py-2 text-left font-semibold">Owner</th>
                        <th className="px-4 py-2"></th>
                    </tr></thead>
                    <tbody className="divide-y">
                        {licenses.map(l => (
                            <tr key={l.id} className={getRowClass(l)}>
                                <td className="px-4 py-2 font-medium">{l.name}</td>
                                <td className="px-4 py-2">{l.issuingAuthority}</td>
                                <td className="px-4 py-2">{l.expiryDate}</td>
                                <td className="px-4 py-2">{l.status}</td>
                                <td className="px-4 py-2">{l.owner}</td>
                                <td className="px-4 py-2 text-right">
                                    {l.status === LicenseStatus.Active && <button onClick={() => onRenew(l.id)} className="px-2 py-1 text-xs bg-blue-500 text-white rounded">Initiate Renewal</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AuditTrailView: React.FC<{ logs: ComplianceAuditLog[] }> = ({ logs }) => (
    <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-bold text-lg mb-2">Audit Trail</h3>
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


export default StatutoryComplianceManagement;
