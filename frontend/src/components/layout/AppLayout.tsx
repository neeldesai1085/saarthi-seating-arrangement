import React, { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, Upload, Eye } from 'lucide-react';
import { useAppStore } from '../../services/useAppStore';

const Sidebar = () => {
  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/rooms', icon: Users, label: 'Rooms' },
    { to: '/upload', icon: Upload, label: 'Upload Data' },
    { to: '/preview', icon: Eye, label: 'Seating Preview' },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-gray-200 min-h-screen flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-600">ExamSeat</h1>
      </div>
      <nav className="flex-1 py-6 px-3 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-lg font-medium transition-colors ${
                isActive 
                  ? 'bg-primary-50 text-primary-700' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <link.icon className="w-5 h-5 mr-3" />
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export const AppLayout: React.FC = () => {
  const { fetchRooms, fetchRules } = useAppStore();

  useEffect(() => {
    fetchRooms();
    fetchRules();
  }, [fetchRooms, fetchRules]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-surface border-b border-gray-200 flex items-center px-8">
          <h2 className="text-lg font-medium text-gray-800">Admin Portal</h2>
        </header>
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
