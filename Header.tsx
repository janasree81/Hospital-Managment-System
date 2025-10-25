
import React from 'react';
import { Role, User } from '../types';

interface HeaderProps {
  user: User;
  onRoleChange: (newRole: Role) => void;
  pageTitle: string;
  onNavigateHome: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onRoleChange, pageTitle, onNavigateHome }) => {
  return (
    <header className="flex items-center justify-between h-20 px-6 bg-white border-b">
        <div>
            <div className="text-sm text-gray-500">
                <span className="cursor-pointer hover:text-indigo-600" onClick={onNavigateHome}>Dashboard</span>
                {pageTitle !== 'Dashboard' && (
                    <>
                        <span className="mx-2">/</span>
                        <span className="text-gray-800 font-medium">{pageTitle}</span>
                    </>
                )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
        </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
            <label htmlFor="role-switcher" className="mr-2 text-sm font-medium text-gray-700">View as:</label>
            <select
            id="role-switcher"
            value={user.role}
            onChange={(e) => onRoleChange(e.target.value as Role)}
            className="block w-full py-2 pl-3 pr-10 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
            {Object.values(Role).map((role) => (
                <option key={role} value={role}>{role}</option>
            ))}
            </select>
        </div>
        <div className="relative">
            <img className="w-10 h-10 rounded-full" src={user.avatarUrl} alt={user.name} />
        </div>
      </div>
    </header>
  );
};

export default Header;
