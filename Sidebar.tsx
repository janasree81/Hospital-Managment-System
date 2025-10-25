
import React from 'react';
import { User } from '../types';

interface SidebarProps {
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  return (
    <div className="hidden md:flex md:flex-col md:w-64 bg-white text-gray-800 shadow-lg">
      <div className="flex items-center justify-center h-20 border-b">
        <svg className="w-8 h-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
        <span className="ml-3 text-xl font-bold">HMS Connect</span>
      </div>
      <div className="flex flex-col flex-1 p-4">
         <div className="flex items-center p-4 rounded-lg bg-indigo-50">
            <img className="w-12 h-12 rounded-full" src={user.avatarUrl} alt={user.name} />
            <div className="ml-4">
                <p className="font-semibold text-gray-900">{user.name}</p>
                <p className="text-sm text-indigo-700 font-medium">{user.role}</p>
            </div>
        </div>
      </div>
      <div className="p-4 border-t">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 bg-red-100 rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;