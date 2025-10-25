
import React from 'react';

interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  onClick: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, description, icon: Icon, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer flex flex-col items-start"
    >
      <div className="flex-shrink-0 bg-indigo-100 p-3 rounded-full">
        <Icon className="w-8 h-8 text-indigo-600" />
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
};

export default DashboardCard;
