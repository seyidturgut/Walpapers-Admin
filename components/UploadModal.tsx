
import React, { useState, useEffect } from 'react';
import { UploadCloud, X, Wand2, Film, Image as ImageIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { MediaType, MediaItem, AiMetadataResponse, AppProfile } from '../types';
import { generateMediaMetadata } from '../services/geminiService';
import { fileToBase64, extractVideoFrame } from '../utils/mediaUtils';

interface UploadModalProps {
  onSave: (item: Omit<MediaItem, 'id' | 'createdAt'>, id?: string) => void;
  onCancel: () => void;
  initialItem?: MediaItem | null;
  activeApp: AppProfile;
}

const UploadModal: React.FC<UploadModalProps> = ({ onSave, onCancel, initialItem, activeApp }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [mediaType, setMediaType] = useState<MediaType>(MediaType.IMAGE);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState(''); 
  const [loadingAi, setLoadingAi] = useState(false);

  // Initialize for Edit Mode
  useEffect(() => {
    if (initialItem) {
        setPreviewUrl(initialItem.url);
        setMediaType(initialItem.type);
        setTitle(initialItem.title);
        setDescription(initialItem.description);
        setTags(initialItem.tags.join(', '));
    }
  }, [initialItem]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      const isVideo = selectedFile.type.startsWith('video/');
      setMediaType(isVideo ? MediaType.VIDEO : MediaType.IMAGE);

      try {
        const base64 = await fileToBase64(selectedFile);
        setPreviewUrl(base64);
      } catch (err) {
        console.error("Error reading file", err);
      }
    }
  };

  const handleGenerateAi = async () => {
    if (!previewUrl) return;

    setLoadingAi(true);
    try {
      let aiInputBase64 = previewUrl;
      let aiInputMime = mediaType === MediaType.VIDEO ? 'video/mp4' : 'image/jpeg';

      if (mediaType === MediaType.VIDEO && file) {
         aiInputBase64 = await extractVideoFrame(file);
         aiInputMime = 'image/jpeg';
      }

      // Pass Active App for Context Aware generation
      const metadata: AiMetadataResponse = await generateMediaMetadata(aiInputBase64, aiInputMime, activeApp);
      
      setTitle(metadata.title);
      setDescription(metadata.description);
      setTags(metadata.tags.join(', '));
    } catch (error) {
      alert("AI analizi başarısız oldu. API anahtarını kontrol edin.");
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSave = () => {
    if (!previewUrl || !title) {
        alert("Lütfen medya yükleyin ve başlık ekleyin.");
        return;
    }

    const tagArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);

    onSave({
        appId: activeApp.id, // Assign to current app
        type: mediaType,
        url: previewUrl,
        title,
        description,
        tags: tagArray
    }, initialItem?.id); 
  };

  const isEditMode = !!initialItem;

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden animate-fade-in max-w-4xl mx-auto">
      <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
        <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <UploadCloud className="text-purple-500" /> 
                {isEditMode ? 'Edit Content' : 'Upload Content'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
                Adding to: <span className="text-purple-400 font-bold">{activeApp.name}</span>
            </p>
        </div>
        <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
        {/* Left Column: Preview */}
        <div className="space-y-4">
            <div className={`aspect-[9/16] rounded-xl border-2 border-dashed border-slate-600 flex items-center justify-center relative overflow-hidden bg-slate-900 group transition-all ${!previewUrl ? 'hover:border-purple-500 hover:bg-slate-800/50' : 'border-purple-500 border-solid'}`}>
                {!previewUrl ? (
                    <label className="cursor-pointer flex flex-col items-center gap-3 w-full h-full justify-center">
                        <UploadCloud className="w-12 h-12 text-slate-500 group-hover:text-purple-400 transition-colors" />
                        <span className="text-slate-400 font-medium">Click to upload media</span>
                        <span className="text-xs text-slate-600">Supports JPG, PNG, MP4</span>
                        <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
                    </label>
                ) : (
                    <>
                        {mediaType === MediaType.IMAGE ? (
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <video src={previewUrl} className="w-full h-full object-cover" controls />
                        )}
                        <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                           <div className="bg-black/60 text-white px-4 py-2 rounded-full backdrop-blur-md text-sm font-medium">
                              Change File
                           </div>
                           <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
                        </label>
                    </>
                )}
            </div>
            {previewUrl && (
                 <button 
                 onClick={handleGenerateAi}
                 disabled={loadingAi}
                 className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl text-white font-semibold shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
             >
                 {loadingAi ? (
                     <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</>
                 ) : (
                     <><Wand2 className="w-5 h-5" /> Auto-Generate Metadata</>
                 )}
             </button>
            )}
        </div>

        {/* Right Column: Details */}
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Content Type</label>
                <div className="flex gap-4">
                    <div className={`flex-1 p-3 rounded-lg border ${mediaType === MediaType.IMAGE ? 'bg-purple-500/20 border-purple-500 text-purple-200' : 'bg-slate-700/30 border-slate-700 text-slate-500'} flex items-center justify-center gap-2`}>
                        <ImageIcon className="w-5 h-5" /> Image
                    </div>
                    <div className={`flex-1 p-3 rounded-lg border ${mediaType === MediaType.VIDEO ? 'bg-purple-500/20 border-purple-500 text-purple-200' : 'bg-slate-700/30 border-slate-700 text-slate-500'} flex items-center justify-center gap-2`}>
                        <Film className="w-5 h-5" /> Video
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Title</label>
                <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g., Cute Kitten Sleeping"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
                <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="A short description of the wallpaper..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Tags (Comma separated)</label>
                <input 
                    type="text" 
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="fluffy, cute, orange cat"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                />
            </div>

            <div className="pt-4 flex gap-4">
                <button 
                    onClick={onCancel}
                    className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSave}
                    disabled={!previewUrl}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <CheckCircle2 className="w-5 h-5" /> {isEditMode ? 'Update' : 'Save'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
