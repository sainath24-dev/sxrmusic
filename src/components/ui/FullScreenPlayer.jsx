import React, { useEffect, useState, useMemo } from 'react';
import usePlayerStore from '../../store/playerStore';
import { usePlayer } from '../../hooks/usePlayer';
import { 
  ArrowLeft, Heart, Play, Pause, SkipBack, SkipForward, 
  Volume2, VolumeX, Shuffle, Repeat, Mic2, Download, Loader2, ListMusic, MoreHorizontal
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import useDownloadStore from '../../store/downloadStore';
import { getLyrics, decodeHtml } from '../../api/saavn';
import { clsx } from 'clsx';
import LyricsPanel from '../features/LyricsPanel';

const WordByWordSnippet = ({ text, startTime, endTime, currentTime }) => {
  const { words, wordRanges } = useMemo(() => {
    const rawWords = (text || '').trim().split(/\s+/).filter(Boolean);
    const weights = rawWords.map(w => Math.max(2, w.length));
    const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;

    let accumulated = 0;
    const ranges = rawWords.map((w, i) => {
      const start = accumulated / totalWeight;
      accumulated += weights[i];
      const end = accumulated / totalWeight;
      return { word: w, start, end };
    });

    return { words: rawWords, wordRanges: ranges };
  }, [text]);

  const rawDuration = endTime ? (endTime - startTime) : 3.8;
  const lineDuration = Math.max(0.8, Math.min(rawDuration, 12.0));
  const elapsed = Math.max(0, currentTime - startTime);
  const lineProgress = Math.min(1, Math.max(0, elapsed / lineDuration));

  return (
    <span className="inline-flex flex-wrap items-baseline justify-center">
      {wordRanges.map(({ word, start, end }, wIdx) => {
        const isWordDone = lineProgress >= end;
        const isWordActive = lineProgress >= start && lineProgress < end;

        if (isWordDone) {
          return (
            <span key={wIdx} className="inline-block mr-[0.28em] text-[#166534] font-black transition-colors duration-150">
              {word}
            </span>
          );
        }

        if (isWordActive) {
          return (
            <span 
              key={wIdx} 
              className="inline-block mx-0.5 px-1 py-0.5 rounded-md bg-[#C8F142]/40 text-[#166534] font-black transform scale-105 shadow-[0_2px_10px_rgba(93,214,44,0.35)] ring-1 ring-[#5DD62C]/40 transition-all duration-150 ease-out"
            >
              {word}
            </span>
          );
        }

        return (
          <span key={wIdx} className="inline-block mr-[0.28em] text-[#9CA3AF] opacity-60 font-bold transition-colors duration-150">
            {word}
          </span>
        );
      })}
    </span>
  );
};

const FullScreenPlayer = () => {
  const { 
    isFullScreen, setFullScreen, currentSong, isPlaying, setPlaying, 
    currentTime, duration, nextSong, prevSong, likedSongs, toggleLike,
    isShuffled, toggleShuffle, repeatMode, cycleRepeat,
    volume, setVolume, isMuted, toggleMute
  } = usePlayerStore();
  
  const { seek } = usePlayer();
  const { downloadedIds, isDownloading, toggleDownload } = useDownloadStore();
  const [showLyrics, setShowLyrics] = useState(false);

  useEffect(() => {
    if (!isFullScreen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setFullScreen(false);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, setFullScreen]);

  const { data: lyricsData } = useQuery({
    queryKey: ['lyrics', currentSong?.id, currentSong?.name || currentSong?.title],
    queryFn: () => getLyrics(currentSong),
    enabled: !!currentSong && isFullScreen,
    staleTime: 1000 * 60 * 30,
  });

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

  if (!isFullScreen || !currentSong) return null;

  const isLiked = likedSongs.some(s => s.id === currentSong.id);
  const isDownloaded = downloadedIds.includes(currentSong.id);
  const imageUrl = currentSong.image?.[2]?.url || currentSong.image?.[1]?.url || currentSong.image?.[0]?.url || currentSong.image;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const lyricLines = lyricsData?.data?.lines || [];
  const isSynced = lyricsData?.data?.synced || false;

  let activeIdx = 0;
  if (isSynced && lyricLines.length > 0) {
    for (let i = 0; i < lyricLines.length; i++) {
      if (currentTime >= lyricLines[i].time) {
        activeIdx = i;
      } else {
        break;
      }
    }
  }

  const prevLine = lyricLines[activeIdx - 1]?.text || null;
  const currLine = lyricLines[activeIdx]?.text || null;
  const nextLine = lyricLines[activeIdx + 1]?.text || null;

  return (
    <div className="fixed inset-0 z-[1100] bg-[#F8F8F8] text-[#0F0F0F] flex flex-col justify-between overflow-hidden select-none">
      {/* Background Ambient Glow */}
      <div 
        className="absolute inset-0 opacity-25 pointer-events-none bg-cover bg-center blur-[120px] scale-125"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#F8F8F8]/70 via-[#F8F8F8]/90 to-[#F8F8F8] pointer-events-none" />

      {/* Top Header Bar */}
      <div className="relative z-10 shrink-0 flex items-center justify-between p-4 sm:p-6 max-w-md mx-auto w-full">
        <button 
          onClick={() => setFullScreen(false)}
          className="w-11 h-11 rounded-full bg-[#FFFFFF] hover:bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center transition-all text-[#0F0F0F] active:scale-95 shadow-sm"
          title="Back"
        >
          <ArrowLeft size={19} />
        </button>

        <h3 className="text-[15px] font-bold tracking-tight text-[#0F0F0F]">
          Now Playing
        </h3>

        <button 
          onClick={() => toggleLike(currentSong)}
          className="w-11 h-11 rounded-full bg-[#FFFFFF] hover:bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center transition-all active:scale-95 shadow-sm"
          title="Save to Liked"
        >
          <Heart size={19} fill={isLiked ? "#5DD62C" : "none"} className={isLiked ? "text-[#5DD62C]" : "text-[#0F0F0F]"} />
        </button>
      </div>

      {/* Center Body: Artwork OR Lyrics */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center px-4 py-1 max-w-md mx-auto w-full overflow-hidden">
        {showLyrics ? (
          <div className="w-full h-full flex flex-col min-h-0 bg-transparent px-1 relative overflow-hidden">
            <div className="flex justify-between items-center mb-2 px-2 shrink-0 bg-[#F8F8F8]/80 backdrop-blur-md py-1.5 z-20 rounded-xl">
              <span className="text-xs font-bold text-[#337418] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#5DD62C] animate-pulse" />
                Synchronized Lyrics
              </span>
              <button 
                onClick={() => setShowLyrics(false)}
                className="text-xs text-[#6B7280] hover:text-[#0F0F0F] bg-[#FFFFFF]/90 hover:bg-[#FFFFFF] px-3 py-1 rounded-full border border-[#E5E7EB] font-bold transition-all shadow-sm"
              >
                Close
              </button>
            </div>
            <div className="flex-1 min-h-0 relative">
              <LyricsPanel />
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col items-center w-full my-auto">
            {/* Circular Center Artwork with Glow */}
            <div className="w-56 h-56 sm:w-68 sm:h-68 rounded-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.12)] border-4 border-[#FFFFFF] relative group shrink-0">
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            </div>

            {/* Song Meta */}
            <div className="text-center mt-5 w-full px-2">
              <h2 className="text-2xl sm:text-3xl font-black text-[#0F0F0F] tracking-tight truncate">
                {decodeHtml(currentSong.name || currentSong.title)}
              </h2>
              <p className="text-[14px] text-[#6B7280] font-medium truncate mt-1">
                {decodeHtml(currentSong.artists?.primary?.[0]?.name || currentSong.artists?.all?.[0]?.name || currentSong.subtitle)}
              </p>
            </div>

            {/* Dynamic Synchronized Lyric Snippet Preview (Transparent Background) */}
            <div 
              onClick={() => setShowLyrics(true)}
              className="mt-4 w-full text-center px-4 py-2 cursor-pointer group rounded-2xl bg-transparent hover:bg-[#FFFFFF]/50 transition-all border border-transparent hover:border-[#E5E7EB]"
              title="Click to open synchronized lyrics"
            >
              {currLine ? (
                <div className="flex flex-col items-center gap-0.5">
                  {prevLine && (
                    <p className="text-xs text-[#6B7280] line-clamp-1 opacity-60">
                      {prevLine}
                    </p>
                  )}
                  <div className="text-base font-black my-0.5 tracking-tight line-clamp-1 transition-colors">
                    {isSynced ? (
                      <WordByWordSnippet 
                        text={currLine} 
                        startTime={lyricLines[activeIdx]?.time || 0}
                        endTime={lyricLines[activeIdx + 1]?.time || ((lyricLines[activeIdx]?.time || 0) + 3.8)}
                        currentTime={currentTime}
                      />
                    ) : (
                      <span className="text-[#337418]">{currLine}</span>
                    )}
                  </div>
                  {nextLine && (
                    <p className="text-xs text-[#6B7280] line-clamp-1 opacity-60">
                      {nextLine}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 py-1 text-[#6B7280] group-hover:text-[#337418] transition-colors">
                  <Mic2 size={16} className="text-[#337418]" />
                  <span className="text-xs font-bold text-[#0F0F0F] group-hover:text-[#337418]">
                    Open Synchronized Lyrics
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="relative z-10 shrink-0 px-6 pb-6 max-w-md mx-auto w-full flex flex-col gap-3.5">
        {/* Progress Timeline */}
        <div className="flex flex-col gap-1.5">
          <div 
            className="w-full h-2 bg-[#E5E7EB] rounded-full relative cursor-pointer group"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-[#5DD62C] rounded-full relative transition-all" 
              style={{ width: `${progressPercent}%` }} 
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#337418] rounded-full shadow-md" />
            </div>
          </div>
          <div className="flex justify-between text-xs font-semibold text-[#6B7280]">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
          </div>
        </div>

        {/* Buttons Row: Shuffle, Prev Pill, Lime Play Pill, Next Pill, Lyrics Pill */}
        <div className="flex items-center justify-between pt-0.5">
          <button 
            onClick={toggleShuffle}
            className={clsx("p-2 transition-colors", isShuffled ? "text-[#337418]" : "text-[#6B7280] hover:text-[#0F0F0F]")}
            title="Shuffle"
          >
            <Shuffle size={20} />
          </button>

          <button 
            onClick={prevSong} 
            className="w-13 h-13 rounded-full bg-[#FFFFFF] hover:bg-[#F3F4F6] border border-[#E5E7EB] text-[#0F0F0F] flex items-center justify-center transition-transform active:scale-95 shadow-sm"
            title="Previous"
          >
            <SkipBack size={21} fill="currentColor" />
          </button>

          <button 
            onClick={() => setPlaying(!isPlaying)}
            className="w-16 h-16 sm:w-17 sm:h-17 rounded-full bg-[#C8F142] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_4px_20px_rgba(200,241,66,0.45)] font-bold"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
          </button>

          <button 
            onClick={nextSong} 
            className="w-13 h-13 rounded-full bg-[#FFFFFF] hover:bg-[#F3F4F6] border border-[#E5E7EB] text-[#0F0F0F] flex items-center justify-center transition-transform active:scale-95 shadow-sm"
            title="Next"
          >
            <SkipForward size={21} fill="currentColor" />
          </button>

          <button 
            onClick={() => setShowLyrics(!showLyrics)}
            className={clsx("p-2 transition-colors", showLyrics ? "text-[#337418]" : "text-[#6B7280] hover:text-[#0F0F0F]")}
            title="Lyrics & Queue"
          >
            <Mic2 size={20} />
          </button>
        </div>

        {/* Volume & Download Footer */}
        <div className="flex items-center justify-between gap-4 px-2 pt-0.5">
          <div className="flex items-center gap-2.5 flex-1">
            <button onClick={toggleMute} className="text-[#6B7280] hover:text-[#0F0F0F]">
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <div className="flex-1 h-1.5 bg-[#E5E7EB] rounded-full relative overflow-hidden">
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
                className="h-full bg-[#5DD62C] rounded-full" 
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }} 
              />
            </div>
          </div>

          <button 
            onClick={() => toggleDownload(currentSong)}
            disabled={isDownloading[currentSong.id]}
            className={clsx("p-2 text-[#6B7280] hover:text-[#337418] transition-colors", isDownloaded && "text-[#5DD62C]")}
            title={isDownloaded ? "Downloaded" : "Download Offline"}
          >
            {isDownloading[currentSong.id] ? (
              <Loader2 size={18} className="animate-spin text-[#5DD62C]" />
            ) : (
              <Download size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FullScreenPlayer;
