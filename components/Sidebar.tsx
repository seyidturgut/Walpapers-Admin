
import React from 'react';
import { LayoutDashboard, Upload, Code, Settings, Cat, Wand2, ChevronDown, Layers } from 'lucide-react';
import { AppProfile, AppState } from '../types';

interface SidebarProps {
  currentView: AppState['view'];
  onChangeView: (view: AppState['view']) => void;
  apps: AppProfile[];
  activeAppId: string;
  onChangeApp: (appId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, apps, activeAppId, onChangeApp }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload Media', icon: Upload },
    { id: 'ai-generator', label: 'AI Studio', icon: Wand2 },
    { id: 'api-preview', label: 'API / JSON', icon: Code },
  ];

  const activeApp = apps.find(a => a.id === activeAppId) || apps[0];

  return (
    <div className="w-64 bg-slate-800 h-screen fixed left-0 top-0 border-r border-slate-700 flex flex-col shadow-2xl z-50 hidden md:flex">
      {/* App Switcher Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="relative group">
            <button className="w-full flex items-center justify-between bg-slate-900 hover:bg-slate-950 p-3 rounded-xl border border-slate-700 transition-colors text-left">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-1.5 rounded-lg shrink-0">
                        <Cat className="text-white w-4 h-4" />
                    </div>
                    <div className="truncate">
                        <h1 className="text-sm font-bold text-white truncate">{activeApp?.name || 'Select App'}</h1>
                        <p className="text-[10px] text-slate-400">Yönetici Paneli</p>
                    </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>
            
            {/* Dropdown Menu */}
            <div className="absolute top-full left-0 w-full mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden hidden group-hover:block z-50">
                <div className="p-2 max-h-60 overflow-y-auto">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase px-2 py-1">Uygulamalarım</div>
                    {apps.map(app => (
                        <button 
                            key={app.id}
                            onClick={() => onChangeApp(app.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 flex items-center gap-2 ${activeAppId === app.id ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                        >
                            <div className={`w-2 h-2 rounded-full ${activeAppId === app.id ? 'bg-white' : 'bg-slate-500'}`} />
                            {app.name}
                        </button>
                    ))}
                    <div className="border-t border-slate-700 mt-2 pt-2">
                        <button 
                            onClick={() => onChangeView('settings')}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs text-blue-400 hover:bg-slate-700 flex items-center gap-2"
                        >
                            <Layers className="w-3 h-3" />
                            + Yeni Uygulama
                        </button>
                    </div>
                </div>
            </div>
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
