
import React from 'react';
import { MediaItem, MediaType, AppProfile } from '../types';
import { Trash2, Film, Image as ImageIcon, Search, Pencil, Plus } from 'lucide-react';

interface DashboardProps {
  items: MediaItem[];
  activeApp: AppProfile;
  onDelete: (id: string) => void;
  onEdit: (item: MediaItem) => void;
  onOpenUpload: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ items, activeApp, onDelete, onEdit, onOpenUpload }) => {
  const [filter, setFilter] = React.useState('');

  // 1. Filter by Active App
  const appItems = items.filter(item => item.appId === activeApp.id);

  // 2. Filter by Search Query
  const filteredItems = appItems.filter(item => 
    item.title.toLowerCase().includes(filter.toLowerCase()) ||
    item.tags.some(tag => tag.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <p className="text-slate-400 text-sm font-medium mb-1">Total Assets ({activeApp.name})</p>
          <h3 className="text-3xl font-bold text-white">{appItems.length}</h3>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <p className="text-slate-400 text-sm font-medium mb-1">Images</p>
          <h3 className="text-3xl font-bold text-purple-400">{appItems.filter(i => i.type === MediaType.IMAGE).length}</h3>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <p className="text-slate-400 text-sm font-medium mb-1">Videos</p>
          <h3 className="text-3xl font-bold text-blue-400">{appItems.filter(i => i.type === MediaType.VIDEO).length}</h3>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
        <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input 
                type="text" 
                placeholder={`Search in ${activeApp.name}...`} 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
            />
        </div>
        <button 
            onClick={onOpenUpload}
            className="w-full md:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2"
        >
            <Plus className="w-5 h-5" /> Add Content to {activeApp.name}
        </button>
      </div>

      {/* Grid */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
            <div className="bg-slate-800 p-4 rounded-full mb-4">
                <Search className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-lg font-semibold text-slate-400">No content found in {activeApp.name}.</p>
            <p className="text-sm">Start by adding new media or use AI Studio.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
                <div key={item.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-purple-500/50 transition-all hover:shadow-xl hover:shadow-purple-900/10 group">
                    <div className="relative aspect-[9/16] bg-slate-900">
                        {item.type === MediaType.IMAGE ? (
                            <img src={item.url} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                            <video src={item.url} className="w-full h-full object-cover" />
                        )}
                        
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1 z-10">
                            {item.type === MediaType.IMAGE ? <ImageIcon className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                            {item.type}
                        </div>

                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                             <button 
                                onClick={() => onEdit(item)}
                                className="p-3 bg-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white rounded-full transition-all transform hover:scale-110"
                                title="Edit"
                            >
                                <Pencil className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => onDelete(item.id)}
                                className="p-3 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-all transform hover:scale-110"
                                title="Delete"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="p-4">
                        <h4 className="font-bold text-white mb-1 truncate">{item.title}</h4>
                        <p className="text-xs text-slate-400 mb-3 truncate">{item.description}</p>
                        <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-[10px] rounded-full">
                                    #{tag}
                                </span>
                            ))}
                            {item.tags.length > 3 && (
                                <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-[10px] rounded-full">+{item.tags.length - 3}</span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
