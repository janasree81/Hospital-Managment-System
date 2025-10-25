import React, { useState, useMemo } from 'react';
import { Bill, Role, User, BillItem } from '../types';
import { MOCK_BILLS } from '../constants';

interface BillingSummaryProps {
    user: User;
}

const BillingSummary: React.FC<BillingSummaryProps> = ({user}) => {
  const [bills, setBills] = useState<Bill[]>(MOCK_BILLS);
  const [showForm, setShowForm] = useState(false);
  const [newBill, setNewBill] = useState({
      patientName: '',
      date: new Date().toISOString().split('T')[0],
      items: [{ description: '', amount: 0 }],
      status: 'Pending' as 'Paid' | 'Unpaid' | 'Pending',
  });

  const handleItemChange = (index: number, field: keyof BillItem, value: string | number) => {
      const updatedItems = [...newBill.items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      setNewBill(prev => ({...prev, items: updatedItems}));
  };
  
  const addItem = () => {
      setNewBill(prev => ({ ...prev, items: [...prev.items, { description: '', amount: 0 }]}));
  };

  const removeItem = (index: number) => {
      setNewBill(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index)}));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const total = newBill.items.reduce((sum, item) => sum + Number(item.amount), 0);
      const billToAdd: Bill = {
          id: `bill${Date.now()}`,
          patientName: newBill.patientName,
          date: newBill.date,
          items: newBill.items,
          total: total,
          status: newBill.status,
      };
      setBills(prev => [...prev, billToAdd]);
      setShowForm(false);
      setNewBill({
          patientName: '',
          date: new Date().toISOString().split('T')[0],
          items: [{ description: '', amount: 0 }],
          status: 'Pending',
      });
  };

  const totalAmount = useMemo(() => {
    return newBill.items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [newBill.items]);

  const getStatusColor = (status: 'Paid' | 'Unpaid' | 'Pending') => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Unpaid': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const filteredBills = bills.filter(bill => {
      if (user.role === Role.Patient) return bill.patientName === user.name;
      return true; // Admin sees all
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Billing Summary</h2>
        {user.role === Role.Admin && (
            <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                {showForm ? 'Cancel' : '+ Create New Bill'}
            </button>
        )}
      </div>

       {showForm && user.role === Role.Admin && (
          <form onSubmit={handleFormSubmit} className="space-y-6 mb-8 p-6 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label htmlFor="patientName" className="block text-sm font-medium text-gray-700">Patient Name</label>
                      <input type="text" name="patientName" id="patientName" value={newBill.patientName} onChange={e => setNewBill({...newBill, patientName: e.target.value})} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                  </div>
                   <div>
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700">Bill Date</label>
                      <input type="date" name="date" id="date" value={newBill.date} onChange={e => setNewBill({...newBill, date: e.target.value})} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                  </div>
              </div>
              <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Bill Items</h3>
                  {newBill.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                          <input type="text" placeholder="Description" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} required className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                          <input type="number" placeholder="Amount" value={item.amount} onChange={e => handleItemChange(index, 'amount', parseFloat(e.target.value))} required className="w-32 block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                          <button type="button" onClick={() => removeItem(index)} className="p-2 text-red-600 hover:bg-red-100 rounded-full">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                              </svg>
                          </button>
                      </div>
                  ))}
                   <button type="button" onClick={addItem} className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-800">+ Add Item</button>
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-xl font-bold">Total: ${totalAmount.toFixed(2)}</div>
                  <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save Bill</button>
              </div>
          </form>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBills.map((bill: Bill) => (
              <tr key={bill.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{bill.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bill.patientName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bill.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${bill.total.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(bill.status)}`}>
                    {bill.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BillingSummary;