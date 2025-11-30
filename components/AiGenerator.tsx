import React, { useState } from 'react';
import { Wand2, Loader2, Save, RefreshCw, Sparkles, TextCursorInput, Film, Image as ImageIcon, Download } from 'lucide-react';
import { generateWallpaper, generateMediaMetadata, generateVideoWallpaper } from '../services/geminiService';
import { MediaType, MediaItem, AiMetadataResponse } from '../types';

interface AiGeneratorProps {
  onSave: (item: Omit<MediaItem, 'id' | 'createdAt'>) => void;
}

const IMAGE_SUGGESTIONS = [
  "Cyberpunk neon cat in a rainy city",
  "Fluffy white persian cat wearing sunglasses on a beach",
  "Minimalist cat silhouette against a sunset",
  "Astronaut cat floating in galaxy space",
  "Watercolor painting of a sleeping ginger cat"
];

const VIDEO_SUGGESTIONS = [
  "A cat slowly blinking in sunlight, cinematic",
  "Kitten chasing a butterfly in slow motion",
  "Cat sleeping and breathing softly, cozy atmosphere",
  "Neon robotic cat walking in rain"
];

const AiGenerator: React.FC<AiGeneratorProps> = ({ onSave }) => {
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const [prompt, setPrompt] = useState('');
  
  const [generatedMediaUrl, setGeneratedMediaUrl] = useState<string | null>(null);
  
  // State to hold the auto-generated natural text
  const [metadata, setMetadata] = useState<AiMetadataResponse | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<string>(''); // For detailed status
  const [saving, setSaving] = useState(false);

  const suggestions = activeTab === 'image' ? IMAGE_SUGGESTIONS : VIDEO_SUGGESTIONS;

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setGeneratedMediaUrl(null);
    setMetadata(null);
    
    try {
      // 1. Generate Media
      if (activeTab === 'image') {
        setLoadingPhase("Görsel üretiliyor (Gemini 3 Pro)...");
        const base64Image = await generateWallpaper(prompt);
        setGeneratedMediaUrl(base64Image);
        
        // 2. Metadata
        setLoadingPhase("İçerik analiz ediliyor...");
        const generatedMeta = await generateMediaMetadata(base64Image, 'image/png');
        setMetadata(generatedMeta);

      } else {
        setLoadingPhase("Video render alınıyor (Veo 3.1)... Bu işlem 1-2 dakika sürebilir.");
        const base64Video = await generateVideoWallpaper(prompt);
        setGeneratedMediaUrl(base64Video);

        // 2. Metadata (using a frame or just generic for now, let's use the video bytes but mime type video/mp4)
        // Note: Gemini 2.5 Flash can analyze video bytes directly if small enough, or we rely on prompt context.
        // For simplicity/robustness here, we'll try to analyze the video bytes.
        setLoadingPhase("Video analiz ediliyor...");
        // Usually we send a frame, but for now sending video bytes to Gemini Flash (Multimodal)
        const generatedMeta = await generateMediaMetadata(base64Video, 'video/mp4');
        setMetadata(generatedMeta);
      }

    } catch (error) {
      console.error(error);
      alert("İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin. (Video üretimi API kotasına takılmış olabilir).");
    } finally {
      setLoading(false);
      setLoadingPhase('');
    }
  };

  const handleSaveToGallery = async () => {
    if (!generatedMediaUrl || !metadata) return;
    setSaving(true);
    
    // Simulate a small delay for better UX
    setTimeout(() => {
        onSave({
            type: activeTab === 'image' ? MediaType.IMAGE : MediaType.VIDEO,
            url: generatedMediaUrl,
            title: metadata.title,
            description: metadata.description,
            tags: metadata.tags
        });
        setSaving(false);
        alert("Galeriye başarıyla eklendi!");
        // Reset after save
        setGeneratedMediaUrl(null);
        setMetadata(null);
        setPrompt('');
    }, 600);
  };

  const handleDownloadMedia = () => {
    if (!generatedMediaUrl) return;
    
    const link = document.createElement('a');
    link.href = generatedMediaUrl;
    
    const timestamp = new Date().getTime();
    const extension = activeTab === 'image' ? 'png' : 'mp4';
    const filename = `purrfect-ai-${timestamp}.${extension}`;
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-8rem)]">
        {/* Left Panel: Controls */}
        <div className="flex flex-col gap-6">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col h-full">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        <Sparkles className="text-amber-400" />
                        AI Stüdyo
                    </h2>
                    <p className="text-slate-400 text-sm">
                        Gemini 3 Pro ile görsel, Veo ile video üretin. Otomatik içerik analizi dahildir.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-900 p-1 rounded-xl mb-6 border border-slate-700">
                    <button 
                        onClick={() => { setActiveTab('image'); setGeneratedMediaUrl(null); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'image' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <ImageIcon className="w-4 h-4" /> Wallpaper (Resim)
                    </button>
                    <button 
                        onClick={() => { setActiveTab('video'); setGeneratedMediaUrl(null); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'video' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Film className="w-4 h-4" /> Live Wallpaper (Video)
                    </button>
                </div>

                <div className="space-y-4 flex-1">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            {activeTab === 'image' ? 'Görsel Tarifi' : 'Video Senaryosu'}
                        </label>
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={activeTab === 'image' ? "Örn: Mavi gözlü bir kedi..." : "Örn: Yağmurda yürüyen neon kedi, sinematik..."}
                            className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none h-32 resize-none transition-colors ${activeTab === 'image' ? 'focus:border-purple-500' : 'focus:border-blue-500'}`}
                        />
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((s, i) => (
                            <button 
                                key={i}
                                onClick={() => setPrompt(s)}
                                className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-full transition-colors text-left"
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    {metadata && (
                        <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 animate-fade-in">
                            <h3 className={`text-sm font-bold mb-2 flex items-center gap-2 ${activeTab === 'image' ? 'text-purple-400' : 'text-blue-400'}`}>
                                <TextCursorInput className="w-4 h-4" /> 
                                Otomatik Oluşturulan İçerik
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-slate-500 block text-xs uppercase tracking-wider">Başlık</span>
                                    <p className="text-white font-medium">{metadata.title}</p>
                                </div>
                                <div>
                                    <span className="text-slate-500 block text-xs uppercase tracking-wider">Açıklama</span>
                                    <p className="text-slate-300 line-clamp-2">{metadata.description}</p>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {metadata.tags.map((t, i) => (
                                        <span key={i} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">#{t}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <button 
                    onClick={handleGenerate}
                    disabled={loading || !prompt}
                    className={`w-full py-4 bg-gradient-to-r text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 ${activeTab === 'image' ? 'from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 shadow-purple-900/30' : 'from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-blue-900/30'}`}
                >
                    {loading ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Bekleyiniz...</>
                    ) : (
                        <><Wand2 className="w-5 h-5" /> {activeTab === 'image' ? 'Görsel Oluştur' : 'Video Oluştur'}</>
                    )}
                </button>
            </div>
        </div>

        {/* Right Panel: Preview */}
        <div className="bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center relative overflow-hidden group">
            {loading ? (
                 <div className="flex flex-col items-center gap-6 p-8 text-center animate-pulse">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center ${activeTab === 'image' ? 'bg-purple-900/50 text-purple-400' : 'bg-blue-900/50 text-blue-400'}`}>
                        <Loader2 className="w-10 h-10 animate-spin" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-white font-medium text-lg">AI Çalışıyor</h3>
                        <p className="text-sm text-slate-400 max-w-xs mx-auto">{loadingPhase}</p>
                    </div>
                 </div>
            ) : generatedMediaUrl ? (
                <div className="relative h-full w-full flex items-center justify-center p-4">
                    {activeTab === 'image' ? (
                        <img 
                            src={generatedMediaUrl} 
                            alt="AI Generated" 
                            className="max-h-full rounded-lg shadow-2xl border border-slate-600 object-contain"
                            style={{ aspectRatio: '9/16' }} 
                        />
                    ) : (
                        <video 
                            src={generatedMediaUrl}
                            controls
                            autoPlay
                            loop
                            className="max-h-full rounded-lg shadow-2xl border border-slate-600 object-contain"
                            style={{ aspectRatio: '9/16' }} 
                        />
                    )}
                    
                    {/* Action Bar */}
                    <div className="absolute bottom-8 flex gap-3 z-10">
                        <button 
                            onClick={handleGenerate}
                            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium shadow-lg backdrop-blur-md border border-slate-600 flex items-center gap-2 transition-all"
                            title="Yeniden Oluştur"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        
                        <button 
                            onClick={handleDownloadMedia}
                            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium shadow-lg backdrop-blur-md border border-slate-600 flex items-center gap-2 transition-all"
                            title="Cihaza İndir"
                        >
                            <Download className="w-4 h-4" /> İndir
                        </button>

                        <button 
                            onClick={handleSaveToGallery}
                            disabled={saving || !metadata}
                            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold shadow-lg shadow-green-900/30 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Galeriye Ekle
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-center p-8 opacity-50">
                    {activeTab === 'image' ? (
                        <ImageIcon className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                    ) : (
                        <Film className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                    )}
                    <p className="text-slate-400 font-medium">Önizleme alanı</p>
                    <p className="text-xs text-slate-500 mt-2">Dikey (9:16) format</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default AiGenerator;