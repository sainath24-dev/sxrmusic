import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'react-hot-toast';

const CACHE_NAME = 'sxr-music-downloads';

const useDownloadStore = create(
  persist(
    (set, get) => ({
      downloadedIds: [],
      downloadedSongs: [], // Full metadata
      isDownloading: {}, // { songId: true/false }

      toggleDownload: async (song) => {
        if (!song) return;
        
        const { downloadedIds, downloadedSongs, isDownloading } = get();
        const isDownloaded = downloadedIds.includes(song.id);
        
        try {
          const cache = await caches.open(CACHE_NAME);

          if (isDownloaded) {
            // Remove from cache
            if (Array.isArray(song.downloadUrl)) {
              for (const item of song.downloadUrl) {
                if (item?.url) {
                  await cache.delete(item.url);
                  await cache.delete(item.url.replace('http://', 'https://'));
                }
              }
            }
            
            // Also delete cached images
            if (Array.isArray(song.image)) {
              for (const img of song.image) {
                if (img?.url) {
                  await cache.delete(img.url);
                }
              }
            }

            set({ 
              downloadedIds: downloadedIds.filter(id => id !== song.id),
              downloadedSongs: downloadedSongs.filter(s => s.id !== song.id)
            });
            toast.success('Removed from offline downloads');
          } else {
            // Add to cache
            set({ isDownloading: { ...isDownloading, [song.id]: true } });
            
            const rawAudioUrl = song.downloadUrl?.[4]?.url || song.downloadUrl?.[3]?.url || song.downloadUrl?.[0]?.url || song.downloadUrl;
            if (!rawAudioUrl) throw new Error('No audio stream URL available');
            
            const audioUrl = typeof rawAudioUrl === 'string' ? rawAudioUrl.replace('http://', 'https://') : null;
            if (!audioUrl) throw new Error('Invalid audio stream URL');

            // Download audio stream and cache it
            const audioRes = await fetch(audioUrl);
            if (!audioRes.ok) throw new Error(`Audio download failed (status ${audioRes.status})`);
            await cache.put(audioUrl, audioRes.clone());

            // Cache images for offline display
            if (Array.isArray(song.image)) {
              await Promise.all(
                song.image.map(async (img) => {
                  if (img?.url) {
                    try {
                      const imgRes = await fetch(img.url);
                      if (imgRes.ok) await cache.put(img.url, imgRes);
                    } catch (e) {
                      console.warn('Failed to cache image for offline:', img.url);
                    }
                  }
                })
              );
            }
            
            set((state) => ({ 
              downloadedIds: [...state.downloadedIds.filter(id => id !== song.id), song.id],
              downloadedSongs: [song, ...state.downloadedSongs.filter(s => s.id !== song.id)],
              isDownloading: { ...state.isDownloading, [song.id]: false }
            }));
            toast.success(`Downloaded "${song.name || song.title}" for offline playback!`, { icon: '💾' });
          }
        } catch (error) {
          console.error('Download error:', error);
          toast.error(error.message || 'Failed to download song for offline use');
          set({ isDownloading: { ...isDownloading, [song.id]: false } });
        }
      },

      isSongDownloaded: (songId) => get().downloadedIds.includes(songId),
      
      getCachedUrl: async (song) => {
        if (!song) return null;
        try {
          if (!('caches' in window)) return null;
          const cache = await caches.open(CACHE_NAME);
          
          // Check all download URLs in metadata
          if (Array.isArray(song.downloadUrl)) {
            for (const item of song.downloadUrl) {
              if (item?.url) {
                const cleanUrl = item.url.replace('http://', 'https://');
                let response = await cache.match(cleanUrl);
                if (!response) response = await cache.match(item.url);
                if (response) {
                  const blob = await response.blob();
                  return URL.createObjectURL(blob);
                }
              }
            }
          }
          
          // Check by song id match in cache keys
          const keys = await cache.keys();
          for (const req of keys) {
            if (song.id && req.url.includes(song.id)) {
              const res = await cache.match(req);
              if (res) {
                const blob = await res.blob();
                return URL.createObjectURL(blob);
              }
            }
          }
        } catch (e) {
          console.warn("Error resolving cached audio blob:", e);
        }
        return null;
      }
    }),
    {
      name: 'sxr-music-downloads',
      partialize: (state) => ({ 
        downloadedIds: state.downloadedIds,
        downloadedSongs: state.downloadedSongs 
      }),
    }
  )
);

export default useDownloadStore;
