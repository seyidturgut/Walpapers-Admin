
import React, { useState, useEffect } from 'react';
import { Key, Save, CheckCircle2, AlertTriangle, Eye, EyeOff, Plus, Trash2, Layers, Cloud, Database } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { AppProfile } from '../types';
import { isSupabaseConfigured } from '../services/supabaseClient';

interface SettingsViewProps {
  apps: AppProfile[];
  onAddApp: (app: AppProfile) => void;
  onDeleteApp: (id: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ apps, onAddApp, onDeleteApp }) => {
  // Gemini State
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [geminiSaved, setGeminiSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  // Supabase State
  const [sbUrl, setSbUrl] = useState('');
  const [sbKey, setSbKey] = useState('');
  const [sbSaved, setSbSaved] = useState(false);

  // App Creation State
  const [newAppName, setNewAppName] = useState('');
  const [newAppDesc, setNewAppDesc] = useState('');
  const [newAppContext, setNewAppContext] = useState('');

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) setApiKey(storedKey);

    const storedSbUrl = localStorage.getItem('supabase_url');
    const storedSbKey = localStorage.getItem('supabase_key');
    if (storedSbUrl) setSbUrl(storedSbUrl);
    if (storedSbKey) setSbKey(storedSbKey);
  }, []);

  // --- GEMINI HANDLERS ---
  const handleSaveGeminiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setGeminiSaved(true);
      setTimeout(() => setGeminiSaved(false), 3000);
      handleTestGemini(apiKey.trim());
    } else {
      localStorage.removeItem('gemini_api_key');
      setGeminiSaved(true);
    }
  };

  const handleTestGemini = async (keyToTest: string) => {
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

  // --- SUPABASE HANDLERS ---
  const handleSaveSupabase = () => {
      if (sbUrl.trim() && sbKey.trim()) {
          localStorage.setItem('supabase_url', sbUrl.trim());
          localStorage.setItem('supabase_key', sbKey.trim());
          setSbSaved(true);
          setTimeout(() => setSbSaved(false), 3000);
          alert("Ayarlar kaydedildi. Android uygulamanız artık verilere erişebilir.");
      } else {
          localStorage.removeItem('supabase_url');
          localStorage.removeItem('supabase_key');
          alert("Supabase bağlantısı kaldırıldı. Sistem yerel moda döndü.");
      }
  };

  // --- APP HANDLERS ---
  const handleCreateApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName || !newAppDesc) return;

    const newApp: AppProfile = {
        id: `app_${Date.now()}_${Math.floor(Math.random()*1000)}`,
        name: newAppName,
        description: newAppDesc,
        aiContext: newAppContext || newAppName
    };

    onAddApp(newApp);
    setNewAppName('');
    setNewAppDesc('');
    setNewAppContext('');
    alert(`"${newAppName}" uygulaması başarıyla oluşturuldu!`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
      
      {/* 1. API Configuration (Gemini) */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700 bg-slate-900/50 flex items-center gap-3">
          <div className="bg-purple-500/10 p-2 rounded-lg">
             <Key className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Gemini API Ayarları</h2>
            <p className="text-sm text-slate-400">İçerik üretimi için gereklidir.</p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div>
             <label className="block text-sm font-medium text-slate-300 mb-2">API Anahtarı</label>
             <div className="relative">
                <input 
                   type={showKey ? "text" : "password"}
                   value={apiKey}
                   onChange={(e) => { setApiKey(e.target.value); setTestStatus('idle'); }}
                   placeholder="AIzaSy..."
                   className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-all font-mono"
                />
                <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1">
                   {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
             </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
             <div className="flex items-center gap-2">
                {testStatus === 'success' && <span className="text-green-400 text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Bağlantı Başarılı</span>}
                {testStatus === 'error' && <span className="text-red-400 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Hata</span>}
             </div>
             <button onClick={handleSaveGeminiKey} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium shadow-lg shadow-purple-900/30 flex items-center gap-2 transition-all">
                {geminiSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />} Kaydet
             </button>
          </div>
        </div>
      </div>

      {/* 2. Supabase Configuration (Android Backend) */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden border-l-4 border-l-green-500">
        <div className="p-6 border-b border-slate-700 bg-slate-900/50 flex items-center gap-3">
          <div className="bg-green-500/10 p-2 rounded-lg">
             <Database className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Android Bağlantısı (Supabase)</h2>
            <p className="text-sm text-slate-400">Android uygulamanızın verilere erişmesi için burayı doldurun.</p>
          </div>
        </div>

        <div className="p-8 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Project URL</label>
                  <input 
                      type="text" 
                      value={sbUrl}
                      onChange={(e) => setSbUrl(e.target.value)}
                      placeholder="https://xyz.supabase.co"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Anon Public Key</label>
                  <input 
                      type="password" 
                      value={sbKey}
                      onChange={(e) => setSbKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none"
                  />
               </div>
           </div>
           
           <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 text-xs text-slate-400">
               <strong>Gereksinimler:</strong>
               <ul className="list-disc list-inside mt-1 space-y-1">
                   <li>'media_items' adında bir tablo (SQL Editor'de oluşturun).</li>
                   <li>'wallpapers' adında Public bir Storage Bucket.</li>
               </ul>
           </div>

           <div className="flex justify-end">
               <button onClick={handleSaveSupabase} className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium shadow-lg shadow-green-900/20 flex items-center gap-2 transition-all">
                  {sbSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />} Bağlantıyı Kur
               </button>
           </div>
        </div>
      </div>

      {/* 3. App Management */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700 bg-slate-900/50 flex items-center gap-3">
          <div className="bg-blue-500/10 p-2 rounded-lg">
             <Layers className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Uygulama Yönetimi</h2>
          </div>
        </div>

        <div className="p-8">
            <form onSubmit={handleCreateApp} className="mb-8 bg-slate-900/50 p-6 rounded-xl border border-slate-700/50">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> Yeni Uygulama Ekle</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input type="text" required value={newAppName} onChange={e => setNewAppName(e.target.value)} placeholder="App Name" className="bg-slate-800 border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none" />
                    <input type="text" value={newAppContext} onChange={e => setNewAppContext(e.target.value)} placeholder="AI Context Keywords" className="bg-slate-800 border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none" />
                </div>
                <textarea required value={newAppDesc} onChange={e => setNewAppDesc(e.target.value)} placeholder="Description..." className="w-full bg-slate-800 border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none h-20 resize-none mb-4" />
                <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium">Uygulama Oluştur</button>
            </form>

            <div className="space-y-3">
                {apps.map(app => (
                    <div key={app.id} className="flex items-center justify-between p-4 bg-slate-900 border border-slate-700 rounded-xl">
                        <div><h4 className="font-bold text-white">{app.name}</h4><p className="text-xs text-slate-500">{app.description}</p></div>
                        <button onClick={() => { if(confirm("Silinsin mi?")) onDeleteApp(app.id); }} className="p-2 text-slate-600 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
