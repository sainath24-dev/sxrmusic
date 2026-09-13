import React from 'react';
import { Play, Heart, Download, TrendingUp, Clock, Music2, MoreHorizontal, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import usePlayerStore from '../../store/playerStore';
import useDownloadStore from '../../store/downloadStore';
import { decodeHtml } from '../../api/saavn';
import { useNavigate } from 'react-router-dom';

const BentoGrid = ({ trendingSongs = [] }) => {
  const { history, likedSongs, setSong, setQueue, toggleLike } = usePlayerStore();
  const { downloadedSongs, toggleDownload, downloadedIds } = useDownloadStore();
  const navigate = useNavigate();

  const handlePlaySong = (song, list) => {
    if (!song) return;
    setQueue(list, list.findIndex(s => s.id === song.id));
    setSong(song);
  };

  const featuredSong = trendingSongs[0] || null;
  const isLiked = featuredSong ? likedSongs.some(s => s.id === featuredSong.id) : false;
  const isDownloaded = featuredSong ? downloadedIds.includes(featuredSong.id) : false;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8 select-none">
      {/* 1. Curated & Trending Hero Card (Lavender Aesthetic from Image 3) */}
      <div 
        className="lg:col-span-7 rounded-3xl p-6 sm:p-7 relative overflow-hidden bg-gradient-to-br from-[#d8b4fe] via-[#c4b5fd] to-[#a78bfa] text-[#141414] shadow-xl flex flex-col justify-between min-h-[260px] sm:min-h-[290px] group transition-transform duration-200"
      >
        {/* Subtle decorative background art cut-out */}
        {featuredSong && (
          <div className="absolute right-0 top-0 bottom-0 w-1/2 overflow-hidden pointer-events-none opacity-85 group-hover:scale-105 transition-transform duration-500">
            <img 
              src={featuredSong.image?.[2]?.url || featuredSong.image?.[1]?.url || featuredSong.image} 
              className="w-full h-full object-cover object-center rounded-l-3xl mix-blend-multiply filter contrast-125" 
              alt="" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#c4b5fd] via-[#c4b5fd]/40 to-transparent" />
          </div>
        )}

        <div className="relative z-10 max-w-sm">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/10 backdrop-blur-md text-xs font-semibold text-black/80 mb-3">
            <Sparkles size={13} className="text-black" />
            Curated & trending
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0f0f0f] leading-snug font-display line-clamp-2">
            {featuredSong ? decodeHtml(featuredSong.name || featuredSong.title) : "Discover Weekly"}
          </h2>
          <p className="text-black/70 text-xs sm:text-sm font-medium mt-1 mb-6 line-clamp-2">
            {featuredSong ? decodeHtml(featuredSong.artists?.primary?.[0]?.name || featuredSong.subtitle) : "The original slow instrumental best playlists curated for your vibe."}
          </p>
        </div>

        {/* Action Controls on Lavender Card */}
        <div className="relative z-10 flex items-center gap-3">
          <button 
            onClick={() => featuredSong && handlePlaySong(featuredSong, trendingSongs)}
            className="w-12 h-12 rounded-full bg-[#141414] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg hover:bg-black"
            title="Play"
          >
            <Play size={20} fill="currentColor" className="ml-0.5" />
          </button>

          {featuredSong && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleLike(featuredSong); }}
                className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all bg-black/10 hover:bg-black/20 text-[#141414]",
                  isLiked && "text-[#141414]"
                )}
                title="Save to Liked"
              >
                <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
              </button>

              <button 
                onClick={(e) => { e.stopPropagation(); toggleDownload(featuredSong); }}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-black/10 hover:bg-black/20 text-[#141414]"
                title="Download"
              >
                <Download size={18} />
              </button>

              <button 
                onClick={() => navigate('/discover')}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-black/10 hover:bg-black/20 text-[#141414]"
                title="Explore More"
              >
                <MoreHorizontal size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Recently Played / Quick Mix Panel */}
      <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#EAEAEA] rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#0F0F0F] flex items-center gap-2 uppercase tracking-wider">
            <Clock size={16} className="text-[#337418]" />
            Recent Activity
          </h3>
          <button 
            onClick={() => navigate('/stats')} 
            className="text-xs font-semibold text-[#6B7280] hover:text-[#337418] uppercase tracking-wider transition-colors"
          >
            Stats →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {history.slice(0, 4).map((song, idx) => {
            const imgUrl = song.image?.[1]?.url || song.image?.[0]?.url || song.image;
            return (
              <div 
                key={`${song.id}-${idx}`} 
                onClick={() => handlePlaySong(song, history)}
                className="bg-[#F8F8F8] hover:bg-[#F3F4F6] border border-[#E5E7EB] p-2 rounded-2xl flex flex-col gap-1.5 cursor-pointer group transition-colors shadow-sm"
              >
                <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative">
                  {imgUrl ? (
                    <img src={imgUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#F3F4F6]">
                      <Music2 size={20} className="text-[#9CA3AF]" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Play size={16} fill="white" className="text-white ml-0.5" />
                  </div>
                </div>
                <p className="text-xs font-semibold text-[#0F0F0F] truncate">{decodeHtml(song.name || song.title)}</p>
              </div>
            );
          })}

          {history.length === 0 && (
            <div className="col-span-4 flex flex-col items-center justify-center py-6 text-[#9CA3AF]">
              <Music2 size={28} className="opacity-40" />
              <p className="text-xs font-semibold mt-2 uppercase tracking-wider">Play music to see history</p>
            </div>
          )}
        </div>

        {/* Quick Liked & Offline Row */}
        <div className="grid grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-[#EAEAEA]">
          <div 
            onClick={() => navigate('/liked')}
            className="bg-[#F8F8F8] hover:bg-[#F3F4F6] border border-[#E5E7EB] p-3 rounded-2xl flex items-center gap-2.5 cursor-pointer transition-colors shadow-sm"
          >
            <div className="w-8 h-8 rounded-full bg-[#E8F8D8] border border-[#5DD62C]/40 flex items-center justify-center text-[#337418]">
              <Heart size={15} fill="#337418" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#0F0F0F] truncate">Liked</p>
              <p className="text-[11px] text-[#6B7280]">{likedSongs.length} tracks</p>
            </div>
          </div>

          <div 
            onClick={() => navigate('/library')}
            className="bg-[#F8F8F8] hover:bg-[#F3F4F6] border border-[#E5E7EB] p-3 rounded-2xl flex items-center gap-2.5 cursor-pointer transition-colors shadow-sm"
          >
            <div className="w-8 h-8 rounded-full bg-[#E5E7EB] border border-[#D1D5DB] flex items-center justify-center text-[#0F0F0F]">
              <Download size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#0F0F0F] truncate">Downloads</p>
              <p className="text-[11px] text-[#6B7280]">{downloadedSongs.length} tracks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BentoGrid;

