import React, { useState, useMemo } from 'react';
import { User, Role } from '../types';
// FIX: Changed import from MOCK_USERS to USERS_DB.
import { USERS_DB } from '../constants';

const UserManagement: React.FC = () => {
    // FIX: Initialized state with the USERS_DB array directly.
    const [users, setUsers] = useState<User[]>(USERS_DB);
    
    // In a real app, this would be a much more robust user list
    const userList = useMemo(() => users, [users]);

    // FIX: Changed userId parameter to string to match User.id type.
    const handleRoleChange = (userId: string, newRole: Role) => {
        setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, role: newRole } : u));
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">User Management</h2>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {userList.map(user => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <img className="h-10 w-10 rounded-full" src={user.avatarUrl} alt="" />
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                            <div className="text-sm text-gray-500">{user.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email || user.phone}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                   <select 
                                        value={user.role} 
                                        onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                                        className="p-1 border border-gray-300 rounded-md"
                                    >
                                       {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                                   </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button className="text-red-600 hover:text-red-900">Deactivate</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;
