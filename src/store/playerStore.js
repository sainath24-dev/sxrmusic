import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const usePlayerStore = create(
  persist(
    (set, get) => ({
      // Current track
      currentSong: null,
      queue: [],
      queueIndex: 0,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 0.8,
      isMuted: false,
      isShuffled: false,
      repeatMode: 'none', 
      isFullScreen: false,

      // Personalization
      history: [], 
      likedSongs: [], 
      followedArtists: [], 

      // Playlists
      playlists: [], 

      // Actions
      setSong: (song) => {
        set({ currentSong: song, isPlaying: true });
        get().addToHistory(song);
      },
      clearSong: () => set({ currentSong: null, isPlaying: false }),
      setQueue: (songs, index = 0) => set({ queue: songs, queueIndex: index }),
      setPlaying: (val) => set({ isPlaying: val }),
      setFullScreen: (val) => set({ isFullScreen: val }),
      toggleFullScreen: () => set((state) => ({ isFullScreen: !state.isFullScreen })),
      setTime: (t) => set({ currentTime: t }),
      setDuration: (d) => set({ duration: d }),
      setVolume: (v) => set({ volume: v }),
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),
      cycleRepeat: () =>
        set((state) => ({
          repeatMode:
            state.repeatMode === 'none'
              ? 'all'
              : state.repeatMode === 'all'
              ? 'one'
              : 'none',
        })),
      
      addToHistory: (song) => {
        if (!song) return;
        set((state) => ({
          history: [{ ...song, playedAt: Date.now() }, ...state.history.filter(s => s.id !== song.id).slice(0, 99)],
        }));
      },

      toggleLike: (song) => {
        const { likedSongs } = get();
        const isLiked = likedSongs.some(s => s.id === song.id);
        if (isLiked) {
          set({ likedSongs: likedSongs.filter(s => s.id !== song.id) });
        } else {
          set({ likedSongs: [song, ...likedSongs] });
        }
      },

      toggleFollowArtist: (artist) => {
        const { followedArtists } = get();
        const isFollowed = followedArtists.some(a => a.id === artist.id);
        if (isFollowed) {
          set({ followedArtists: followedArtists.filter(a => a.id !== artist.id) });
        } else {
          set({ followedArtists: [artist, ...followedArtists] });
        }
      },
      
      nextSong: () => {
        const { queue, queueIndex, isShuffled, repeatMode } = get();
        if (queue.length === 0) return;

        let nextIndex = queueIndex + 1;
        if (isShuffled) {
          nextIndex = Math.floor(Math.random() * queue.length);
        } else if (nextIndex >= queue.length) {
          if (repeatMode === 'all') {
            nextIndex = 0;
          } else {
            set({ isPlaying: false });
            return;
          }
        }
        set({ currentSong: queue[nextIndex], queueIndex: nextIndex, isPlaying: true });
      },

      prevSong: () => {
        const { queue, queueIndex } = get();
        if (queue.length === 0) return;

        let prevIndex = queueIndex - 1;
        if (prevIndex < 0) {
          prevIndex = queue.length - 1;
        }
        set({ currentSong: queue[prevIndex], queueIndex: prevIndex, isPlaying: true });
      },

      // Playlist Actions
      createPlaylist: (name, sourceUrl = null) => {
        const id = Date.now().toString();
        set((state) => ({
          playlists: [...state.playlists, { id, name, sourceUrl, songs: [] }]
        }));
        return id;
      },
      deletePlaylist: (id) => set((state) => ({
        playlists: state.playlists.filter(p => p.id !== id)
      })),
      addSongToPlaylist: (playlistId, song) => set((state) => ({
        playlists: state.playlists.map(p => 
          p.id === playlistId 
            ? { ...p, songs: [...p.songs.filter(s => s.id !== song.id), song] } 
            : p
        )
      })),
      removeSongFromPlaylist: (playlistId, songId) => set((state) => ({
        playlists: state.playlists.map(p => 
          p.id === playlistId 
            ? { ...p, songs: p.songs.filter(s => s.id !== songId) } 
            : p
        )
      })),
    }),
    {
      name: 'sxr-music-player-v2',
      partialize: (state) => ({ 
        volume: state.volume, 
        history: state.history,
        likedSongs: state.likedSongs,
        followedArtists: state.followedArtists,
        playlists: state.playlists
      }),
    }
  )
);

export default usePlayerStore;
