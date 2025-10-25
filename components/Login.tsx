import React, { useState } from 'react';

interface LoginProps {
  onLogin: (email: string, password?: string) => void;
  onSwitchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToRegister }) => {
  const [loginType, setLoginType] = useState<'patient' | 'staff'>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleLoginTypeChange = (type: 'patient' | 'staff') => {
    setLoginType(type);
    // Clear form fields on toggle for better UX
    setEmail('');
    setPassword('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg">
        <div className="text-center">
          <div className="flex justify-center items-center mb-4">
            <svg className="w-12 h-12 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">HMS Connect</h1>
          <p className="mt-2 text-sm text-gray-600">Hospital Management System</p>
        </div>
        
        <div>
            <div className="flex border-b border-gray-200">
                <button onClick={() => handleLoginTypeChange('patient')} className={`flex-1 py-2 text-sm font-medium ${loginType === 'patient' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}>Patient Login</button>
                <button onClick={() => handleLoginTypeChange('staff')} className={`flex-1 py-2 text-sm font-medium ${loginType === 'staff' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}>Staff Login</button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</label>
                    <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                <div>
                    <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
                    <input id="password" name="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    {loginType === 'staff' && <p className="text-xs text-gray-500 mt-1">Hint: Try admin@ms.dev / Admin@123</p>}
                </div>
                <button type="submit" className="w-full justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Sign in{loginType === 'staff' && ' as Staff'}
                </button>
                {loginType === 'patient' && (
                    <p className="mt-4 text-center text-sm text-gray-600">
                        Don't have an account?{' '}
                        <button type="button" onClick={onSwitchToRegister} className="font-medium text-indigo-600 hover:text-indigo-500">
                            Register here
                        </button>
                    </p>
                )}
            </form>
        </div>
         <p className="text-center text-xs text-gray-500 pt-4">
            This is a demonstration. Login is simulated.
        </p>
      </div>
    </div>
  );
};

export default Login;
