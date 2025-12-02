
import React, { useState } from 'react';
import { MediaItem, MediaType, AppProfile } from '../types';
import { Copy, Code, Smartphone, Check, Database, AlertTriangle } from 'lucide-react';
import { isSupabaseConfigured, getSupabaseConfig } from '../services/supabaseClient';

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
    const { url, key } = getSupabaseConfig();
    const sbUrl = url;
    const sbKey = key;

    return `
/* 
   ---------------------------------------------------------
   ADIM 1: build.gradle.kts (Module: app) dosyanıza ekleyin:
   ---------------------------------------------------------
   
   plugins {
       kotlin("plugin.serialization") version "1.9.0" // Versiyon projenize göre değişebilir
   }

   dependencies {
       // Supabase
       implementation("io.github.jan-tennert.supabase:postgrest-kt:2.5.0")
       implementation("io.ktor:ktor-client-android:2.3.12")
       
       // JSON Serialization
       implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")
       
       // Resim Yükleme için (Coil önerilir)
       implementation("io.coil-kt:coil:2.6.0")
   }
*/

import io.github.jan_tennert.supabase.createSupabaseClient
import io.github.jan_tennert.supabase.postgrest.Postgrest
import io.github.jan_tennert.supabase.postgrest.from
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// ---------------------------------------------------------
// ADIM 2: Veri Modeli (Data Class)
// ---------------------------------------------------------

@Serializable
data class WallpaperItem(
    val id: String,
    
    @SerialName("app_id") 
    val appId: String,
    
    val type: String, // 'IMAGE' veya 'VIDEO'
    
    val url: String,  // Resmin/Videonun doğrudan linki
    
    val title: String,
    
    val description: String? = null,
    
    val tags: List<String> = emptyList(),
    
    @SerialName("created_at")
    val createdAt: Long = 0
)

// ---------------------------------------------------------
// ADIM 3: Veri Çekme Sınıfı (Repository)
// ---------------------------------------------------------

class WallpaperRepository {

    // İstemciyi başlat
    private val supabase = createSupabaseClient(
        supabaseUrl = "${sbUrl}",
        supabaseKey = "${sbKey}"
    ) {
        install(Postgrest)
    }

    /**
     * "${activeApp.name}" uygulaması için içerikleri çeker.
     */
    suspend fun getWallpapers(): List<WallpaperItem> {
        return try {
            supabase.from("media_items")
                .select {
                    // Sadece bu uygulamaya ait verileri filtrele
                    filter {
                        eq("app_id", "${activeApp.id}")
                    }
                    // En yeniden eskiye sırala
                    order("created_at", order = io.github.jan_tennert.supabase.postgrest.query.Order.DESCENDING)
                }
                .decodeList<WallpaperItem>()
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
}

/*
   KULLANIM ÖRNEĞİ (ViewModel veya Activity içinde):
   
   val repo = WallpaperRepository()
   scope.launch {
       val wallpapers = repo.getWallpapers()
       wallpapers.forEach { item ->
           println("Başlık: \${item.title}, Link: \${item.url}")
       }
   }
*/
`.trim();
  };

  const generateJson = () => {
    return JSON.stringify({
        source: isCloud ? "Supabase Cloud" : "Local Browser Storage (Not accessible to Android)",
        warning: isCloud ? "" : "DİKKAT: Ayarlardan Supabase bağlantısını yapmazsanız Android veriye erişemez.",
        app_name: activeApp.name,
        app_id: activeApp.id,
        count: appItems.length,
        items: appItems.map(item => ({
             id: item.id,
             app_id: item.appId,
             type: item.type,
             url: item.url,
             title: item.title,
             tags: item.tags,
             created_at: item.createdAt
        }))
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
                    {isCloud ? <Database className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">
                        {isCloud ? "Bulut Bağlantısı Aktif" : "Bulut Bağlantısı Yok!"}
                    </h2>
                    <p className="text-sm text-slate-300">
                        {isCloud 
                            ? "Sistem Supabase'e bağlı. Aşağıdaki Kotlin kodunu Android projenize yapıştırıp kullanabilirsiniz." 
                            : "Şu an veriler sadece bu tarayıcıda (Local) kayıtlı. Android uygulamanızın verilere erişebilmesi için 'Settings' kısmından Supabase ayarlarını yapmalısınız."}
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
                        <Code className="w-4 h-4" /> Raw JSON Preview
                    </button>
                </div>

                <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-all">
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />} {copied ? 'Kopyalandı' : 'Kodu Kopyala'}
                </button>
            </div>

            <div className="flex-1 overflow-auto relative custom-scrollbar bg-[#0d1117]">
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
