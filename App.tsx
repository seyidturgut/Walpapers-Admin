
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import UploadModal from './components/UploadModal';
import ApiPreview from './components/ApiPreview';
import LoginScreen from './components/LoginScreen';
import AiGenerator from './components/AiGenerator';
import SettingsView from './components/SettingsView';
import { AppState, MediaItem, MediaType, AppProfile } from './types';
import { Key, ExternalLink, ArrowRight, Loader2 } from 'lucide-react';
import { getApiKey } from './services/geminiService';

const INITIAL_CAT_APP_ID = 'app_cat_default';

// Default App Profile
const DEFAULT_APPS: AppProfile[] = [
  {
    id: INITIAL_CAT_APP_ID,
    name: 'Cat Wallpapers',
    description: 'A collection of cute, funny and artistic cat wallpapers.',
    aiContext: 'cat, kitten, feline, pet, meow, furry, paws'
  }
];

// Mock data to start with if empty, now with appId
const INITIAL_DATA: MediaItem[] = [
  {
    id: '1',
    appId: INITIAL_CAT_APP_ID,
    type: MediaType.IMAGE,
    url: 'https://picsum.photos/id/40/300/500', 
    title: 'Curious Tabby',
    description: 'A cute tabby cat looking at the camera with big eyes.',
    tags: ['cute', 'tabby', 'eyes'],
    createdAt: Date.now()
  },
  {
    id: '2',
    appId: INITIAL_CAT_APP_ID,
    type: MediaType.IMAGE,
    url: 'https://picsum.photos/id/219/300/500', 
    title: 'Lion in the Grass',
    description: 'Majestic wild cat resting in the savannah.',
    tags: ['wild', 'lion', 'nature'],
    createdAt: Date.now() - 10000
  }
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [checkingKey, setCheckingKey] = useState<boolean>(false);

  const [view, setView] = useState<AppState['view']>('dashboard');
  
  // App Management State
  const [apps, setApps] = useState<AppProfile[]>(() => {
    const savedApps = localStorage.getItem('purrfect_apps');
    return savedApps ? JSON.parse(savedApps) : DEFAULT_APPS;
  });
  
  const [activeAppId, setActiveAppId] = useState<string>(() => {
    const savedActive = localStorage.getItem('purrfect_active_app');
    return savedActive && apps.find(a => a.id === savedActive) ? savedActive : apps[0].id;
  });

  const [items, setItems] = useState<MediaItem[]>(() => {
    const saved = localStorage.getItem('purrfect_items');
    let loadedItems = saved ? JSON.parse(saved) : INITIAL_DATA;
    
    // Migration: If existing items don't have appId, assign them to the first app
    if (loadedItems.length > 0 && !loadedItems[0].appId) {
        loadedItems = loadedItems.map((item: any) => ({ ...item, appId: apps[0].id }));
    }
    return loadedItems;
  });

  // State for editing
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);

  const activeApp = apps.find(a => a.id === activeAppId) || apps[0];

  // Check for existing session
  useEffect(() => {
    const sessionAuth = sessionStorage.getItem('purrfect_auth');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Whenever authentication becomes true, check for the API key
  useEffect(() => {
    if (isAuthenticated) {
      checkApiKey();
    }
  }, [isAuthenticated]);

  // Persist State
  useEffect(() => {
    localStorage.setItem('purrfect_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('purrfect_apps', JSON.stringify(apps));
  }, [apps]);

  useEffect(() => {
    localStorage.setItem('purrfect_active_app', activeAppId);
  }, [activeAppId]);


  const checkApiKey = async () => {
    setCheckingKey(true);
    try {
      const manualKey = getApiKey();
      if (manualKey) {
        setHasApiKey(true);
        setCheckingKey(false);
        return;
      }
      const win = window as any;
      if (win.aistudio && win.aistudio.hasSelectedApiKey) {
        const hasKey = await win.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } else {
        setHasApiKey(false);
      }
    } catch (e) {
      console.error("Error checking API key", e);
      setHasApiKey(false);
    } finally {
      setCheckingKey(false);
    }
  };

  const handleSelectKey = async () => {
    try {
      const win = window as any;
      if (win.aistudio && win.aistudio.openSelectKey) {
        await win.aistudio.openSelectKey();
        setHasApiKey(true);
      } else {
        alert("AI Studio ortamında değilsiniz. Lütfen manuel anahtar girişini kullanın.");
      }
    } catch (e) {
      console.error("Error selecting key", e);
    }
  };

  const handleManualKeyInput = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const key = formData.get('manualApiKey') as string;
    if (key.trim()) {
        localStorage.setItem('gemini_api_key', key.trim());
        setHasApiKey(true);
    }
  };

  const handleLogin = () => {
    sessionStorage.setItem('purrfect_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('purrfect_auth');
    setIsAuthenticated(false);
    setHasApiKey(false);
  };

  // App Management Functions
  const handleAddApp = (newApp: AppProfile) => {
    setApps([...apps, newApp]);
  };

  const handleDeleteApp = (appId: string) => {
    if (apps.length <= 1) {
        alert("En az bir uygulama kalmalıdır.");
        return;
    }
    // Filter out items belonging to this app
    const newItems = items.filter(i => i.appId !== appId);
    setItems(newItems);

    const newApps = apps.filter(a => a.id !== appId);
    setApps(newApps);
    
    if (activeAppId === appId) {
        setActiveAppId(newApps[0].id);
    }
  };

  const handleSaveItem = (itemData: Omit<MediaItem, 'id' | 'createdAt'>, existingId?: string) => {
    if (existingId) {
        // Edit Mode
        setItems(prev => prev.map(item => 
            item.id === existingId 
            ? { ...item, ...itemData } // Keep original ID and createdAt, update other fields
            : item
        ));
    } else {
        // Create Mode
        const newItem: MediaItem = {
            ...itemData,
            id: crypto.randomUUID(),
            createdAt: Date.now()
        };
        setItems(prev => [newItem, ...prev]);
    }
    
    setEditingItem(null);
    if (view === 'upload') {
        setView('dashboard');
    }
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Bu içeriği silmek istediğinize emin misiniz?')) {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  const handleEditItem = (item: MediaItem) => {
    setEditingItem(item);
    setView('upload');
  };

  const handleCancelUpload = () => {
    setEditingItem(null);
    setView('dashboard');
  };

  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard 
            items={items} 
            activeApp={activeApp}
            onDelete={handleDeleteItem} 
            onEdit={handleEditItem} 
            onOpenUpload={() => { setEditingItem(null); setView('upload'); }} 
        />;
      case 'upload':
        return <UploadModal 
            onSave={handleSaveItem} 
            onCancel={handleCancelUpload} 
            initialItem={editingItem} 
            activeApp={activeApp}
        />;
      case 'ai-generator':
        return <AiGenerator onSave={handleSaveItem} activeApp={activeApp} />;
      case 'api-preview':
        return <ApiPreview items={items} activeApp={activeApp} />;
      case 'settings':
        return <SettingsView apps={apps} onAddApp={handleAddApp} onDeleteApp={handleDeleteApp} />;
      default:
        return <div>Not Found</div>;
    }
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (checkingKey) {
     return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
     );
  }

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full text-center">
          <div className="bg-amber-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
             <Key className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Google Cloud Bağlantısı</h2>
          <p className="text-slate-400 mb-6 text-sm leading-relaxed">
            Gemini 3 Pro ve Veo modellerini kullanmak için API anahtarına ihtiyacınız var.
          </p>
          
          <form onSubmit={handleManualKeyInput} className="mb-6">
              <div className="relative">
                  <input 
                    name="manualApiKey"
                    type="password"
                    placeholder="Manuel API Anahtarı Giriniz (AIza...)"
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm focus:border-purple-500 focus:outline-none mb-2"
                  />
                  <button type="submit" className="absolute right-2 top-2 p-1 bg-slate-700 rounded text-xs hover:bg-slate-600">
                     Kaydet
                  </button>
              </div>
          </form>

          <div className="flex items-center gap-4 my-4">
             <div className="h-px bg-slate-700 flex-1"></div>
             <span className="text-slate-500 text-xs">VEYA</span>
             <div className="h-px bg-slate-700 flex-1"></div>
          </div>

          <button 
            onClick={handleSelectKey}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all mb-4"
          >
            Google Hesabından Seç (Varsa)
          </button>

          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1 transition-colors"
          >
            Yeni API Anahtarı Oluştur <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      <Sidebar 
        currentView={view} 
        onChangeView={(v) => { setEditingItem(null); setView(v); }} 
        apps={apps}
        activeAppId={activeAppId}
        onChangeApp={setActiveAppId}
      />
      
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto h-screen relative">
        <div className="max-w-7xl mx-auto animate-fade-in">
          <header className="mb-8 flex justify-between items-center">
             <div className="md:hidden">
                <h1 className="text-xl font-bold">PurrfectAdmin</h1>
             </div>
             <div className="hidden md:block"></div>
             
             <button 
                onClick={handleLogout}
                className="text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1.5 transition-colors"
             >
                Çıkış Yap
             </button>
          </header>
          
          <div className="mb-8">
             <h1 className="text-3xl font-bold text-white mb-2">
                {view === 'dashboard' && 'Content Dashboard'}
                {view === 'upload' && (editingItem ? 'Edit Content' : 'Upload New Media')}
                {view === 'ai-generator' && 'AI Studio (Gen 3 & Veo)'}
                {view === 'api-preview' && 'API Integration'}
                {view === 'settings' && 'System Settings'}
             </h1>
             <p className="text-slate-400 flex items-center gap-2">
                <span className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded text-xs font-bold border border-purple-500/20">{activeApp.name}</span>
                <span>
                    {view === 'dashboard' && 'Manage your wallpapers and videos.'}
                    {view === 'upload' && 'Add or update assets.'}
                    {view === 'ai-generator' && 'Generate high-quality 9:16 wallpapers.'}
                    {view === 'api-preview' && 'Preview the JSON data structure.'}
                    {view === 'settings' && 'Configure apps and keys.'}
                </span>
             </p>
          </div>

          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
