import React, { useState, useEffect } from 'react';
import { Key, Save, CheckCircle2, Shield, AlertTriangle, Eye, EyeOff, Plus, Trash2, Layers, Database, Cloud } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { AppProfile } from '../types';
import { getSupabaseClient } from '../services/supabaseClient';

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
  const [sbTestStatus, setSbTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  // App Creation State
  const [newAppName, setNewAppName] = useState('');
  const [newAppDesc, setNewAppDesc] = useState('');
  const [newAppContext, setNewAppContext] = useState('');

  useEffect(() => {
    // Load Gemini Key
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) setApiKey(storedKey);

    // Load Supabase Config
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
      setTimeout(() => setGeminiSaved(false), 3000);
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
      
      // Force reload/re-init logic could go here, but reload page is safer for now or just calling getSupabaseClient()
      setSbSaved(true);
      setTimeout(() => setSbSaved(false), 3000);
      handleTestSupabase();
    } else {
      localStorage.removeItem('supabase_url');
      localStorage.removeItem('supabase_key');
      setSbSaved(true);
      setTimeout(() => setSbSaved(false), 3000);
    }
  };

  const handleTestSupabase = async () => {
    setSbTestStatus('testing');
    // We need to reload the client since it's a singleton initialized with old values potentially
    // For this simple implementation, we assume getSupabaseClient checks storage if instance is null,
    // but if it's already instantiated, we might need to refresh. 
    // Simplest way for user: Alert them to refresh page or try a fetch.
    
    // Let's try to construct a temp client or just use the updated storage values by forcing a reload of the app
    // Actually, let's just use the current values to fetch:
    try {
        // Quick fetch to see if connection works
        const { createClient } = await import('@supabase/supabase-js');
        const tempClient = createClient(sbUrl, sbKey);
        const { error } = await tempClient.from('media_items').select('count', { count: 'exact', head: true });
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is just no rows, which is fine
           console.error(error);
           // If table doesn't exist, it might error, but connection is likely okay if not 401
           if (error.code === '42P01') {
             alert("Bağlantı başarılı ama 'media_items' tablosu bulunamadı. Lütfen SQL kurulumunu yapın.");
             setSbTestStatus('success');
           } else {
             throw error;
           }
        } else {
           setSbTestStatus('success');
           // Reload to apply changes globally
           if(confirm("Bağlantı başarılı! Değişikliklerin uygulanması için sayfa yenilensin mi?")) {
             window.location.reload();
           }
        }
    } catch (error) {
        console.error(error);
        setSbTestStatus('error');
    }
  };


  // --- APP HANDLERS ---
  const handleCreateApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName || !newAppDesc) return;

    // Use a simpler ID generation if crypto is missing in some envs (though polyfilled in util)
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
            <p className="text-sm text-slate-400">Google Cloud AI servis bağlantısı (İçerik Üretimi için).</p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div>
             <label className="block text-sm font-medium text-slate-300 mb-2">API Anahtarı</label>
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
                {testStatus === 'testing' && <span className="text-slate-400 text-sm flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"/> Test ediliyor...</span>}
                {testStatus === 'success' && <span className="text-green-400 text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Bağlantı Başarılı</span>}
                {testStatus === 'error' && <span className="text-red-400 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Hata</span>}
             </div>

             <button 
                onClick={handleSaveGeminiKey}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium shadow-lg shadow-purple-900/30 flex items-center gap-2 transition-all"
             >
                {geminiSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {geminiSaved ? 'Kaydedildi' : 'Kaydet'}
             </button>
          </div>
        </div>
      </div>

      {/* 2. Database Configuration (Supabase) */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700 bg-slate-900/50 flex items-center gap-3">
          <div className="bg-green-500/10 p-2 rounded-lg">
             <Database className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Veritabanı Ayarları (Supabase)</h2>
            <p className="text-sm text-slate-400">Bulut veritabanı bağlantısı (n8n otomasyonu ve kalıcı depolama için).</p>
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
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:border-green-500 transition-all font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Anon API Key</label>
                <input 
                    type="password"
                    value={sbKey}
                    onChange={(e) => setSbKey(e.target.value)}
                    placeholder="eyJh..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:border-green-500 transition-all font-mono text-sm"
                />
              </div>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 text-xs text-slate-400 leading-relaxed">
             <strong className="text-slate-300">Kurulum Notu:</strong> Supabase projenizde SQL Editor'e gidip aşağıdaki tabloyu oluşturmalısınız:
             <pre className="mt-2 bg-slate-950 p-2 rounded border border-slate-800 text-green-300 overflow-x-auto">
{`create table media_items (
  id text primary key,
  app_id text not null,
  type text not null,
  url text not null,
  title text,
  description text,
  tags text[],
  created_at bigint,
  thumbnail_url text
);`}
             </pre>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
             <div className="flex items-center gap-2">
                {sbTestStatus === 'testing' && <span className="text-slate-400 text-sm flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"/> Sunucuya bağlanılıyor...</span>}
                {sbTestStatus === 'success' && <span className="text-green-400 text-sm flex items-center gap-2"><Cloud className="w-4 h-4"/> Supabase Bağlı</span>}
                {sbTestStatus === 'error' && <span className="text-red-400 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Bağlantı Hatası</span>}
             </div>

             <button 
                onClick={handleSaveSupabase}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium shadow-lg shadow-green-900/30 flex items-center gap-2 transition-all"
             >
                {sbSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {sbSaved ? 'Kaydedildi' : 'DB Ayarlarını Kaydet'}
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
            <p className="text-sm text-slate-400">Çoklu uygulama profillerini yönetin.</p>
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
                        <label className="block text-xs font-medium text-slate-400 mb-1">AI Anahtar Kelimeleri</label>
                        <input 
                            type="text" 
                            value={newAppContext}
                            onChange={e => setNewAppContext(e.target.value)}
                            placeholder="Örn: luxury cars, speed, neon"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>
                <div className="mb-4">
                     <label className="block text-xs font-medium text-slate-400 mb-1">Uygulama Açıklaması</label>
                     <textarea 
                        required
                        value={newAppDesc}
                        onChange={e => setNewAppDesc(e.target.value)}
                        placeholder="Uygulamanın amacı ve hedef kitlesi..."
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
                            <p className="text-[10px] text-blue-400 mt-1">ID: {app.id}</p>
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