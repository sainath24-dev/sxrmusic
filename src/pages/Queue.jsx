import React from 'react';
import usePlayerStore from '../store/playerStore';
import { Play, MoreHorizontal, Heart, ListMusic, Music2 } from 'lucide-react';
import { useContextMenuStore } from '../store/contextMenuStore';
import { decodeHtml } from '../api/saavn';
import { clsx } from 'clsx';

const Queue = () => {
  const { queue, queueIndex, currentSong, isPlaying, setSong, setQueue, toggleLike, likedSongs } = usePlayerStore();
  const { openMenu } = useContextMenuStore();
  
  const upcomingSongs = queue.slice(queueIndex + 1);

  const handlePlay = (song, idxInFullQueue) => {
    setSong(song);
    setQueue(queue, idxInFullQueue);
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto min-h-full select-none bg-[#FFFFFF] text-[#0F0F0F]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#C8F142]/25 text-[#337418] border border-[#5DD62C]/30 mb-1 inline-block">PLAYLIST QUEUE</span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0F0F0F] tracking-tight">Queue</h1>
        </div>
        {queue.length > 0 && (
          <span className="text-xs font-semibold text-[#6B7280]">
            {queue.length} {queue.length === 1 ? 'track' : 'tracks'}
          </span>
        )}
      </div>
      
      {/* Current Song */}
      {currentSong && (
        <div className="mb-8">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-3">Now Playing</h2>
          <div 
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F0FDF4] border border-[#5DD62C]/30 group cursor-pointer transition-all shadow-sm"
            onContextMenu={(e) => openMenu(e, currentSong)}
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#F3F4F6] shrink-0 border border-[#E5E7EB] relative shadow-sm">
                <img src={currentSong.image?.[0]?.url || currentSong.image} alt="" className="w-full h-full object-cover" />
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Play size={16} fill="#C8F142" className="text-[#C8F142]" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 pr-2">
                <div className="truncate font-bold text-[15px] text-[#337418]">
                  {decodeHtml(currentSong.name || currentSong.title)}
                </div>
                <div className="text-[13px] text-[#6B7280] truncate font-medium">
                  {decodeHtml(currentSong.artists?.primary?.[0]?.name || currentSong.subtitle)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={(e) => { e.stopPropagation(); toggleLike(currentSong); }}
                className={clsx("p-1.5 transition-transform hover:scale-110", likedSongs.some(s => s.id === currentSong.id) ? "text-[#5DD62C]" : "text-[#9CA3AF] hover:text-[#0F0F0F]")}
              >
                <Heart size={17} fill={likedSongs.some(s => s.id === currentSong.id) ? "#5DD62C" : "none"} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); openMenu(e, currentSong); }}
                className="p-1.5 text-[#9CA3AF] hover:text-[#0F0F0F] transition-colors"
              >
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Next Up */}
      {upcomingSongs.length > 0 && (
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-3">Next in Queue</h2>
          <div className="flex flex-col space-y-1">
            {upcomingSongs.map((song, i) => {
              const actualIndex = queueIndex + 1 + i;
              const isLiked = likedSongs.some(s => s.id === song.id);

              return (
                <div 
                  key={`${song.id}-${actualIndex}`} 
                  onClick={() => handlePlay(song, actualIndex)}
                  onContextMenu={(e) => openMenu(e, song)}
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#F4F4F5] border border-transparent hover:border-[#E5E7EB] group cursor-pointer transition-all duration-150"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <span className="text-[13px] font-semibold text-[#6B7280] w-6 text-center tabular-nums group-hover:hidden">
                      {actualIndex + 1}
                    </span>
                    <div className="w-6 hidden group-hover:flex items-center justify-center">
                      <Play size={14} fill="#0F0F0F" className="text-[#0F0F0F]" />
                    </div>

                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#F3F4F6] shrink-0 border border-[#E5E7EB]">
                      <img src={song.image?.[0]?.url || song.image} alt="" className="w-full h-full object-cover" />
                    </div>

                    <div className="min-w-0 flex-1 pr-2">
                      <div className="truncate font-bold text-[14px] text-[#0F0F0F]">
                        {decodeHtml(song.name || song.title)}
                      </div>
                      <div className="text-[12px] text-[#6B7280] truncate font-medium">
                        {decodeHtml(song.artists?.primary?.[0]?.name || song.subtitle)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
                      className={clsx("p-1.5 transition-transform hover:scale-110", isLiked ? "text-[#5DD62C]" : "text-[#9CA3AF] opacity-0 group-hover:opacity-100 hover:text-[#0F0F0F]")}
                    >
                      <Heart size={15} fill={isLiked ? "#5DD62C" : "none"} />
                    </button>
                    <span className="text-[12px] font-semibold text-[#6B7280] tabular-nums hidden sm:inline">
                      {formatDuration(song.duration)}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); openMenu(e, song); }}
                      className="p-1.5 text-[#9CA3AF] opacity-0 group-hover:opacity-100 hover:text-[#0F0F0F] transition-opacity"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {upcomingSongs.length === 0 && !currentSong && (
        <div className="flex flex-col items-center justify-center py-20 text-center text-[#6B7280] gap-3">
          <div className="w-16 h-16 rounded-2xl bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center">
            <ListMusic size={28} className="text-[#9CA3AF]" />
          </div>
          <h3 className="text-xl font-bold text-[#0F0F0F]">Your queue is empty</h3>
          <p className="text-[13px] text-[#6B7280]">Find a song or playlist to start listening.</p>
        </div>
      )}
    </div>
  );
};

export default Queue;
