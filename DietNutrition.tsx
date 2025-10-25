import React, { useState, useMemo } from 'react';
import { User, Patient, DietPlan, FoodItem, DailyConsumption, Role } from '../types';
import { MOCK_PATIENTS, MOCK_DIET_PLANS, MOCK_FOOD_ITEMS } from '../constants';
import { getDietPlanSuggestion, DietPlanSuggestion } from '../services/geminiService';

interface DietNutritionProps {
    user: User;
}

const DietNutrition: React.FC<DietNutritionProps> = ({ user }) => {
    const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
    const [dietPlans, setDietPlans] = useState<DietPlan[]>(MOCK_DIET_PLANS);
    const [foodItems, setFoodItems] = useState<FoodItem[]>(MOCK_FOOD_ITEMS);

    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'meals' | 'inventory'>('meals');
    
    const [modal, setModal] = useState<{ type: 'plan' | 'log', data?: any }>({ type: null });
    const [isLoadingAI, setIsLoadingAI] = useState(false);

    const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId), [patients, selectedPatientId]);
    const patientDietPlan = useMemo(() => dietPlans.find(dp => dp.id === selectedPatient?.dietPlanId), [dietPlans, selectedPatient]);

    const filteredPatients = useMemo(() => 
        patients.filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())),
        [patients, searchTerm]
    );

    const handleSavePlan = (planData: Omit<DietPlan, 'id'>) => {
        if (!selectedPatient) return;
        
        let newPlan: DietPlan;
        if (patientDietPlan) {
            // Update existing plan
            newPlan = { ...patientDietPlan, ...planData };
            setDietPlans(dps => dps.map(dp => dp.id === newPlan.id ? newPlan : dp));
        } else {
            // Create new plan
            newPlan = { id: `dp${Date.now()}`, ...planData };
            setDietPlans(dps => [...dps, newPlan]);
            setPatients(pats => pats.map(p => p.id === selectedPatient.id ? { ...p, dietPlanId: newPlan.id } : p));
        }
        setModal({ type: null });
    };

    const handleLogConsumption = (logData: Omit<DailyConsumption, 'loggedBy'>) => {
        if (!selectedPatient) return;

        const newLog: DailyConsumption = { ...logData, loggedBy: user.name };
        
        setPatients(pats => pats.map(p => {
            if (p.id === selectedPatient.id) {
                // Avoid duplicate logs for the same day and meal
                const existingLogs = p.consumptionHistory || [];
                const filteredLogs = existingLogs.filter(l => !(l.date === newLog.date && l.mealType === newLog.mealType));
                return { ...p, consumptionHistory: [...filteredLogs, newLog] };
            }
            return p;
        }));
        setModal({ type: null });
    };

    const DietPlanModal: React.FC = () => {
        const [plan, setPlan] = useState<Omit<DietPlan, 'id'>>(patientDietPlan || { dietType: 'Regular', caloriesPerDay: 2000, prescribedBy: user.name, startDate: new Date().toISOString().split('T')[0], meals: [] });
        
        const handleAISuggest = async () => {
            if (!selectedPatient) return;
            setIsLoadingAI(true);
            try {
                const suggestion = await getDietPlanSuggestion(selectedPatient);
                setPlan(p => ({ ...p, ...suggestion, notes: `${suggestion.notes}\n\nExample Meals:\n- Breakfast: ${suggestion.exampleMeals.breakfast}\n- Lunch: ${suggestion.exampleMeals.lunch}\n- Dinner: ${suggestion.exampleMeals.dinner}` }));
            } catch (e) {
                alert('Failed to get AI suggestion.');
            } finally {
                setIsLoadingAI(false);
            }
        };

        return (
             <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-full overflow-y-auto">
                    <h3 className="text-xl font-bold mb-4">Diet Plan for {selectedPatient?.firstName} {selectedPatient?.lastName}</h3>
                    <div className="space-y-4">
                        <button onClick={handleAISuggest} disabled={isLoadingAI} className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
                           {isLoadingAI ? 'Analyzing...' : 'Suggest Plan with AI'}
                        </button>
                        <div>
                            <label className="block text-sm font-medium">Diet Type</label>
                            <select value={plan.dietType} onChange={e => setPlan({...plan, dietType: e.target.value as DietPlan['dietType']})} className="mt-1 w-full border rounded-md p-2 bg-white">
                                 {['Regular', 'Low Sodium', 'Diabetic', 'Renal', 'Liquid', 'Low Fat', 'Custom'].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Target Calories/Day</label>
                            <input type="number" value={plan.caloriesPerDay} onChange={e => setPlan({...plan, caloriesPerDay: parseInt(e.target.value)})} className="mt-1 w-full border rounded-md p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Notes for Kitchen</label>
                            <textarea value={plan.notes || ''} onChange={e => setPlan({...plan, notes: e.target.value})} rows={5} className="mt-1 w-full border rounded-md p-2" />
                        </div>
                         <div className="flex justify-end space-x-2 pt-4">
                            <button type="button" onClick={() => setModal({ type: null })} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                            <button type="button" onClick={() => handleSavePlan(plan)} className="px-4 py-2 bg-green-600 text-white rounded-md">Save Plan</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const LogConsumptionModal: React.FC<{ meal: { mealType: 'Breakfast' | 'Lunch' | 'Dinner', patientName: string } }> = ({ meal }) => {
        const [log, setLog] = useState({ date: new Date().toISOString().split('T')[0], mealType: meal.mealType, status: 'Consumed' as DailyConsumption['status'], notes: '' });
        return (
             <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                    <h3 className="text-xl font-bold mb-4">Log {meal.mealType} for {meal.patientName}</h3>
                    <div className="space-y-4">
                         <div>
                            <label className="block text-sm font-medium">Consumption Status</label>
                            <select value={log.status} onChange={e => setLog({...log, status: e.target.value as DailyConsumption['status']})} className="mt-1 w-full border rounded-md p-2 bg-white">
                                <option value="Consumed">Consumed</option>
                                <option value="Partially Consumed">Partially Consumed</option>
                                <option value="Refused">Refused</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Notes (optional)</label>
                            <textarea value={log.notes} onChange={e => setLog({...log, notes: e.target.value})} rows={3} className="mt-1 w-full border rounded-md p-2" />
                        </div>
                        <div className="flex justify-end space-x-2 pt-4">
                            <button type="button" onClick={() => setModal({ type: null })} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                            <button type="button" onClick={() => handleLogConsumption(log)} className="px-4 py-2 bg-green-600 text-white rounded-md">Save Log</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const KitchenDashboard = () => {
        const mealsToday = useMemo(() => {
            const todayStr = new Date().toISOString().split('T')[0];
            const activePatients = patients.filter(p => p.dietPlanId && dietPlans.find(dp => dp.id === p.dietPlanId && dp.startDate <= todayStr));
            
            const mealList = { Breakfast: [], Lunch: [], Dinner: [] };
            activePatients.forEach(p => {
                const plan = dietPlans.find(dp => dp.id === p.dietPlanId)!;
                plan.meals.forEach(m => {
                    if (m.mealType === 'Breakfast' || m.mealType === 'Lunch' || m.mealType === 'Dinner') {
                        (mealList[m.mealType] as any).push({ patientId: p.id, patientName: `${p.firstName} ${p.lastName}`, meal: m });
                    }
                });
            });
            return mealList;
        }, [patients, dietPlans]);

        return (
            <div className="p-4 space-y-4">
                <div className="flex border-b">
                    <button onClick={() => setActiveTab('meals')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'meals' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}>Today's Meals</button>
                    <button onClick={() => setActiveTab('inventory')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'inventory' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}>Inventory</button>
                </div>
                
                {activeTab === 'meals' && (
                    <div className="space-y-6">
                        {(['Breakfast', 'Lunch', 'Dinner'] as const).map(mealType => (
                            <div key={mealType}>
                                <h4 className="font-bold text-lg mb-2">{mealType}</h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {mealsToday[mealType].length === 0 && <p className="text-sm text-gray-500">No meals scheduled.</p>}
                                    {(mealsToday[mealType] as any[]).map(({patientId, patientName, meal}) => {
                                        const logged = selectedPatientId === patientId && selectedPatient?.consumptionHistory?.find(c => c.date === new Date().toISOString().split('T')[0] && c.mealType === mealType);
                                        return (
                                            <div key={`${patientId}-${mealType}`} onClick={() => setSelectedPatientId(patientId)} className={`p-2 border rounded-md text-sm cursor-pointer ${selectedPatientId === patientId ? 'bg-indigo-100' : 'bg-gray-50'}`}>
                                                <div className="flex justify-between items-center">
                                                    <span className="font-semibold">{patientName}</span>
                                                    {!logged ? (
                                                      selectedPatientId === patientId && <button onClick={(e) => { e.stopPropagation(); setModal({ type: 'log', data: { mealType, patientName } })}} className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">Log</button>
                                                    ) : (
                                                      <span className="text-xs text-green-700 font-semibold">Logged</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'inventory' && (
                     <div className="max-h-96 overflow-y-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-100"><tr className="text-left"><th className="p-2">Item</th><th className="p-2">Stock</th></tr></thead>
                            <tbody>
                                {foodItems.map(item => (
                                    <tr key={item.id} className={`border-b ${item.stockQuantity < 20 ? 'bg-red-50' : ''}`}>
                                        <td className="p-2">{item.name}</td>
                                        <td className={`p-2 font-semibold ${item.stockQuantity < 20 ? 'text-red-600' : ''}`}>{item.stockQuantity} {item.unit}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-white rounded-lg shadow-md">
            {/* Left Pane: Patient List */}
            <div className="w-1/4 border-r flex flex-col">
                <div className="p-4 border-b">
                    <input type="text" placeholder="Search patients..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border rounded-md"/>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {filteredPatients.map(p => (
                        <div key={p.id} onClick={() => setSelectedPatientId(p.id)} className={`p-4 cursor-pointer hover:bg-indigo-50 ${selectedPatientId === p.id ? 'bg-indigo-100' : ''}`}>
                            <p className="font-semibold">{p.firstName} {p.lastName}</p>
                            <p className="text-sm text-gray-500">Age: {p.age}, {p.gender}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Middle Pane: Patient Details & Diet */}
            <div className="w-1/2 border-r flex flex-col">
                {!selectedPatient ? (
                    <div className="flex items-center justify-center h-full text-gray-500">Select a patient to view details.</div>
                ) : (
                    <>
                        <div className="p-4 border-b">
                            <h3 className="text-xl font-bold text-gray-800">{selectedPatient.firstName} {selectedPatient.lastName}</h3>
                            <p className="text-sm text-gray-600">Allergies: {selectedPatient.allergies.join(', ') || 'None'} | Conditions: {selectedPatient.chronicConditions.join(', ') || 'None'}</p>
                        </div>
                        <div className="flex-grow overflow-y-auto p-4 space-y-4">
                            <div className="p-4 border rounded-lg bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-lg">Current Diet Plan</h4>
                                        {patientDietPlan ? (
                                            <>
                                                <p><span className="font-semibold">{patientDietPlan.dietType}</span> ({patientDietPlan.caloriesPerDay} kcal/day)</p>
                                                <p className="text-sm text-gray-600">Prescribed by {patientDietPlan.prescribedBy}</p>
                                            </>
                                        ) : <p>No diet plan assigned.</p>}
                                    </div>
                                    {user.role === Role.Doctor && <button onClick={() => setModal({ type: 'plan' })} className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md">{patientDietPlan ? 'Edit' : 'Create'} Plan</button>}
                                </div>
                                {patientDietPlan?.notes && <div className="mt-2 text-sm p-2 border bg-white rounded whitespace-pre-wrap">{patientDietPlan.notes}</div>}
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-2">Consumption History</h4>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {selectedPatient.consumptionHistory?.length ? selectedPatient.consumptionHistory.slice().reverse().map((log, i) => (
                                        <div key={i} className="p-2 border rounded-md text-sm bg-white">
                                            <p><strong>{log.date} - {log.mealType}:</strong> {log.status}</p>
                                            {log.notes && <p className="text-xs text-gray-500 pl-2">- "{log.notes}"</p>}
                                        </div>
                                    )) : <p className="text-sm text-gray-500">No consumption logs.</p>}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Right Pane: Kitchen/Doctor Dashboard */}
            <div className="w-1/4 flex flex-col">
                 <div className="p-4 border-b flex-shrink-0">
                    <h3 className="text-xl font-bold text-gray-800">
                        {user.role === Role.Doctor ? 'Quick Actions' : 'Kitchen Dashboard'}
                    </h3>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {user.role === Role.Doctor && (
                         <div className="p-4">
                            <p className="text-sm text-gray-600">Select a patient to manage their diet plan.</p>
                         </div>
                    )}
                    {user.role === Role.Nurse && <KitchenDashboard />}
                </div>
            </div>

            {modal.type === 'plan' && selectedPatient && <DietPlanModal />}
            {modal.type === 'log' && modal.data && <LogConsumptionModal meal={modal.data} />}
        </div>
    );
};

export default DietNutrition;