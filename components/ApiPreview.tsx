
import React, { useState } from 'react';
import { MediaItem, MediaType, AppProfile } from '../types';
import { Copy, Download, Code, Server, Smartphone, Check, Database } from 'lucide-react';

interface ApiPreviewProps {
  items: MediaItem[];
  activeApp: AppProfile;
}

const ApiPreview: React.FC<ApiPreviewProps> = ({ items, activeApp }) => {
  const [hostUrl, setHostUrl] = useState('https://your-backend-domain.com/assets');
  const [activeTab, setActiveTab] = useState<'json' | 'kotlin'>('json');
  const [copied, setCopied] = useState(false);

  // Filter items for current app
  const appItems = items.filter(i => i.appId === activeApp.id);

  // 1. JSON Structure Generator
  const generateJson = () => {
    const apiStructure = {
      status: "success",
      app_profile: {
          id: activeApp.id,
          name: activeApp.name,
          description: activeApp.description
      },
      metadata: {
        version: "1.1.0",
        count: appItems.length,
        generated_at: new Date().toISOString(),
      },
      data: appItems.map(item => ({
        id: item.id,
        type: item.type.toLowerCase(), // 'image' or 'video'
        title: item.title,
        description: item.description,
        tags: item.tags,
        // In a real scenario, we don't send Base64 in list API. We send URLs.
        media_url: `${hostUrl}/${item.id}.${item.type === MediaType.IMAGE ? 'jpg' : 'mp4'}`,
        thumbnail_url: item.type === MediaType.VIDEO 
            ? `${hostUrl}/thumbnails/${item.id}.jpg` 
            : null,
        created_at: new Date(item.createdAt).toISOString()
      }))
    };
    return JSON.stringify(apiStructure, null, 2);
  };

  // 2. Kotlin Data Class Generator (For Android)
  const generateKotlinCode = () => {
    return `
// Dependencies (Gson examples)
// implementation 'com.google.code.gson:gson:2.10.1'

import com.google.gson.annotations.SerializedName

data class WallpaperResponse(
    @SerializedName("status") val status: String,
    @SerializedName("app_profile") val appProfile: AppProfile,
    @SerializedName("metadata") val metadata: Metadata,
    @SerializedName("data") val items: List<WallpaperItem>
)

data class AppProfile(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("description") val description: String
)

data class Metadata(
    @SerializedName("version") val version: String,
    @SerializedName("count") val count: Int
)

data class WallpaperItem(
    @SerializedName("id") val id: String,
    @SerializedName("type") val type: String, // "image" or "video"
    @SerializedName("title") val title: String,
    @SerializedName("description") val description: String,
    @SerializedName("tags") val tags: List<String>,
    @SerializedName("media_url") val mediaUrl: String,
    @SerializedName("thumbnail_url") val thumbnailUrl: String?,
    @SerializedName("created_at") val createdAt: String
) {
    val isVideo: Boolean
        get() = type == "video"
}
`.trim();
  };

  const content = activeTab === 'json' ? generateJson() : generateKotlinCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: activeTab === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeTab === 'json' ? `${activeApp.name.replace(/\s+/g, '_').toLowerCase()}_api.json` : 'WallpaperModels.kt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 h-[calc(100vh-10rem)] flex flex-col">
        
        {/* Top Configuration Bar */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg shrink-0">
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div>
                    <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        <Server className="text-purple-400" />
                        API Endpoint: {activeApp.name}
                    </h2>
                    <p className="text-slate-400 text-sm">
                        Şu anda <strong>{activeApp.name}</strong> uygulaması için veriler JSON formatına dönüştürülüyor.
                    </p>
                </div>
                
                <div className="w-full md:w-1/2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Host / CDN URL
                    </label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={hostUrl}
                            onChange={(e) => setHostUrl(e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm font-mono placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>
                </div>
            </div>
            
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                <Database className="w-3 h-3" />
                <span>Bu çıktıda sadece <strong>{appItems.length}</strong> adet medya listelenmektedir (Filtre: {activeApp.name}).</span>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-2xl flex flex-col min-h-0">
            {/* Toolbar */}
            <div className="flex justify-between items-center p-2 bg-slate-950 border-b border-slate-800 shrink-0">
                <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button 
                        onClick={() => setActiveTab('json')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'json' ? 'bg-slate-800 text-green-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Code className="w-4 h-4" /> JSON Response
                    </button>
                    <button 
                        onClick={() => setActiveTab('kotlin')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'kotlin' ? 'bg-slate-800 text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Smartphone className="w-4 h-4" /> Kotlin Models
                    </button>
                </div>

                <div className="flex gap-2 pr-2">
                    <button 
                        onClick={handleCopy} 
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${copied ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button 
                        onClick={handleDownload} 
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" 
                        title="Download File"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Code Editor View */}
            <div className="flex-1 overflow-auto relative custom-scrollbar">
                <pre className="p-6 text-sm font-mono leading-relaxed">
                    {activeTab === 'json' ? (
                        <code className="text-green-300 block whitespace-pre">
                            {content}
                        </code>
                    ) : (
                        <code className="text-blue-300 block whitespace-pre">
                            {content}
                        </code>
                    )}
                </pre>
            </div>
        </div>
    </div>
  );
};

export default ApiPreview;
