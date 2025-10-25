import React, { useState, useMemo } from 'react';
import { User, ProductionOrder, WasteLog, ProductionOrderStatus, FoodItem, DailyConsumption } from '../types';
import { MOCK_PRODUCTION_ORDERS, MOCK_WASTE_LOGS, MOCK_FOOD_ITEMS } from '../constants';
import { getWasteAnalysis, WasteAnalysis } from '../services/geminiService';

interface FBOrderManagementProps {
    user: User;
}

const FBOrderManagement: React.FC<FBOrderManagementProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'production' | 'verification' | 'waste'>('production');
    const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>(MOCK_PRODUCTION_ORDERS);
    const [wasteLogs, setWasteLogs] = useState<WasteLog[]>(MOCK_WASTE_LOGS);
    
    // Verification State
    const [scannedOrderId, setScannedOrderId] = useState('');
    const [scannedItems, setScannedItems] = useState<string[]>([]);
    const [verificationResult, setVerificationResult] = useState<{ status: 'none' | 'verified' | 'mismatched', message: string }>({ status: 'none', message: '' });

    // Waste Analytics State
    const [isLoggingWaste, setIsLoggingWaste] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<WasteAnalysis | null>(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);

    const handleUpdateStatus = (orderId: string, status: ProductionOrderStatus) => {
        setProductionOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    };
    
    const handleVerifyTray = () => {
        const order = productionOrders.find(o => o.id === scannedOrderId);
        if (!order) {
            setVerificationResult({ status: 'mismatched', message: 'Error: Tray ID not found.' });
            return;
        }

        const requiredItems = new Map(order.items.map(i => [i.foodItemId, i.quantity]));
        const actualItems = new Map<string, number>();
        scannedItems.forEach(id => {
            actualItems.set(id, (actualItems.get(id) || 0) + 1);
        });
        
        let errors: string[] = [];
        // Check for missing or incorrect quantities
        requiredItems.forEach((quantity, id) => {
            const foodItem = MOCK_FOOD_ITEMS.find(fi => fi.id === id);
            if (!actualItems.has(id)) {
                errors.push(`Missing: ${foodItem ? foodItem.name : `Item ID ${id}`}`);
            } else if (actualItems.get(id) !== quantity) {
                errors.push(`Incorrect quantity for ${foodItem ? foodItem.name : `Item ID ${id}`} (Expected ${quantity}, Scanned ${actualItems.get(id)})`);
            }
        });

        // Check for extra items
        actualItems.forEach((_, id) => {
            if (!requiredItems.has(id)) {
                const foodItem = MOCK_FOOD_ITEMS.find(fi => fi.id === id);
                errors.push(`Extra item: ${foodItem ? foodItem.name : `Item ID ${id}`}`);
            }
        });
        
        if (errors.length > 0) {
            setVerificationResult({ status: 'mismatched', message: `Mismatched! ${errors.join('; ')}` });
        } else {
            setVerificationResult({ status: 'verified', message: 'Tray verified successfully!' });
        }
    };

    const handleLogWaste = (formData: Omit<WasteLog, 'id'|'timestamp'|'loggedBy'>) => {
        const newLog: WasteLog = {
            id: `w${Date.now()}`,
            timestamp: new Date().toISOString(),
            loggedBy: user.name,
            ...formData,
        };
        setWasteLogs(prev => [newLog, ...prev]);
        setIsLoggingWaste(false);
    };
    
    const handleGetAIAnalysis = async () => {
        setIsLoadingAI(true);
        setAiAnalysis(null);
        try {
            const consumptionLogs: DailyConsumption[] = []; // In a real app, this would be fetched
            const result = await getWasteAnalysis(wasteLogs, consumptionLogs);
            setAiAnalysis(result);
        } catch (error) {
            alert('Failed to get AI analysis.');
        } finally {
            setIsLoadingAI(false);
        }
    };


    const ProductionList = () => {
        const meals = {
            Breakfast: productionOrders.filter(o => o.mealType === 'Breakfast'),
            Lunch: productionOrders.filter(o => o.mealType === 'Lunch'),
            Dinner: productionOrders.filter(o => o.mealType === 'Dinner'),
        };
        const statusConfig = {
            [ProductionOrderStatus.Pending]: { color: 'gray', next: ProductionOrderStatus.InProgress, action: 'Start' },
            [ProductionOrderStatus.InProgress]: { color: 'blue', next: ProductionOrderStatus.Ready, action: 'Ready' },
            [ProductionOrderStatus.Ready]: { color: 'green', next: ProductionOrderStatus.Delivered, action: 'Deliver' },
            [ProductionOrderStatus.Delivered]: { color: 'purple', next: null, action: null },
        };

        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['Breakfast', 'Lunch', 'Dinner'] as const).map(mealType => (
                    <div key={mealType} className="bg-gray-50 p-3 rounded-lg">
                        <h3 className="font-bold text-lg mb-2">{mealType} ({meals[mealType].length})</h3>
                        <div className="space-y-2 max-h-[calc(100vh-20rem)] overflow-y-auto pr-2">
                           {meals[mealType].map(order => (
                               <div key={order.id} className={`p-3 bg-white rounded-md shadow-sm border-l-4 border-${statusConfig[order.status].color}-500`}>
                                   <div className="flex justify-between items-start">
                                       <div>
                                           <p className="font-semibold">{order.patientName} <span className="font-normal text-gray-500">({order.roomNumber})</span></p>
                                           <p className="text-xs text-gray-600 font-medium">{order.dietType} Diet</p>
                                       </div>
                                       {statusConfig[order.status].next && (
                                           <button onClick={() => handleUpdateStatus(order.id, statusConfig[order.status].next!)} className={`px-2 py-1 text-xs text-white bg-${statusConfig[order.status].color}-500 rounded`}>
                                                {statusConfig[order.status].action}
                                           </button>
                                       )}
                                   </div>
                                    <ul className="list-disc list-inside text-sm mt-2 pl-2 text-gray-700">
                                       {order.items.map(item => <li key={item.foodItemId}>{item.name} ({item.quantity}{item.unit})</li>)}
                                   </ul>
                               </div>
                           ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const TrayVerification = () => {
        return (
            <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg">1. Scan Tray</h3>
                    <select value={scannedOrderId} onChange={e => { setScannedOrderId(e.target.value); setVerificationResult({ status: 'none', message: ''}); }} className="w-full p-2 border rounded-md bg-white">
                        <option value="">Select Tray ID to Scan...</option>
                        {productionOrders.filter(o => o.status === ProductionOrderStatus.Ready).map(o => <option key={o.id} value={o.id}>{o.id} ({o.patientName})</option>)}
                    </select>
                    <div className="p-3 bg-gray-50 rounded min-h-[100px]">
                        <h4 className="font-medium text-sm mb-1">Expected Items:</h4>
                        {productionOrders.find(o => o.id === scannedOrderId)?.items.map(i => <p key={i.foodItemId} className="text-sm">- {i.name} (x{i.quantity})</p>)}
                    </div>
                </div>
                 <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg">2. Scan Items on Tray</h3>
                    <select onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setScannedItems(Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value))} multiple className="w-full p-2 border rounded-md bg-white h-40">
                        {MOCK_FOOD_ITEMS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                    <button onClick={handleVerifyTray} disabled={!scannedOrderId} className="w-full p-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400">Verify Tray</button>
                     <div className={`p-3 rounded text-center font-bold ${verificationResult.status === 'verified' ? 'bg-green-100 text-green-800' : verificationResult.status === 'mismatched' ? 'bg-red-100 text-red-800' : ''}`}>
                        {verificationResult.message}
                    </div>
                </div>
            </div>
        );
    };
    
    const WasteAnalytics = () => {
        const WasteLogForm = () => {
            const [formData, setFormData] = useState({ foodItemId: '', quantityWasted: 0, reason: 'Other' as WasteLog['reason'] });
            const selectedItem = MOCK_FOOD_ITEMS.find(i => i.id === formData.foodItemId);
            const handleSubmit = (e: React.FormEvent) => {
                e.preventDefault();
                if (!selectedItem) return;
                handleLogWaste({ ...formData, quantityWasted: Number(formData.quantityWasted), foodItemName: selectedItem.name, unit: selectedItem.unit });
            };
            return (
                <form onSubmit={handleSubmit} className="p-3 border rounded-md bg-gray-50 space-y-2">
                    <select value={formData.foodItemId} onChange={e => setFormData({...formData, foodItemId: e.target.value})} required className="w-full p-2 border bg-white rounded-md">
                        <option value="">Select Food Item</option>
                        {MOCK_FOOD_ITEMS.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                    <div className="flex gap-2">
                        <input type="number" value={formData.quantityWasted} onChange={e => setFormData({...formData, quantityWasted: Number(e.target.value)})} placeholder="Qty" required className="w-1/2 p-2 border rounded-md" />
                        <select value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value as WasteLog['reason']})} className="w-1/2 p-2 border bg-white rounded-md">
                            <option>Patient Refused</option><option>Production Error</option><option>Expired</option><option>Other</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsLoggingWaste(false)} className="px-3 py-1 text-sm bg-gray-300 rounded-md">Cancel</button><button type="submit" className="px-3 py-1 text-sm bg-red-500 text-white rounded-md">Save</button></div>
                </form>
            );
        }

        return (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-lg">Waste Log</h3>
                        <button onClick={() => setIsLoggingWaste(true)} className="px-3 py-1 text-sm bg-red-500 text-white rounded-md">+ Log Waste</button>
                    </div>
                    {isLoggingWaste && <WasteLogForm />}
                    <div className="max-h-96 overflow-y-auto border rounded-md">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-100 text-left"><tr className="text-left"><th className="p-2">Item</th><th className="p-2">Qty</th><th className="p-2">Reason</th></tr></thead>
                            <tbody>
                                {wasteLogs.map(log => <tr key={log.id} className="border-b"><td className="p-2">{log.foodItemName}</td><td className="p-2">{log.quantityWasted} {log.unit}</td><td className="p-2">{log.reason}</td></tr>)}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">AI Waste Reduction Analysis</h3>
                    <button onClick={handleGetAIAnalysis} disabled={isLoadingAI} className="w-full p-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400">
                        {isLoadingAI ? 'Analyzing...' : 'Get AI Insights'}
                    </button>
                    {aiAnalysis && (
                        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg space-y-3">
                             <div>
                                <h4 className="font-bold text-indigo-800">Key Findings</h4>
                                <ul className="list-disc list-inside text-sm text-indigo-700">{aiAnalysis.keyFindings.map((f,i) => <li key={i}>{f}</li>)}</ul>
                             </div>
                             <div>
                                <h4 className="font-bold text-indigo-800">Recommendations</h4>
                                <ul className="list-disc list-inside text-sm text-indigo-700">{aiAnalysis.recommendations.map((r,i) => <li key={i}>{r}</li>)}</ul>
                             </div>
                        </div>
                    )}
                </div>
             </div>
        );
    };
    

    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">F&amp;B Order Management</h2>
            <div className="flex space-x-2 border-b mb-4">
                <button onClick={() => setActiveTab('production')} className={`px-4 py-2 text-sm font-medium rounded-t-md ${activeTab === 'production' ? 'bg-gray-100 border-b-2 border-indigo-600' : 'text-gray-500'}`}>Production List</button>
                <button onClick={() => setActiveTab('verification')} className={`px-4 py-2 text-sm font-medium rounded-t-md ${activeTab === 'verification' ? 'bg-gray-100 border-b-2 border-indigo-600' : 'text-gray-500'}`}>Tray Verification</button>
                <button onClick={() => setActiveTab('waste')} className={`px-4 py-2 text-sm font-medium rounded-t-md ${activeTab === 'waste' ? 'bg-gray-100 border-b-2 border-indigo-600' : 'text-gray-500'}`}>Waste Analytics</button>
            </div>
            <div className="flex-grow">
                {activeTab === 'production' && <ProductionList />}
                {activeTab === 'verification' && <TrayVerification />}
                {activeTab === 'waste' && <WasteAnalytics />}
            </div>
        </div>
    );
};

export default FBOrderManagement;
