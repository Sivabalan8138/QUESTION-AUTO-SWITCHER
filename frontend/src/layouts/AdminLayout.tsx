import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Gavel, History, Users, Database, LogOut, Zap } from 'lucide-react';
import clsx from 'clsx';

export default function AdminLayout() {
  const { logout } = useAuth();

  const navItems = [
    { to: '/admin/auction', label: 'Auction Control', icon: Gavel },
    { to: '/admin/history', label: 'Audit History', icon: History },
    { to: '/admin/teams', label: 'Team Manager', icon: Users },
    { to: '/admin/questions', label: 'Question Bank', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-cyber-dark text-white flex flex-col md:flex-row font-sans">
      
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-gray-900 border-r border-gray-800 flex flex-col z-20 shrink-0">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <Zap className="w-8 h-8 text-cyber-cyan" />
          <div>
            <h1 className="font-bold tracking-wider text-xl">ELECTROBID</h1>
            <p className="text-xs text-gray-400 tracking-widest uppercase">Admin Center</p>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold tracking-wider",
                isActive 
                  ? "bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30" 
                  : "text-gray-400 hover:bg-gray-800 hover:text-white border border-transparent"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-gray-400 hover:bg-cyber-rose/10 hover:text-cyber-rose border border-transparent hover:border-cyber-rose/30 transition-all font-semibold tracking-wider"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative h-screen bg-cyber-dark">
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>

    </div>
  );
}
