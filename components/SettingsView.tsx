
import React, { useState, useEffect } from 'react';
import { Key, Save, CheckCircle2, Shield, AlertTriangle, Eye, EyeOff, Plus, Trash2, Layers } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { AppProfile } from '../types';

interface SettingsViewProps {
  apps: AppProfile[];
  onAddApp: (app: AppProfile) => void;
  onDeleteApp: (id: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ apps, onAddApp, onDeleteApp }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  // App Creation State
  const [newAppName, setNewAppName] = useState('');
  const [newAppDesc, setNewAppDesc] = useState('');
  const [newAppContext, setNewAppContext] = useState('');

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      handleTestConnection(apiKey.trim());
    } else {
      localStorage.removeItem('gemini_api_key');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleTestConnection = async (keyToTest: string) => {
    setTestStatus('testing');
    try {
      const ai = new GoogleGenAI({ apiKey: keyToTest });
      await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Hello",
      });
      setTestStatus('success');
    } catch (error) {
      console.error(error);
      setTestStatus('error');
    }
  };

  const handleCreateApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName || !newAppDesc) return;

    const newApp: AppProfile = {
        id: crypto.randomUUID(),
        name: newAppName,
        description: newAppDesc,
        aiContext: newAppContext || newAppName
    };

    onAddApp(newApp);
    setNewAppName('');
    setNewAppDesc('');
    setNewAppContext('');
    alert(`"${newAppName}" uygulaması başarıyla oluşturuldu! Sidebar'dan geçiş yapabilirsiniz.`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
      
      {/* 1. API Configuration */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700 bg-slate-900/50 flex items-center gap-3">
          <div className="bg-purple-500/10 p-2 rounded-lg">
             <Key className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">API Ayarları</h2>
            <p className="text-sm text-slate-400">Google Cloud AI servis bağlantısı.</p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div>
             <label className="block text-sm font-medium text-slate-300 mb-2">Gemini API Anahtarı</label>
             <div className="relative">
                <input 
                   type={showKey ? "text" : "password"}
                   value={apiKey}
                   onChange={(e) => {
                       setApiKey(e.target.value);
                       setTestStatus('idle');
                   }}
                   placeholder="AIzaSy..."
                   className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-all font-mono"
                />
                <button 
                   onClick={() => setShowKey(!showKey)}
                   className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1"
                >
                   {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
             </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
             <div className="flex items-center gap-2">
                {testStatus === 'testing' && <span className="text-slate-400 text-sm flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"/> Bağlantı test ediliyor...</span>}
                {testStatus === 'success' && <span className="text-green-400 text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Bağlantı başarılı</span>}
                {testStatus === 'error' && <span className="text-red-400 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Geçersiz Anahtar</span>}
             </div>

             <button 
                onClick={handleSaveKey}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium shadow-lg shadow-purple-900/30 flex items-center gap-2 transition-all"
             >
                {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? 'Kaydedildi' : 'Ayarları Kaydet'}
             </button>
          </div>
        </div>
      </div>

      {/* 2. App Management */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700 bg-slate-900/50 flex items-center gap-3">
          <div className="bg-blue-500/10 p-2 rounded-lg">
             <Layers className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Uygulama Yönetimi (App Manager)</h2>
            <p className="text-sm text-slate-400">Birden fazla wallpaper uygulaması için profiller oluşturun.</p>
          </div>
        </div>

        <div className="p-8">
            {/* Create New App Form */}
            <form onSubmit={handleCreateApp} className="mb-8 bg-slate-900/50 p-6 rounded-xl border border-slate-700/50">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-green-400" /> Yeni Uygulama Ekle
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Uygulama Adı</label>
                        <input 
                            type="text" 
                            required
                            value={newAppName}
                            onChange={e => setNewAppName(e.target.value)}
                            placeholder="Örn: Super Cars Wallpapers"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">AI Anahtar Kelimeleri (Context)</label>
                        <input 
                            type="text" 
                            value={newAppContext}
                            onChange={e => setNewAppContext(e.target.value)}
                            placeholder="Örn: luxury cars, speed, neon, racing"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>
                <div className="mb-4">
                     <label className="block text-xs font-medium text-slate-400 mb-1">Uygulama Açıklaması (AI Prompt için)</label>
                     <textarea 
                        required
                        value={newAppDesc}
                        onChange={e => setNewAppDesc(e.target.value)}
                        placeholder="Örn: A collection of high quality 4K sport car wallpapers for car enthusiasts."
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none h-20 resize-none"
                     />
                </div>
                <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
                    Uygulama Oluştur
                </button>
            </form>

            {/* List Existing Apps */}
            <h3 className="text-slate-400 text-sm font-semibold mb-4 uppercase tracking-wider">Mevcut Uygulamalar</h3>
            <div className="space-y-3">
                {apps.map(app => (
                    <div key={app.id} className="flex items-center justify-between p-4 bg-slate-900 border border-slate-700 rounded-xl group hover:border-slate-500 transition-colors">
                        <div>
                            <h4 className="font-bold text-white">{app.name}</h4>
                            <p className="text-xs text-slate-500">{app.description}</p>
                            <p className="text-[10px] text-blue-400 mt-1">Context: {app.aiContext}</p>
                        </div>
                        <button 
                            onClick={() => {
                                if(confirm(`"${app.name}" uygulamasını ve tüm içeriklerini silmek istediğinize emin misiniz?`)) {
                                    onDeleteApp(app.id);
                                }
                            }}
                            className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Uygulamayı Sil"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
