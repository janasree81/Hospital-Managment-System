import React, { useState } from 'react';
import { User } from '../types';

interface RegisterProps {
  onRegister: (newUser: Omit<User, 'id' | 'role' | 'avatarUrl'>) => void;
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add validation here in a real app
    onRegister(formData);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg">
        <div className="text-center">
           <h1 className="text-3xl font-bold text-gray-900">Create Patient Account</h1>
          <p className="mt-2 text-sm text-gray-600">Join the HMS Connect network</p>
        </div>
        
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
                <label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</label>
                <input id="name" name="name" type="text" required value={formData.name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div>
                <label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</label>
                <input id="phone" name="phone" type="tel" required value={formData.phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div>
                <label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</label>
                <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div>
                <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
                <input id="password" name="password" type="password" required value={formData.password} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
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