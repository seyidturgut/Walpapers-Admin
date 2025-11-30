import React from 'react';
import { LayoutDashboard, Upload, Code, Settings, Cat, Wand2 } from 'lucide-react';
import { AppState } from '../types';

interface SidebarProps {
  currentView: AppState['view'];
  onChangeView: (view: AppState['view']) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload Media', icon: Upload },
    { id: 'ai-generator', label: 'AI Studio', icon: Wand2 },
    { id: 'api-preview', label: 'API / JSON', icon: Code },
  ];

  return (
    <div className="w-64 bg-slate-800 h-screen fixed left-0 top-0 border-r border-slate-700 flex flex-col shadow-2xl z-50 hidden md:flex">
      <div className="p-6 flex items-center gap-3 border-b border-slate-700">
        <div className="bg-purple-600 p-2 rounded-lg">
          <Cat className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Purrfect</h1>
          <p className="text-xs text-slate-400 font-medium tracking-wide">ADMIN PANEL</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id as AppState['view'])}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-100'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-purple-400'}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button 
          onClick={() => onChangeView('settings')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${currentView === 'settings' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-100'}`}
        >
          <Settings className={`w-5 h-5 ${currentView === 'settings' ? 'text-white' : ''}`} />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;