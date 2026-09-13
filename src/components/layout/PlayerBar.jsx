import React, { useEffect } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, 
  Volume2, VolumeX, Mic2, ListMusic, Maximize2, Heart, X, Download, Loader2 
} from 'lucide-react';
import usePlayerStore from '../../store/playerStore';
import useDownloadStore from '../../store/downloadStore';
import { usePlayer } from '../../hooks/usePlayer';
import { decodeHtml } from '../../api/saavn';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

const PlayerBar = ({ onToggleLyrics, isLyricsOpen }) => {
  const { 
    currentSong, isPlaying, setPlaying, 
    currentTime, duration, volume, setVolume,
    isMuted, toggleMute, isShuffled, toggleShuffle,
    repeatMode, cycleRepeat, nextSong, prevSong,
    likedSongs, toggleLike,
    toggleFullScreen, setFullScreen
  } = usePlayerStore();

  const { downloadedIds, isDownloading, toggleDownload } = useDownloadStore();
  const { seek } = usePlayer();

  // Media Session API (Lock Screen / Background Audio)
  useEffect(() => {
    if ('mediaSession' in navigator && currentSong) {
      const title = decodeHtml(currentSong.name || currentSong.title);
      const artist = decodeHtml(currentSong.artists?.primary?.[0]?.name || currentSong.artists?.all?.[0]?.name || 'Unknown Artist');
      const album = decodeHtml(currentSong.album?.name || '');
      const artworkUrl = currentSong.image?.[2]?.url || currentSong.image?.[0]?.url || '';

      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist,
        album,
        artwork: [
          { src: artworkUrl, sizes: '96x96', type: 'image/jpeg' },
          { src: artworkUrl, sizes: '128x128', type: 'image/jpeg' },
          { src: artworkUrl, sizes: '192x192', type: 'image/jpeg' },
          { src: artworkUrl, sizes: '256x256', type: 'image/jpeg' },
          { src: artworkUrl, sizes: '384x384', type: 'image/jpeg' },
          { src: artworkUrl, sizes: '512x512', type: 'image/jpeg' },
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => setPlaying(true));
      navigator.mediaSession.setActionHandler('pause', () => setPlaying(false));
      navigator.mediaSession.setActionHandler('previoustrack', prevSong);
      navigator.mediaSession.setActionHandler('nexttrack', nextSong);
    }
  }, [currentSong, setPlaying, prevSong, nextSong]);

  const formatTime = (time) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    seek(percentage * (duration || 1));
  };

  if (!currentSong) return null;

  const isLiked = likedSongs.some(s => s.id === currentSong.id);
  const isDownloaded = downloadedIds.includes(currentSong.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Desktop Full-Width Now-Playing Bar */}
      <footer className="hidden lg:flex h-[84px] bg-[#FFFFFF]/95 backdrop-blur-xl border-t border-[#EAEAEA] px-6 items-center justify-between z-50 select-none shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        {/* Left: Track Info */}
        <div className="flex items-center gap-3.5 w-[28%] min-w-0">
          <div className="w-13 h-13 rounded-2xl overflow-hidden bg-[#F3F4F6] border border-[#E5E7EB] shrink-0 shadow-sm relative group">
            <img 
              src={currentSong.image?.[1]?.url || currentSong.image?.[0]?.url || currentSong.image} 
              alt="" 
              className="w-full h-full object-cover" 
            />
          </div>

          <div className="min-w-0 flex flex-col">
            <h4 className="text-sm font-semibold text-[#0F0F0F] truncate hover:text-[#337418] cursor-pointer transition-colors">
              {decodeHtml(currentSong.name || currentSong.title)}
            </h4>
            <p className="text-xs text-[#6B7280] truncate hover:text-[#0F0F0F] cursor-pointer transition-colors mt-0.5">
              {decodeHtml(currentSong.artists?.primary?.[0]?.name || currentSong.artists?.all?.[0]?.name || currentSong.subtitle)}
            </p>
          </div>

          <button 
            onClick={() => toggleLike(currentSong)}
            className={clsx("transition-colors ml-1 p-1.5 rounded-full hover:bg-[#F3F4F6] hover:scale-105", isLiked ? "text-[#5DD62C]" : "text-[#9CA3AF] hover:text-[#0F0F0F]")}
            title={isLiked ? "Remove from Liked" : "Save to Liked"}
          >
            <Heart size={17} fill={isLiked ? "#5DD62C" : "none"} />
          </button>

          <button 
            onClick={() => toggleDownload(currentSong)}
            disabled={isDownloading[currentSong.id]}
            className={clsx("transition-colors p-1.5 rounded-full hover:bg-[#F3F4F6] hover:scale-105", isDownloaded ? "text-[#5DD62C]" : "text-[#9CA3AF] hover:text-[#0F0F0F]")}
            title={isDownloaded ? "Downloaded for offline" : "Download"}
          >
            {isDownloading[currentSong.id] ? (
              <Loader2 size={17} className="animate-spin text-[#5DD62C]" />
            ) : (
              <Download size={17} className={clsx(!isDownloaded && "opacity-50")} />
            )}
          </button>
        </div>

        {/* Center: Playback Controls & Timeline */}
        <div className="flex-1 max-w-[46%] flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleShuffle}
              className={clsx("transition-colors p-1", isShuffled ? "text-[#337418] font-bold" : "text-[#6B7280] hover:text-[#0F0F0F]")}
              title="Shuffle"
            >
              <Shuffle size={15} />
            </button>

            <button 
              onClick={prevSong} 
              className="w-8 h-8 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#0F0F0F] flex items-center justify-center transition-transform active:scale-95 border border-[#E5E7EB] shadow-sm"
              title="Previous"
            >
              <SkipBack size={15} fill="currentColor" />
            </button>

            <button 
              onClick={() => setPlaying(!isPlaying)}
              className="w-10 h-10 rounded-full bg-[#C8F142] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_2px_12px_rgba(200,241,66,0.5)] font-bold"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
            </button>

            <button 
              onClick={nextSong} 
              className="w-8 h-8 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#0F0F0F] flex items-center justify-center transition-transform active:scale-95 border border-[#E5E7EB] shadow-sm"
              title="Next"
            >
              <SkipForward size={15} fill="currentColor" />
            </button>

            <button 
              onClick={cycleRepeat}
              className={clsx("transition-colors p-1 relative", repeatMode !== 'none' ? "text-[#337418] font-bold" : "text-[#6B7280] hover:text-[#0F0F0F]")}
              title={`Repeat: ${repeatMode}`}
            >
              <Repeat size={15} />
              {repeatMode === 'one' && (
                <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-[#C8F142] text-black w-3.5 h-3.5 rounded-full flex items-center justify-center leading-none">
                  1
                </span>
              )}
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="flex items-center gap-2.5 w-full text-xs text-[#6B7280]">
            <span className="w-8 text-right tabular-nums font-medium">{formatTime(currentTime)}</span>
            <div 
              className="flex-1 h-1.5 bg-[#E5E7EB] hover:h-2 rounded-full relative cursor-pointer group transition-all overflow-hidden"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-[#5DD62C] rounded-full relative transition-all" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
            <span className="w-8 tabular-nums font-medium">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Tools & Volume */}
        <div className="w-[28%] flex items-center justify-end gap-2.5">
          <button 
            onClick={onToggleLyrics}
            className={clsx("transition-colors p-2 rounded-full border", isLyricsOpen ? "text-[#337418] bg-[#F0FDF4] border-[#5DD62C]/40 font-bold" : "text-[#6B7280] hover:text-[#0F0F0F] hover:bg-[#F3F4F6] border-transparent")}
            title="Lyrics"
          >
            <Mic2 size={17} />
          </button>

          <Link 
            to="/queue"
            className="text-[#6B7280] hover:text-[#0F0F0F] hover:bg-[#F3F4F6] p-2 rounded-full transition-colors"
            title="Queue"
          >
            <ListMusic size={17} />
          </Link>

          {/* Volume Slider */}
          <div className="flex items-center gap-2 w-24 group">
            <button onClick={toggleMute} className="text-[#6B7280] group-hover:text-[#0F0F0F] p-1">
              {isMuted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
            <div className="flex-1 h-1.5 bg-[#E5E7EB] hover:h-2 rounded-full relative cursor-pointer transition-all overflow-hidden">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div 
                className="h-full bg-[#5DD62C] rounded-full relative" 
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }} 
              />
            </div>
          </div>

          <button 
            onClick={toggleFullScreen}
            className="text-[#6B7280] hover:text-[#0F0F0F] hover:bg-[#F3F4F6] p-2 rounded-full transition-colors"
            title="Fullscreen"
          >
            <Maximize2 size={17} />
          </button>
        </div>
      </footer>

      {/* Mobile Floating Mini Player */}
      <div 
        onClick={() => setFullScreen(true)}
        className="lg:hidden fixed bottom-[72px] left-3 right-3 h-[60px] bg-[#FFFFFF]/95 backdrop-blur-2xl border border-[#E5E7EB] rounded-2xl z-[850] overflow-hidden flex items-center px-3.5 gap-3 shadow-xl cursor-pointer select-none"
      >
        {/* Album Artwork */}
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#F3F4F6] shrink-0 border border-[#E5E7EB] shadow-sm">
          <img 
            src={currentSong.image?.[1]?.url || currentSong.image?.[0]?.url || currentSong.image} 
            alt="" 
            className="w-full h-full object-cover" 
          />
        </div>
        
        {/* Title & Artist */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h4 className="text-xs font-bold text-[#0F0F0F] truncate">
            {decodeHtml(currentSong.name || currentSong.title)}
          </h4>
          <p className="text-[11px] text-[#6B7280] truncate font-medium">
            {decodeHtml(currentSong.artists?.primary?.[0]?.name || currentSong.subtitle)}
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={(e) => { e.stopPropagation(); toggleLike(currentSong); }} 
            className={clsx("p-1.5 transition-transform active:scale-90", isLiked ? "text-[#5DD62C]" : "text-[#9CA3AF]")}
          >
            <Heart size={18} fill={isLiked ? "#5DD62C" : "none"} />
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); setPlaying(!isPlaying); }} 
            className="w-9 h-9 rounded-full bg-[#C8F142] text-black flex items-center justify-center active:scale-90 transition-transform shadow-md font-bold"
          >
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
          </button>
        </div>
        
        {/* Progress Line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#E5E7EB]">
          <div className="h-full bg-[#5DD62C]" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
    </>
  );
};

export default PlayerBar;

