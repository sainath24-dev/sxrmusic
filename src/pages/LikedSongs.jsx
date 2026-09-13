import React from 'react';
import usePlayerStore from '../store/playerStore';
import { Play, Heart, Clock, MoreHorizontal, Sparkles, Trash2 } from 'lucide-react';
import { useContextMenuStore } from '../store/contextMenuStore';
import { decodeHtml } from '../api/saavn';
import { clsx } from 'clsx';

const LikedSongs = () => {
  const { likedSongs, setSong, setQueue, currentSong, isPlaying, toggleLike } = usePlayerStore();
  const { openMenu } = useContextMenuStore();

  const handlePlay = (song, index) => {
    setQueue(likedSongs, index);
    setSong(song);
  };

  const formatDuration = (secs) => {
    if (!secs) return '3:20';
    const total = parseInt(secs, 10);
    if (isNaN(total)) return secs;
    const m = Math.floor(total / 60);
    const s = Math.floor(total % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col min-h-full bg-[#FFFFFF] text-[#0F0F0F]">
      {/* Header Banner - Light Spring Green Gradient */}
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end p-6 sm:p-8 bg-gradient-to-b from-[#E8F8D8] via-[#F4FCED] to-[#FFFFFF] border-b border-[#EAEAEA] min-h-[220px] sm:min-h-[260px]">
        {/* Heart Artwork Box */}
        <div className="w-32 h-32 sm:w-44 sm:h-44 md:w-48 md:h-48 bg-gradient-to-br from-[#E2F7C2] via-[#C8F142] to-[#B2E690] rounded-3xl shadow-xl flex items-center justify-center shrink-0 border border-[#5DD62C]/40">
          <Heart className="w-14 h-14 sm:w-20 sm:h-20 text-[#337418] fill-[#337418] drop-shadow-sm" />
        </div>
        
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#C8F142]/20 text-[#337418] border border-[#5DD62C]/30 uppercase tracking-wider">PLAYLIST</span>
            <span className="text-[11px] font-bold text-[#6B7280] tracking-wider uppercase">Personal Collection</span>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-[#0F0F0F] tracking-tight leading-tight">
            Liked Songs
          </h1>
          <div className="flex items-center gap-2 text-[13px] text-[#6B7280] font-medium mt-1">
            <span className="font-bold text-[#0F0F0F]">Your Collection</span>
            <span>•</span>
            <span className="text-[#337418] font-bold">{likedSongs.length} tracks</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Action Controls */}
        <div className="flex items-center gap-4">
          <button 
            className="w-13 h-13 rounded-full bg-[#C8F142] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#C8F142]/40 disabled:opacity-40 disabled:hover:scale-100 font-bold"
            onClick={() => likedSongs.length > 0 && handlePlay(likedSongs[0], 0)}
            disabled={likedSongs.length === 0}
            title="Play Liked Songs"
          >
            <Play size={22} fill="currentColor" className="ml-0.5" />
          </button>
          <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
            {likedSongs.length} Saved {likedSongs.length === 1 ? 'Track' : 'Tracks'}
          </span>
        </div>

        {/* Tracks Table / List */}
        {likedSongs.length > 0 ? (
          <div className="flex flex-col">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2.5 border-b border-[#EAEAEA] text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-11 sm:col-span-6 md:col-span-5">Title</div>
              <div className="hidden sm:block sm:col-span-5 md:col-span-4">Album</div>
              <div className="hidden md:flex md:col-span-2 justify-end items-center pr-4">
                <Clock size={14} />
              </div>
            </div>

            {/* Song Rows */}
            <div className="flex flex-col mt-2 space-y-1">
              {likedSongs.map((song, index) => {
                const isCurrent = currentSong?.id === song.id;

                return (
                  <div 
                    key={`${song.id}-${index}`}
                    onClick={() => handlePlay(song, index)}
                    onContextMenu={(e) => openMenu(e, song)}
                    className={clsx(
                      "grid grid-cols-12 gap-4 items-center px-4 py-3 rounded-2xl hover:bg-[#F4F4F5] border border-transparent hover:border-[#E5E7EB] group cursor-pointer transition-all duration-150",
                      isCurrent ? "bg-[#F0FDF4] border-[#5DD62C]/30" : ""
                    )}
                  >
                    {/* Index / Play */}
                    <div className="col-span-1 text-center text-[13px] text-[#6B7280]">
                      <span className="group-hover:hidden tabular-nums font-medium">{index + 1}</span>
                      <Play size={14} fill="#337418" className="hidden group-hover:inline ml-auto mr-auto text-[#337418]" />
                    </div>

                    {/* Title & Artist */}
                    <div className="col-span-11 sm:col-span-6 md:col-span-5 flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#F3F4F6] shrink-0 border border-[#E5E7EB]">
                        <img src={song.image?.[0]?.url || song.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1 pr-2">
                        <h4 className={clsx("text-sm font-bold truncate", isCurrent ? "text-[#337418]" : "text-[#0F0F0F]")}>
                          {decodeHtml(song.name || song.title)}
                        </h4>
                        <p className="text-xs text-[#6B7280] truncate font-medium">
                          {decodeHtml(song.artists?.primary?.[0]?.name || song.subtitle)}
                        </p>
                      </div>
                    </div>

                    {/* Album */}
                    <div className="hidden sm:block sm:col-span-5 md:col-span-4 text-xs text-[#6B7280] truncate font-medium">
                      {decodeHtml(song.album?.name || '')}
                    </div>

                    {/* Duration & Actions */}
                    <div className="col-span-11 sm:col-span-5 md:col-span-2 flex items-center justify-end gap-3 pr-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
                        className="p-1.5 text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Remove from Liked Songs"
                      >
                        <Trash2 size={16} />
                      </button>
                      <span className="text-xs text-[#6B7280] tabular-nums font-medium hidden sm:inline">
                        {formatDuration(song.duration)}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); openMenu(e, song); }}
                        className="p-1.5 text-[#9CA3AF] hover:text-[#0F0F0F] transition-colors"
                        title="More options"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center">
              <Heart size={28} className="text-[#9CA3AF]" />
            </div>
            <h3 className="text-xl font-bold text-[#0F0F0F]">Songs you like will appear here</h3>
            <p className="text-[13px] text-[#6B7280] max-w-sm">Save songs by tapping the heart icon on any track to build your personal library.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LikedSongs;
