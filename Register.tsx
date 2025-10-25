import React, { useState } from 'react';
import { User } from '../types';

interface RegisterProps {
  onRegister: (newUser: Omit<User, 'id' | 'role' | 'avatarUrl'>) => void;
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: 'Other' as 'Male' | 'Female' | 'Other',
    phone: '',
    email: '',
    address: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister(formData);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-2xl shadow-lg">
        <div className="text-center">
           <h1 className="text-3xl font-bold text-gray-900">Create Patient Account</h1>
          <p className="mt-2 text-sm text-gray-600">Join the HMS Connect network</p>
        </div>
        
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</label>
                    <input id="name" name="name" type="text" required value={formData.name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                </div>
                 <div>
                    <label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">Date of Birth</label>
                    <input id="dateOfBirth" name="dateOfBirth" type="date" required value={formData.dateOfBirth} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                </div>
                 <div>
                    <label htmlFor="gender" className="text-sm font-medium text-gray-700">Gender</label>
                    <select id="gender" name="gender" required value={formData.gender} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor="phone" className="text-sm font-medium text-gray-700">Contact Number</label>
                    <input id="phone" name="phone" type="tel" required value={formData.phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                </div>
                 <div className="md:col-span-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</label>
                    <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                </div>
                 <div className="md:col-span-2">
                    <label htmlFor="address" className="text-sm font-medium text-gray-700">Address</label>
                    <textarea id="address" name="address" required value={formData.address} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                </div>
                 <div className="md:col-span-2">
                    <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
                    <input id="password" name="password" type="password" required value={formData.password} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                </div>
            </div>
            <button type="submit" className="w-full justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Create Account
            </button>
            <p className="mt-4 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <button type="button" onClick={onSwitchToLogin} className="font-medium text-indigo-600 hover:text-indigo-500">
                    Sign in here
                </button>
            </p>
        </form>
      </div>
    </div>
  );
};

export default Register;