import React, { useState, useEffect } from 'react';
import { Key, Save, CheckCircle2, Shield, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const SettingsView: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleSave = () => {
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

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700 bg-slate-900/50 flex items-center gap-3">
          <div className="bg-purple-500/10 p-2 rounded-lg">
             <Key className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">API Configuration</h2>
            <p className="text-sm text-slate-400">Manage your connection to Google Cloud AI services.</p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-200">
             <AlertTriangle className="w-5 h-5 shrink-0" />
             <div className="text-sm">
                <p className="font-bold mb-1">Important for Deployment</p>
                <p className="opacity-80">
                   If you are running this app on Netlify, GitHub Pages, or any static host without backend environment variables, 
                   you must enter your API Key here. It will be stored securely in your browser's Local Storage.
                </p>
             </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-300 mb-2">Google Cloud Gemini API Key</label>
             <div className="relative">
                <input 
                   type={showKey ? "text" : "password"}
                   value={apiKey}
                   onChange={(e) => {
                       setApiKey(e.target.value);
                       setTestStatus('idle');
                   }}
                   placeholder="AIzaSy..."
                   className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono"
                />
                <button 
                   onClick={() => setShowKey(!showKey)}
                   className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1"
                >
                   {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
             </div>
             <p className="text-xs text-slate-500 mt-2">
                Required for: Gemini 2.5 Flash (Text/Metadata), Gemini 3 Pro (Image), Veo (Video)
             </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
             <div className="flex items-center gap-2">
                {testStatus === 'testing' && <span className="text-slate-400 text-sm flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"/> Testing connection...</span>}
                {testStatus === 'success' && <span className="text-green-400 text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Connection verified</span>}
                {testStatus === 'error' && <span className="text-red-400 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Invalid API Key</span>}
             </div>

             <button 
                onClick={handleSave}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium shadow-lg shadow-purple-900/30 flex items-center gap-2 transition-all active:scale-95"
             >
                {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? 'Saved Locally' : 'Save Configuration'}
             </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl p-8 flex items-start gap-4">
          <Shield className="w-8 h-8 text-green-400 shrink-0" />
          <div>
             <h3 className="text-lg font-bold text-white mb-2">Privacy & Security</h3>
             <p className="text-slate-400 text-sm leading-relaxed">
                Your API Key is stored only in your browser's <code>localStorage</code>. 
                It is never sent to any server other than Google's generative AI endpoints directly. 
                Clearing your browser cache will remove this key.
             </p>
          </div>
      </div>
    </div>
  );
};

export default SettingsView;