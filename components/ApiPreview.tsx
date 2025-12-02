
import React, { useState } from 'react';
import { MediaItem, MediaType, AppProfile } from '../types';
import { Copy, Code, Smartphone, Check, Database } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabaseClient';

interface ApiPreviewProps {
  items: MediaItem[];
  activeApp: AppProfile;
}

const ApiPreview: React.FC<ApiPreviewProps> = ({ items, activeApp }) => {
  const [activeTab, setActiveTab] = useState<'android' | 'json'>('android');
  const [copied, setCopied] = useState(false);
  const isCloud = isSupabaseConfigured();

  const appItems = items.filter(i => i.appId === activeApp.id);

  // ANDROID KOTLIN CODE GENERATOR
  const generateAndroidCode = () => {
    const sbUrl = localStorage.getItem('supabase_url') || "YOUR_SUPABASE_URL";
    const sbKey = localStorage.getItem('supabase_key') || "YOUR_SUPABASE_ANON_KEY";

    return `
// 1. Add Dependency (build.gradle.kts)
// implementation("io.github.jan-tennert.supabase:postgrest-kt:2.5.0")

// 2. Setup Client
val supabase = createSupabaseClient(
    supabaseUrl = "${sbUrl}",
    supabaseKey = "${sbKey}"
) {
    install(Postgrest)
}

// 3. Data Model
@Serializable
data class WallpaperItem(
    val id: String,
    @SerialName("app_id") val appId: String,
    val type: String, // 'IMAGE' or 'VIDEO'
    val url: String,  // Public URL from Supabase Storage
    val title: String,
    val description: String,
    val tags: List<String>
)

// 4. Fetch Function for '${activeApp.name}'
suspend fun fetchWallpapers(): List<WallpaperItem> {
    return supabase.from("media_items")
        .select() {
            filter {
                eq("app_id", "${activeApp.id}")
            }
            order("created_at", Order.DESCENDING)
        }
        .decodeList<WallpaperItem>()
}
`.trim();
  };

  const generateJson = () => {
    return JSON.stringify({
        source: isCloud ? "Supabase Cloud" : "Local Browser Storage (Not accessible to Android)",
        warning: isCloud ? "" : "ANDROID ERİŞİMİ İÇİN AYARLARDAN SUPABASE BAĞLAMALISINIZ!",
        app: activeApp.name,
        count: appItems.length,
        items: appItems
    }, null, 2);
  };

  const content = activeTab === 'android' ? generateAndroidCode() : generateJson();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 h-[calc(100vh-10rem)] flex flex-col">
        
        <div className={`p-6 rounded-2xl border shadow-lg shrink-0 ${isCloud ? 'bg-slate-800 border-green-500/30' : 'bg-red-900/20 border-red-500/50'}`}>
            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${isCloud ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    <Database className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">
                        {isCloud ? "Android Bağlantısı Hazır" : "Android Bağlantısı Yok"}
                    </h2>
                    <p className="text-sm text-slate-300">
                        {isCloud 
                            ? "Sistem Supabase bulutuna bağlı. Android uygulamanız verileri çekebilir." 
                            : "Şu an veriler sadece tarayıcıda. Android erişimi için Ayarlar > Supabase kısmını doldurun."}
                    </p>
                </div>
            </div>
        </div>

        <div className="flex-1 bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-2xl flex flex-col min-h-0">
            <div className="flex justify-between items-center p-2 bg-slate-950 border-b border-slate-800 shrink-0">
                <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button onClick={() => setActiveTab('android')} className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'android' ? 'bg-green-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                        <Smartphone className="w-4 h-4" /> Android (Kotlin)
                    </button>
                    <button onClick={() => setActiveTab('json')} className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'json' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                        <Code className="w-4 h-4" /> Raw JSON
                    </button>
                </div>

                <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-all">
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />} {copied ? 'Kopyalandı' : 'Kopyala'}
                </button>
            </div>

            <div className="flex-1 overflow-auto relative custom-scrollbar">
                <pre className="p-6 text-sm font-mono leading-relaxed">
                    <code className={activeTab === 'android' ? "text-green-300" : "text-blue-300"}>
                        {content}
                    </code>
                </pre>
            </div>
        </div>
    </div>
  );
};

export default ApiPreview;
