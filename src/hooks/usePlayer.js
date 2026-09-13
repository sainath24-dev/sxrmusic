import { useEffect, useRef } from 'react';
import usePlayerStore from '../store/playerStore';
import useDownloadStore from '../store/downloadStore';
import { getStreamUrl } from '../api/saavn';

// Module-level singleton audio element
const audio = new Audio();
audio.preload = 'auto';

export const usePlayer = () => {
  const {
    currentSong,
    isPlaying,
    volume,
    isMuted,
    repeatMode,
    setPlaying,
    setTime,
    setDuration,
    nextSong,
    addToHistory,
  } = usePlayerStore();

  const lastObjectUrl = useRef(null);
  const activePlayPromise = useRef(null);

  // Handle Song Change
  useEffect(() => {
    if (!currentSong) {
      if (!audio.paused) audio.pause();
      audio.removeAttribute('src');
      audio.load();
      return;
    }

    let isMounted = true;

    const setupAudio = async () => {
      // Clean up previous blob URL to prevent memory leaks
      if (lastObjectUrl.current) {
        URL.revokeObjectURL(lastObjectUrl.current);
        lastObjectUrl.current = null;
      }

      // Check for offline version first
      const { getCachedUrl } = useDownloadStore.getState();
      const cachedUrl = await getCachedUrl(currentSong);
      
      if (!isMounted) return;

      if (cachedUrl) {
        lastObjectUrl.current = cachedUrl;
      }
      
      const streamUrl = cachedUrl || getStreamUrl(currentSong);
      if (!streamUrl) {
        console.warn("No stream URL found for song:", currentSong.name || currentSong.title);
        nextSong();
        return;
      }

      audio.src = streamUrl;
      audio.volume = isMuted ? 0 : Math.max(0, Math.min(1, volume));

      try {
        const playPromise = audio.play();
        activePlayPromise.current = playPromise;
        if (playPromise !== undefined) {
          await playPromise;
          if (isMounted) {
            setPlaying(true);
            addToHistory(currentSong);
          }
        }
      } catch (err) {
        // Ignore AbortError when switching rapidly
        if (err.name !== 'AbortError' && err.name !== 'NotSupportedError') {
          console.warn("Autoplay deferred:", err);
        }
      }
    };

    setupAudio();

    return () => {
      isMounted = false;
      if (lastObjectUrl.current) {
        URL.revokeObjectURL(lastObjectUrl.current);
      }
    };
  }, [currentSong?.id]);

  // Handle Play/Pause
  useEffect(() => {
    if (isPlaying) {
      if (audio.paused && audio.src && audio.src !== window.location.href) {
        audio.play().catch(err => {
          if (err.name !== 'AbortError' && err.name !== 'NotSupportedError') {
            console.warn("Audio play prevented:", err);
          }
        });
      }
    } else {
      if (!audio.paused) {
        audio.pause();
      }
    }
  }, [isPlaying]);

  // Handle Volume/Mute
  useEffect(() => {
    audio.volume = isMuted ? 0 : Math.max(0, Math.min(1, volume));
  }, [volume, isMuted]);

  // Audio Event Listeners
  useEffect(() => {
    const onTimeUpdate = () => setTime(audio.currentTime || 0);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      const currentRepeat = usePlayerStore.getState().repeatMode;
      if (currentRepeat === 'one') {
        audio.currentTime = 0;
        audio.play().catch(err => {
          if (err.name !== 'AbortError') console.warn("Repeat play failed:", err);
        });
      } else {
        nextSong();
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [nextSong, setTime, setDuration]);

  // Ultra-smooth ~60fps playback time synchronization for lyrics and timeline
  useEffect(() => {
    let animId;
    let lastTime = 0;

    const tick = () => {
      if (!audio.paused && audio.currentTime !== undefined) {
        const curr = audio.currentTime;
        if (Math.abs(curr - lastTime) >= 0.015) {
          lastTime = curr;
          setTime(curr);
        }
      }
      if (isPlaying) {
        animId = requestAnimationFrame(tick);
      }
    };

    if (isPlaying) {
      animId = requestAnimationFrame(tick);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying, setTime]);

  const seek = (time) => {
    if (isNaN(time)) return;
    audio.currentTime = time;
    setTime(time);
  };

  return { seek };
};

