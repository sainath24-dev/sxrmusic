import React, { useEffect, useRef } from 'react';
import { useContextMenuStore } from '../../store/contextMenuStore';
import usePlayerStore from '../../store/playerStore';
import useDownloadStore from '../../store/downloadStore';
import { Play, Plus, ListPlus, Download, Loader2, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

const ContextMenu = () => {
  const { isOpen, x, y, song, closeMenu } = useContextMenuStore();
  const { setSong, queue, setQueue, toggleLike, likedSongs } = usePlayerStore();
  const { downloadedIds, isDownloading, toggleDownload } = useDownloadStore();
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        closeMenu();
      }
    };
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('contextmenu', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('contextmenu', handleClickOutside);
    };
  }, [isOpen, closeMenu]);

  if (!isOpen || !song) return null;

  const safeX = Math.min(Math.max(10, x), window.innerWidth - 220);
  const safeY = Math.min(Math.max(10, y), window.innerHeight - 240);

  const handleAction = (action) => {
    action();
    closeMenu();
  };

  const isDownloaded = downloadedIds.includes(song.id);
  const isDownloadingSong = isDownloading[song.id];
  const isLiked = likedSongs.some(s => s.id === song.id);

  return (
    <div 
      ref={menuRef}
      className="fixed z-[1200] w-56 bg-[#FFFFFF]/95 backdrop-blur-xl border border-[#E5E7EB] shadow-2xl rounded-2xl py-2 text-[13px] text-[#0F0F0F] font-medium select-none animate-in fade-in zoom-in-95 duration-100"
      style={{ left: safeX, top: safeY }}
    >
      <div 
        className="px-4 py-2 hover:bg-[#F4F4F5] cursor-pointer flex items-center gap-3 transition-colors text-[#0F0F0F] hover:text-[#337418]"
        onClick={() => handleAction(() => { setSong(song); })}
      >
        <Play className="w-4 h-4 fill-current text-[#337418]" />
        <span className="font-bold">Play</span>
      </div>

      <div 
        className="px-4 py-2 hover:bg-[#F4F4F5] cursor-pointer flex items-center gap-3 transition-colors text-[#6B7280] hover:text-[#0F0F0F]"
        onClick={() => handleAction(() => {
          setQueue([...queue, song], queue.length);
          toast.success("Added to Queue");
        })}
      >
        <ListPlus className="w-4 h-4 text-[#6B7280]" />
        <span>Add to queue</span>
      </div>

      <div 
        className="px-4 py-2 hover:bg-[#F4F4F5] cursor-pointer flex items-center gap-3 transition-colors text-[#6B7280] hover:text-[#0F0F0F]"
        onClick={() => handleAction(() => {
          toggleLike(song);
          toast.success(isLiked ? "Removed from Liked Songs" : "Saved to Liked Songs");
        })}
      >
        <Heart className={clsx("w-4 h-4", isLiked ? "text-[#5DD62C] fill-current" : "text-[#6B7280]")} />
        <span>{isLiked ? "Remove from Liked" : "Save to Liked Songs"}</span>
      </div>

      <div className="h-px bg-[#EAEAEA] my-1 mx-2" />

      <div 
        className="px-4 py-2 hover:bg-[#F4F4F5] cursor-pointer flex items-center gap-3 transition-colors text-[#6B7280] hover:text-[#0F0F0F]"
        onClick={() => handleAction(() => toggleDownload(song))}
      >
        {isDownloadingSong ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#5DD62C]" />
        ) : (
          <Download className={clsx("w-4 h-4", isDownloaded ? "text-[#5DD62C]" : "text-[#6B7280]")} />
        )}
        <span>{isDownloaded ? "Remove download" : "Download offline"}</span>
      </div>
    </div>
  );
};

export default ContextMenu;
