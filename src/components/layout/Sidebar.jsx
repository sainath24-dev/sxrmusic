import React, { useState } from 'react';
import { Home, Search, Library, Plus, Heart, Compass, BarChart2, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import usePlayerStore from '../../store/playerStore';
import SpotifyImportModal from '../ui/SpotifyImportModal';

const Sidebar = () => {
  const location = useLocation();
  const [showImport, setShowImport] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'playlists' | 'artists'
  const { playlists, createPlaylist, likedSongs, followedArtists } = usePlayerStore();

  const handleCreatePlaylist = () => {
    const defaultName = `Playlist #${playlists.length + 1}`;
    const name = window.prompt("Enter playlist name:", defaultName);
    if (name && name.trim()) {
      createPlaylist(name.trim());
    }
  };

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Search', path: '/search', icon: Search },
    { name: 'Discover', path: '/discover', icon: Compass },
    { name: 'Artists', path: '/artists', icon: Users },
    { name: 'Stats', path: '/stats', icon: BarChart2 },
  ];

  return (
    <aside className="w-[260px] xl:w-[290px] h-full hidden lg:flex flex-col gap-2 select-none shrink-0">
      {/* Top Nav Block */}
      <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-2xl p-2.5 flex flex-col gap-1 shadow-sm">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path}
              to={item.path} 
              className={clsx(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150",
                isActive 
                  ? "bg-[#0F0F0F] text-white shadow-sm font-semibold" 
                  : "text-[#4B5563] hover:text-[#0F0F0F] hover:bg-[#F4F4F5]"
              )}
            >
              <item.icon size={18} className={isActive ? "text-[#C8F142]" : ""} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Library Block */}
      <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-2xl flex-1 flex flex-col overflow-hidden shadow-sm">
        {/* Library Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#EAEAEA]">
          <Link 
            to="/library" 
            className="flex items-center gap-2.5 font-bold text-sm text-[#0F0F0F] hover:text-[#337418] transition-colors"
          >
            <Library size={18} />
            <span>Your Library</span>
          </Link>
          <div className="flex items-center gap-1">
            <button 
              onClick={handleCreatePlaylist}
              className="p-1.5 hover:bg-[#F4F4F5] text-[#6B7280] hover:text-[#0F0F0F] rounded-lg transition-colors"
              title="Create Playlist"
            >
              <Plus size={16} />
            </button>
            <button 
              onClick={() => setShowImport('spotify')}
              className="px-2 py-1 hover:bg-[#F4F4F5] text-[#337418] hover:text-[#0F0F0F] rounded-md transition-colors text-[11px] font-bold tracking-wider"
              title="Import Playlist"
            >
              IMPORT
            </button>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#EAEAEA] overflow-x-auto no-scrollbar">
          {['all', 'playlists', 'artists'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={clsx(
                "px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all duration-150",
                filterType === type 
                  ? "bg-[#C8F142] text-black shadow-sm" 
                  : "bg-[#F3F4F6] text-[#4B5563] hover:text-[#0F0F0F] hover:bg-[#E5E7EB]"
              )}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Scrollable Library List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2">
          {/* Liked Songs Entry */}
          {(filterType === 'all' || filterType === 'playlists') && (
            <Link 
              to="/liked" 
              className={clsx(
                "flex items-center gap-3 p-2 rounded-xl hover:bg-[#F4F4F5] transition-colors group cursor-pointer mb-1",
                location.pathname === '/liked' ? "bg-[#F0FDF4] border border-[#5DD62C]/30" : ""
              )}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#E2F7C2] to-[#BEEFA2] rounded-xl border border-[#5DD62C]/40 flex items-center justify-center shrink-0 shadow-sm">
                <Heart size={16} className="text-[#337418] fill-[#337418]" />
              </div>
              <div className="flex flex-col min-w-0 overflow-hidden">
                <span className={clsx("font-semibold text-sm truncate", location.pathname === '/liked' ? "text-[#337418]" : "text-[#0F0F0F]")}>
                  Liked Songs
                </span>
                <span className="text-xs text-[#6B7280] truncate">
                  {likedSongs.length} tracks
                </span>
              </div>
            </Link>
          )}

          {/* User Playlists */}
          {(filterType === 'all' || filterType === 'playlists') && playlists.map(playlist => (
            <Link 
              key={playlist.id}
              to="/library"
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F4F4F5] transition-colors group cursor-pointer mb-0.5"
            >
              <div className="w-10 h-10 bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl flex items-center justify-center shrink-0 text-[#0F0F0F] font-bold text-sm">
                {playlist.songs?.[0]?.image?.[0]?.url ? (
                  <img src={playlist.songs[0].image[0].url} className="w-full h-full object-cover rounded-xl" alt="" />
                ) : (
                  playlist.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex flex-col min-w-0 overflow-hidden">
                <span className="font-semibold text-sm text-[#0F0F0F] group-hover:text-[#337418] truncate transition-colors">
                  {playlist.name}
                </span>
                <span className="text-xs text-[#6B7280] truncate">
                  {playlist.songs?.length || 0} tracks
                </span>
              </div>
            </Link>
          ))}

          {/* Followed Artists */}
          {(filterType === 'all' || filterType === 'artists') && followedArtists.map(artist => (
            <Link 
              key={artist.id}
              to={`/artist/${artist.id}`}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F4F4F5] transition-colors group cursor-pointer mb-0.5"
            >
              {(artist.image?.[0]?.url || artist.image?.[0]) ? (
                <img 
                  src={artist.image?.[0]?.url || artist.image?.[0]} 
                  className="w-10 h-10 rounded-full object-cover shrink-0 border border-[#E5E7EB]" 
                  alt="" 
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center shrink-0 text-[#6B7280]">
                  {artist.name?.charAt(0) || 'A'}
                </div>
              )}
              <div className="flex flex-col min-w-0 overflow-hidden">
                <span className="font-semibold text-sm text-[#0F0F0F] group-hover:text-[#337418] truncate transition-colors">
                  {artist.name}
                </span>
                <span className="text-xs text-[#6B7280] truncate">
                  Artist
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {showImport && <SpotifyImportModal type={showImport} onClose={() => setShowImport(null)} />}
    </aside>
  );
};

export default Sidebar;

