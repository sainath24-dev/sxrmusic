import React, { useMemo, useRef, useEffect } from 'react';
import usePlayerStore from '../../store/playerStore';
import { usePlayer } from '../../hooks/usePlayer';
import { useQuery } from '@tanstack/react-query';
import { getLyrics } from '../../api/saavn';
import { clsx } from 'clsx';
import { Music2 } from 'lucide-react';

const SynchronizedLine = ({ line, nextLineTime, currentTime, isActive, isPast, onClick }) => {
  // Split words and calculate natural character-length duration weights
  const { words, wordRanges } = useMemo(() => {
    const rawWords = (line.text || '').trim().split(/\s+/).filter(Boolean);
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
  }, [line.text]);

  if (!isActive) {
    return (
      <div
        onClick={onClick}
        className={clsx(
          "transition-all duration-300 ease-out text-left rounded-xl p-1.5 cursor-pointer select-none",
          isPast
            ? "text-[#6B7280] opacity-40 font-semibold text-base sm:text-lg hover:opacity-90"
            : "text-[#9CA3AF] opacity-60 font-semibold text-base sm:text-lg hover:opacity-100 hover:text-[#0F0F0F]"
        )}
      >
        <p className="leading-relaxed tracking-tight">{line.text}</p>
      </div>
    );
  }

  // Active line calculation
  const startTime = line.time || 0;
  const rawDuration = nextLineTime ? (nextLineTime - startTime) : 3.8;
  const lineDuration = Math.max(0.8, Math.min(rawDuration, 12.0));
  const elapsed = Math.max(0, currentTime - startTime);
  const lineProgress = Math.min(1, Math.max(0, elapsed / lineDuration));

  return (
    <div
      onClick={onClick}
      className="transition-all duration-200 text-left rounded-xl p-1.5 cursor-pointer text-xl sm:text-2xl font-black select-none"
    >
      <p className="leading-relaxed tracking-tight flex flex-wrap items-center">
        {wordRanges.map(({ word, start, end }, wIdx) => {
          const isWordDone = lineProgress >= end;
          const isWordActive = lineProgress >= start && lineProgress < end;
          
          if (isWordActive) {
            return (
              <span 
                key={wIdx} 
                className="inline-block mx-0.5 px-1.5 py-0.5 rounded-lg bg-[#C8F142]/40 text-[#166534] font-black transform scale-105 shadow-[0_2px_12px_rgba(93,214,44,0.35)] ring-1 ring-[#5DD62C]/40 transition-all duration-150 ease-out"
              >
                {word}
              </span>
            );
          }

          if (isWordDone) {
            return (
              <span 
                key={wIdx} 
                className="inline-block mr-[0.3em] text-[#166534] font-black transition-colors duration-150"
              >
                {word}
              </span>
            );
          }

          return (
            <span 
              key={wIdx} 
              className="inline-block mr-[0.3em] text-[#9CA3AF] opacity-50 font-bold transition-colors duration-150"
            >
              {word}
            </span>
          );
        })}
      </p>
    </div>
  );
};

const LyricsPanel = () => {
  const { currentSong, currentTime } = usePlayerStore();
  const { seek } = usePlayer();
  const containerRef = useRef(null);
  const lineElementsRef = useRef([]);

  const { data: lyricsData, isLoading, isError } = useQuery({
    queryKey: ['lyrics', currentSong?.id, currentSong?.name || currentSong?.title],
    queryFn: () => getLyrics(currentSong),
    enabled: !!currentSong,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  const lyricsPayload = lyricsData?.data;
  const lines = lyricsPayload?.lines || [];
  const isSynced = lyricsPayload?.synced || false;

  // Find active line index based on playback currentTime
  const activeIndex = useMemo(() => {
    if (!isSynced || lines.length === 0) return -1;
    let idx = 0;
    for (let i = 0; i < lines.length; i++) {
      if (currentTime >= lines[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [isSynced, lines, currentTime]);

  // Ultra-smooth container scrolling centering the active line
  useEffect(() => {
    if (!isSynced || activeIndex < 0) return;
    const activeEl = lineElementsRef.current[activeIndex];
    if (activeEl && containerRef.current) {
      const container = containerRef.current;
      const targetScroll = activeEl.offsetTop - container.offsetTop - container.clientHeight / 2 + activeEl.clientHeight / 2;
      container.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth'
      });
    }
  }, [activeIndex, isSynced]);

  const handleLineClick = (line) => {
    if (isSynced && line.time !== undefined) {
      seek(line.time);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 py-8 px-2">
        {Array(8).fill(0).map((_, i) => (
          <div key={i} className="h-7 w-3/4 bg-[#E5E7EB]/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError || !lyricsPayload || lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4 gap-3 select-none">
        <div className="w-12 h-12 rounded-2xl bg-[#FFFFFF]/80 border border-[#E5E7EB] flex items-center justify-center text-[#9CA3AF] shadow-sm">
          <Music2 size={24} />
        </div>
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFFFFF]/80 text-[#6B7280] border border-[#E5E7EB]">
          NO LYRICS AVAILABLE
        </span>
        <p className="text-[#0F0F0F] font-bold text-sm">
          Lyrics aren't available for this track yet.
        </p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full flex flex-col gap-4 py-2 px-1 select-none overflow-y-auto custom-scrollbar scroll-smooth"
    >
      {lines.map((line, i) => {
        const isActive = isSynced && i === activeIndex;
        const isPast = isSynced && i < activeIndex;
        const nextLineTime = lines[i + 1]?.time;

        if (isSynced) {
          return (
            <div key={`${line.time}-${i}`} ref={(el) => (lineElementsRef.current[i] = el)}>
              <SynchronizedLine 
                line={line}
                nextLineTime={nextLineTime}
                currentTime={currentTime}
                isActive={isActive}
                isPast={isPast}
                onClick={() => handleLineClick(line)}
              />
            </div>
          );
        }

        return (
          <div
            key={i}
            className="text-left rounded-xl p-1 text-[#0F0F0F] font-semibold text-base sm:text-lg leading-relaxed"
          >
            <p className="tracking-tight">{line.text}</p>
          </div>
        );
      })}
      <div className="h-16 shrink-0" />
    </div>
  );
};

export default LyricsPanel;
