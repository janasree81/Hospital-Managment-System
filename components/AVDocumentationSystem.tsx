import React, { useState, useMemo } from 'react';
import { User, AVContent, AVAccessLogEntry } from '../types';
// FIX: Added missing import for MOCK_AV_CONTENT.
import { MOCK_AV_CONTENT } from '../constants';
import { getAVMetadataSuggestions } from '../services/geminiService';

const AVDocumentationSystem: React.FC<{ user: User }> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'library'>('library');
    const [content, setContent] = useState<AVContent[]>(MOCK_AV_CONTENT);
    const [modal, setModal] = useState<{ type: 'upload' | 'details', data?: AVContent } | null>(null);

    const handleOpenDetails = (item: AVContent) => {
        const newLog: AVAccessLogEntry = {
            timestamp: new Date().toISOString(),
            userName: user.name,
            action: 'Viewed',
        };
        const updatedItem = { ...item, accessLog: [newLog, ...item.accessLog] };
        setContent(prev => prev.map(c => c.id === item.id ? updatedItem : c));
        setModal({ type: 'details', data: updatedItem });
    };
    
    const handleSaveContent = (newItem: Omit<AVContent, 'id' | 'accessLog'>) => {
        const fullItem: AVContent = {
            id: `av${Date.now()}`,
            accessLog: [],
            ...newItem
        };
        setContent(prev => [fullItem, ...prev]);
        setModal(null);
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
                <h2 className="text-2xl font-bold text-gray-800">AV Documentation System</h2>
                <div className="flex space-x-2 border-b">
                    <TabButton tabId="library">Content Library</TabButton>
                    <TabButton tabId="dashboard">Dashboard</TabButton>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto bg-gray-50 -m-6 p-6">
                {activeTab === 'library' && <ContentLibraryView content={content} onOpenDetails={handleOpenDetails} onUpload={() => setModal({ type: 'upload' })} />}
                {activeTab === 'dashboard' && <DashboardView content={content} />}
            </div>
            {modal?.type === 'upload' && <UploadModal user={user} onSave={handleSaveContent} onClose={() => setModal(null)} />}
            {modal?.type === 'details' && modal.data && <DetailsModal item={modal.data} onClose={() => setModal(null)} />}
        </div>
    );
};

const ContentLibraryView: React.FC<{ content: AVContent[], onOpenDetails: (item: AVContent) => void, onUpload: () => void }> = ({ content, onOpenDetails, onUpload }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredContent = useMemo(() => 
        content.filter(c =>
            c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        ), [content, searchTerm]);

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <input type="text" placeholder="Search by title or tag..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-1/3 p-2 border rounded-md"/>
                <button onClick={onUpload} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Upload Content</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredContent.map(item => (
                    <div key={item.id} onClick={() => onOpenDetails(item)} className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer group">
                        <img src={item.thumbnailUrl} alt={item.title} className="w-full h-40 object-cover"/>
                        <div className="p-4">
                            <h4 className="font-bold truncate group-hover:text-indigo-600">{item.title}</h4>
                            <p className="text-xs text-gray-500">{item.duration} | {new Date(item.uploadDate).toLocaleDateString()}</p>
                            <div className="mt-2 flex flex-wrap gap-1">{(item.tags || []).slice(0,3).map(tag => <span key={tag} className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">{tag}</span>)}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DashboardView: React.FC<{ content: AVContent[] }> = ({ content }) => {
    const stats = useMemo(() => {
        const expiringSoon = content.filter(c => {
            if (c.retentionPeriod.includes('Year')) {
                const years = parseInt(c.retentionPeriod.split(' ')[0]);
                const expiryDate = new Date(c.uploadDate);
                expiryDate.setFullYear(expiryDate.getFullYear() + years);
                const ninetyDaysFromNow = new Date();
                ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
                return expiryDate < ninetyDaysFromNow;
            }
            return false;
        });
        const categories = content.reduce((acc, c) => {
            acc[c.complianceCategory] = (acc[c.complianceCategory] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return { total: content.length, expiringSoon: expiringSoon.length, categories };
    }, [content]);

    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-lg border"><p className="text-gray-600">Total Assets</p><p className="text-3xl font-bold">{stats.total}</p></div>
                <div className="p-4 bg-white rounded-lg border"><p className="text-gray-600">Nearing Retention Expiry</p><p className="text-3xl font-bold text-yellow-600">{stats.expiringSoon}</p></div>
            </div>
            <div className="p-4 bg-white rounded-lg border">
                <h3 className="font-bold mb-2">Content by Compliance Category</h3>
                <div className="space-y-2">
                    {Object.entries(stats.categories).map(([cat, count]) => (
                        <div key={cat}>
                            <div className="flex justify-between mb-1">
                                <span className="text-base font-medium text-indigo-700">{cat}</span>
                                <span className="text-sm font-medium text-indigo-700">{count}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${(count / (stats.total || 1) * 100)}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const UploadModal: React.FC<{ user: User, onSave: (item: Omit<AVContent, 'id' | 'accessLog'>) => void, onClose: () => void }> = ({ user, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        fileName: '',
        duration: '00:00',
        thumbnailUrl: `https://picsum.photos/seed/newav${Date.now()}/400/300`,
        tags: [] as string[],
        complianceCategory: 'Clinical Training' as AVContent['complianceCategory'],
        retentionPeriod: '5 Years' as AVContent['retentionPeriod'],
    });
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    };
    
    const handleGetAISuggestions = async () => {
        if (!formData.title.trim()) {
            alert("Please provide a title first.");
            return;
        }
        setIsLoadingAI(true);
        try {
            const { suggestedTags, summary } = await getAVMetadataSuggestions(formData.title, formData.description);
            setFormData(p => ({
                ...p,
                tags: suggestedTags,
                description: p.description || summary,
            }));
        } catch (error) {
            console.error(error);
            alert("Failed to get AI suggestions.");
        } finally {
            setIsLoadingAI(false);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            uploadDate: new Date().toISOString(),
            uploadedBy: user.name,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-full overflow-y-auto space-y-4">
                <h3 className="text-xl font-bold">Upload New AV Content</h3>
                <div><label className="text-sm">Title</label><input name="title" onChange={handleChange} required className="mt-1 w-full border rounded p-2"/></div>
                <div><label className="text-sm">Description</label><textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 w-full border rounded p-2"/></div>
                <div>
                    <div className="flex justify-between items-center">
                        <label className="text-sm">Tags (comma-separated)</label>
                        <button type="button" onClick={handleGetAISuggestions} disabled={isLoadingAI} className="text-xs px-2 py-1 bg-indigo-500 text-white rounded disabled:bg-gray-400">
                            {isLoadingAI ? '...' : 'Get AI Suggestions'}
                        </button>
                    </div>
                    <input name="tags" value={(formData.tags || []).join(', ')} onChange={e => setFormData(p => ({...p, tags: e.target.value.split(',').map(t=>t.trim())}))} className="mt-1 w-full border rounded p-2"/>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-sm">Compliance Category</label><select name="complianceCategory" value={formData.complianceCategory} onChange={handleChange} className="mt-1 w-full border rounded p-2 bg-white"><option>Clinical Training</option><option>Patient Consent</option><option>Surgical Recording</option><option>Departmental Memo</option></select></div>
                    <div><label className="text-sm">Retention Period</label><select name="retentionPeriod" value={formData.retentionPeriod} onChange={handleChange} className="mt-1 w-full border rounded p-2 bg-white"><option>1 Year</option><option>5 Years</option><option>7 Years</option><option>Indefinite</option></select></div>
                </div>
                <div className="flex justify-end gap-2 pt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button></div>
            </form>
        </div>
    );
};

const DetailsModal: React.FC<{ item: AVContent, onClose: () => void }> = ({ item, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-full flex flex-col">
            <div className="p-4 border-b flex justify-between items-start">
                <h3 className="text-xl font-bold">{item.title}</h3>
                <button onClick={onClose} className="text-2xl">&times;</button>
            </div>
            <div className="flex-grow overflow-y-auto">
                <div className="w-full bg-black aspect-video flex items-center justify-center text-white">[ Video Player Simulation ]</div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-3">
                        <div><h4 className="font-semibold">Description</h4><p className="text-sm text-gray-700">{item.description}</p></div>
                        <div><h4 className="font-semibold">Tags</h4><div className="flex flex-wrap gap-1 mt-1">{(item.tags || []).map(tag => <span key={tag} className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">{tag}</span>)}</div></div>
                    </div>
                    <div className="space-y-3 text-sm">
                        <p><strong>Duration:</strong> {item.duration}</p>
                        <p><strong>Uploaded:</strong> {new Date(item.uploadDate).toLocaleString()}</p>
                        <p><strong>Uploaded By:</strong> {item.uploadedBy}</p>
                        <p><strong>Category:</strong> {item.complianceCategory}</p>
                        <p><strong>Retention:</strong> {item.retentionPeriod}</p>
                    </div>
                </div>
                <div className="p-4 border-t">
                    <h4 className="font-semibold mb-2">Access Log</h4>
                    <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
                        {item.accessLog.map(log => (
                            <p key={log.timestamp} className="text-gray-600">{new Date(log.timestamp).toLocaleString()}: {log.userName} {log.action}</p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default AVDocumentationSystem;