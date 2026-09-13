import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import usePlayerStore from '../../store/playerStore';
import { toast } from 'react-hot-toast';
import { X, Plus } from 'lucide-react';

const PlaylistPicker = ({ song, onClose }) => {
  const { playlists, addSongToPlaylist, createPlaylist } = usePlayerStore();
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const handleAdd = (pid, pname) => {
    addSongToPlaylist(pid, song);
    toast.success(`Added to ${pname}`);
    onClose();
  };

  const handleCreate = () => {
    if (!newPlaylistName.trim()) return;
    const id = createPlaylist(newPlaylistName.trim());
    addSongToPlaylist(id, song);
    toast.success(`Created & Added to ${newPlaylistName}`);
    onClose();
  };

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1200] flex items-center justify-center p-4 select-none" 
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <div 
        className="w-full max-w-sm bg-[#FFFFFF] text-[#0F0F0F] rounded-2xl shadow-2xl border border-[#EAEAEA] p-6 flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#C8F142]/25 text-[#337418] border border-[#5DD62C]/30">PLAYLIST</span>
            <h3 className="text-base font-bold text-[#0F0F0F]">Add to Playlist</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-[#6B7280] hover:text-[#0F0F0F] p-1.5 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="max-h-56 overflow-y-auto custom-scrollbar mb-4 flex flex-col gap-1.5">
          {playlists.length === 0 ? (
            <p className="text-[#6B7280] text-[13px] text-center py-4">No custom playlists yet.</p>
          ) : (
            playlists.map(p => (
              <button 
                key={p.id} 
                onClick={() => handleAdd(p.id, p.name)} 
                className="w-full text-left px-3.5 py-2.5 rounded-xl bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] text-[13px] font-bold text-[#0F0F0F] transition-all truncate hover:border-[#5DD62C]/50 hover:text-[#337418]"
              >
                {p.name}
              </button>
            ))
          )}
        </div>

        <div className="pt-4 border-t border-[#EAEAEA] flex flex-col gap-2.5">
          <input 
            type="text" 
            placeholder="New playlist name..." 
            value={newPlaylistName}
            onChange={e => setNewPlaylistName(e.target.value)}
            className="w-full bg-[#F9FAFB] text-[#0F0F0F] placeholder-[#9CA3AF] rounded-xl px-4 py-2 text-[13px] border border-[#E5E7EB] focus:outline-none focus:border-[#5DD62C]"
          />
          <button 
            onClick={handleCreate} 
            className="w-full py-2.5 text-[13px] font-bold rounded-full bg-[#C8F142] text-black hover:bg-[#d4f85e] shadow-md shadow-[#C8F142]/30 transition-all cursor-pointer"
          >
            Create & Add
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PlaylistPicker;
