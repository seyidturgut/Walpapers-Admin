import React from 'react';
import { MediaItem } from '../types';
import { Copy, Download, Code } from 'lucide-react';

interface ApiPreviewProps {
  items: MediaItem[];
}

const ApiPreview: React.FC<ApiPreviewProps> = ({ items }) => {
  const apiStructure = {
    metadata: {
      appName: "Cat Wallpaper App",
      version: "1.0.0",
      totalItems: items.length,
      generatedAt: new Date().toISOString(),
    },
    data: items.map(item => ({
      id: item.id,
      kind: item.type.toLowerCase(),
      title: item.title,
      description: item.description,
      tags: item.tags,
      resource_url: "[HOST_URL]/content/" + item.id + (item.type === 'IMAGE' ? '.jpg' : '.mp4'),
      published_at: new Date(item.createdAt).toISOString()
    }))
  };

  const jsonString = JSON.stringify(apiStructure, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    alert("JSON copied to clipboard!");
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cat-app-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                    <Code className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white mb-2">Android App Integration</h2>
                    <p className="text-slate-400 leading-relaxed">
                        This is the generated JSON response your Android application will consume. 
                        In a production environment, you would host this JSON file and the associated media files on a server.
                        The Android app would make a GET request to that URL.
                    </p>
                </div>
            </div>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-4 bg-slate-950 border-b border-slate-800">
                <span className="text-xs font-mono text-purple-400">GET /api/v1/wallpapers</span>
                <div className="flex gap-2">
                    <button onClick={handleCopy} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title="Copy">
                        <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={handleDownload} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title="Download">
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="p-0 overflow-x-auto">
                <pre className="text-sm font-mono text-slate-300 p-6">
                    {jsonString}
                </pre>
            </div>
        </div>
    </div>
  );
};

export default ApiPreview;
