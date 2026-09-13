import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import TopBar from './components/layout/TopBar';
import Sidebar from './components/layout/Sidebar';
import PlayerBar from './components/layout/PlayerBar';
import RightPanel from './components/layout/RightPanel';
import Home from './pages/Home';
import Search from './pages/Search';
import Library from './pages/Library';
import Stats from './pages/Stats';
import Languages from './pages/Languages';
import AllArtists from './pages/AllArtists';
import AlbumDetail from './pages/AlbumDetail';
import ArtistDetail from './pages/ArtistDetail';
import Queue from './pages/Queue';
import LikedSongs from './pages/LikedSongs';
import MobileBottomNav from './components/layout/MobileBottomNav';
import ContextMenu from './components/ui/ContextMenu';
import { useColorTheme } from './hooks/useColorTheme';
import { useVibeQueue } from './hooks/useVibeQueue';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import FullScreenPlayer from './components/ui/FullScreenPlayer';
import { clsx } from 'clsx';
import usePlayerStore from './store/playerStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes cache
    },
  },
});

const App = () => {
  const { currentSong } = usePlayerStore();
  const [showRightPanel, setShowRightPanel] = useState(false);
  
  useColorTheme(currentSong?.image?.[1]?.url || currentSong?.image?.[0]?.url);
  useVibeQueue();
  useKeyboardShortcuts();

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="flex flex-col h-[100dvh] w-screen bg-[#F8F8F8] text-[#0F0F0F] overflow-hidden relative select-none">
          {/* Top Navigation Bar */}
          <TopBar onToggleRightPanel={() => setShowRightPanel(!showRightPanel)} />

          {/* Main App Container */}
          <div className="flex-1 flex overflow-hidden p-2 pt-0 gap-2">
            {/* Left Sidebar (Desktop) */}
            <Sidebar />

            {/* Central Scrollable Content Area */}
            <main className="flex-1 min-w-0 overflow-y-auto custom-scrollbar relative bg-[#FFFFFF] rounded-2xl border border-[#EAEAEA] shadow-sm">
              <div className="max-w-[1500px] mx-auto min-h-full pb-36 lg:pb-24">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/album/:id" element={<AlbumDetail />} />
                  <Route path="/artist/:id" element={<ArtistDetail />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/stats" element={<Stats />} />
                  <Route path="/discover" element={<Languages />} />
                  <Route path="/languages" element={<Languages />} />
                  <Route path="/artists" element={<AllArtists />} />
                  <Route path="/liked" element={<LikedSongs />} />
                  <Route path="/queue" element={<Queue />} />
                </Routes>
              </div>
            </main>

            {/* Right Panel Drawer (Lyrics & Info) */}
            <div 
              className={clsx(
                "hidden xl:block transition-all duration-200 ease-in-out h-full overflow-hidden rounded-2xl bg-[#FFFFFF] border border-[#EAEAEA] shadow-sm",
                showRightPanel ? "w-[360px] opacity-100" : "w-0 opacity-0 pointer-events-none border-none"
              )}
            >
              <RightPanel onClose={() => setShowRightPanel(false)} />
            </div>
          </div>

          {/* Mobile Bottom Navigation Bar */}
          <MobileBottomNav />

          {/* Bottom Player Bar (Desktop + Mobile Floating Player) */}
          <PlayerBar onToggleLyrics={() => setShowRightPanel(!showRightPanel)} isLyricsOpen={showRightPanel} />
          
          {/* Global Context Menu */}
          <ContextMenu />
          
          {/* Full Screen Player */}
          <FullScreenPlayer />
        </div>

        <Toaster 
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#0F0F0F',
              color: '#F8F8F8',
              border: '1px solid #282828',
              borderRadius: '9999px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              fontSize: '13px',
              fontWeight: '600',
              padding: '8px 20px',
            },
          }}
        />
      </Router>
    </QueryClientProvider>
  );
};

export default App;
