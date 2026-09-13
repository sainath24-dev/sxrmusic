import React, { useState } from 'react';
import { X, Mic2, ListMusic, Music2, Heart } from 'lucide-react';
import usePlayerStore from '../../store/playerStore';
import { decodeHtml } from '../../api/saavn';
import LyricsPanel from '../features/LyricsPanel';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

const RightPanel = ({ onClose }) => {
  const navigate = useNavigate();
  const { currentSong, likedSongs, toggleLike, followedArtists, toggleFollowArtist } = usePlayerStore();
  const [view, setView] = useState('info'); 

  if (!currentSong) return (
    <aside className="w-full h-full flex flex-col bg-[#FFFFFF] items-center justify-center p-8 text-center gap-4 text-[#6B7280]">
      <Music2 size={36} className="text-[#9CA3AF]" />
      <p className="text-sm font-medium">Select a track to see details</p>
    </aside>
  );

  const isLiked = likedSongs.some(s => s.id === currentSong.id);
  const primaryArtist = currentSong.artists?.primary?.[0];
  const isFollowed = primaryArtist && followedArtists.some(a => a.id === primaryArtist.id);

  return (
    <aside className="w-full h-full flex flex-col bg-[#FFFFFF] text-[#0F0F0F] border-l border-[#EAEAEA] overflow-hidden select-none">
      {/* Top Header */}
      <div className="flex flex-col p-4 gap-3 border-b border-[#EAEAEA] shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
            {view === 'info' ? 'Now Playing' : 'Lyrics'}
          </h3>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => toggleLike(currentSong)}
              className={clsx("p-2 rounded-full transition-colors", isLiked ? "text-[#5DD62C] bg-[#F0FDF4]" : "text-[#6B7280] hover:text-[#0F0F0F] bg-[#F3F4F6] hover:bg-[#E5E7EB]")}
              title={isLiked ? "Liked" : "Like"}
            >
              <Heart size={15} fill={isLiked ? "currentColor" : "none"} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#6B7280] hover:text-[#0F0F0F] transition-colors"
              title="Close panel"
            >
              <X size={15} />
            </button>
          </div>
        </div>
        
        {/* Pill View Toggle */}
        <div className="flex bg-[#F3F4F6] p-1 rounded-full border border-[#E5E7EB]">
          <button 
            onClick={() => setView('info')}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-full text-xs font-bold transition-all duration-150",
              view === 'info' ? "bg-[#0F0F0F] text-white shadow-sm" : "text-[#6B7280] hover:text-[#0F0F0F]"
            )}
          >
            <ListMusic size={13} />
            Info
          </button>
          <button 
            onClick={() => setView('lyrics')}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-full text-xs font-bold transition-all duration-150",
              view === 'lyrics' ? "bg-[#0F0F0F] text-white shadow-sm" : "text-[#6B7280] hover:text-[#0F0F0F]"
            )}
          >
            <Mic2 size={13} />
            Lyrics
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {view === 'info' ? (
          <div className="h-full overflow-y-auto custom-scrollbar p-4 flex flex-col gap-5">
            {/* Artwork */}
            <div className="w-full aspect-square rounded-2xl overflow-hidden border border-[#E5E7EB] bg-[#F3F4F6] shadow-sm shrink-0">
              <img 
                src={currentSong.image?.[2]?.url || currentSong.image?.[0]?.url || currentSong.image} 
                alt="" 
                className="w-full h-full object-cover" 
              />
            </div>

            {/* Song Details */}
            <div className="flex flex-col gap-1">
              <h2 
                className="text-lg font-bold text-[#0F0F0F] hover:text-[#337418] cursor-pointer truncate transition-colors" 
                onClick={() => currentSong.album?.id && navigate(`/album/${currentSong.album.id}`)}
              >
                {decodeHtml(currentSong.name || currentSong.title)}
              </h2>
              <p 
                className="text-[#6B7280] font-medium text-sm hover:text-[#0F0F0F] cursor-pointer truncate transition-colors" 
                onClick={() => primaryArtist?.id && navigate(`/artist/${primaryArtist.id}`)}
              >
                {decodeHtml(primaryArtist?.name || currentSong.subtitle)}
              </p>
            </div>

            {/* Artist Card */}
            {primaryArtist && (
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-4 rounded-2xl flex flex-col gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-[#E5E7EB] shrink-0 border border-[#E5E7EB] flex items-center justify-center">
                    {(primaryArtist.image?.[1]?.url || primaryArtist.image?.[0]?.url || primaryArtist.image?.[0]) ? (
                      <img src={primaryArtist.image?.[1]?.url || primaryArtist.image?.[0]?.url || primaryArtist.image?.[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Music2 size={16} className="text-[#9CA3AF]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-[#0F0F0F] truncate">{decodeHtml(primaryArtist.name)}</h4>
                    <p className="text-xs text-[#6B7280]">Artist</p>
                  </div>
                  <button 
                    onClick={() => toggleFollowArtist(primaryArtist)}
                    className={clsx(
                      "px-3 py-1 rounded-full text-xs font-bold transition-all",
                      isFollowed ? "bg-[#C8F142] text-black" : "border border-[#0F0F0F] bg-[#0F0F0F] text-white hover:bg-black"
                    )}
                  >
                    {isFollowed ? "Following" : "Follow"}
                  </button>
                </div>
                <button 
                  onClick={() => navigate(`/artist/${primaryArtist.id}`)}
                  className="w-full py-2 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-xs font-bold text-[#0F0F0F] hover:bg-[#F3F4F6] hover:border-[#5DD62C]/50 transition-colors"
                >
                  View Artist
                </button>
              </div>
            )}

            {/* Credits Section */}
            <div className="flex flex-col gap-2.5">
              <h4 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Credits</h4>
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center group">
                  <div className="flex flex-col min-w-0" onClick={() => primaryArtist?.id && navigate(`/artist/${primaryArtist.id}`)}>
                    <span className="text-sm font-bold text-[#0F0F0F] group-hover:text-[#337418] cursor-pointer truncate transition-colors">{decodeHtml(primaryArtist?.name)}</span>
                    <span className="text-xs text-[#6B7280]">Primary Artist</span>
                  </div>
                </div>
                {currentSong.album?.name && (
                  <div className="flex justify-between items-center group">
                    <div className="flex flex-col min-w-0" onClick={() => currentSong.album?.id && navigate(`/album/${currentSong.album.id}`)}>
                      <span className="text-sm font-bold text-[#0F0F0F] group-hover:text-[#337418] cursor-pointer truncate transition-colors">{decodeHtml(currentSong.album.name)}</span>
                      <span className="text-xs text-[#6B7280]">Album</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full p-4 flex flex-col min-h-0">
            <LyricsPanel />
          </div>
        )}
      </div>
    </aside>
  );
};

export default RightPanel;
