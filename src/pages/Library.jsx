import React, { useState } from 'react';
import { Plus, Search, Library as LibraryIcon, Music, Play, Trash2, ChevronLeft, Heart, Download, Share2 } from 'lucide-react';
import usePlayerStore from '../store/playerStore';
import useDownloadStore from '../store/downloadStore';
import { decodeHtml } from '../api/saavn';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import SpotifyImportModal from '../components/ui/SpotifyImportModal';

const Library = () => {
  const navigate = useNavigate();
  const { playlists, createPlaylist, deletePlaylist, removeSongFromPlaylist, setSong, setQueue, likedSongs, currentSong } = usePlayerStore();
  const { downloadedSongs } = useDownloadStore();
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showImport, setShowImport] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'playlists' | 'liked' | 'downloads'

  const activePlaylist = activePlaylistId === 'liked' 
    ? { name: 'Liked Songs', songs: likedSongs || [], id: 'liked' }
    : activePlaylistId === 'downloads'
    ? { name: 'Offline Downloads', songs: downloadedSongs || [], id: 'downloads' }
    : playlists.find(p => p.id === activePlaylistId);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const id = createPlaylist(newPlaylistName.trim());
    setActivePlaylistId(id);
    setNewPlaylistName('');
    setIsCreating(false);
  };

  const handlePlaySong = (song, list, index) => {
    setQueue(list, index);
    setSong(song);
  };

  const handlePlayAll = () => {
    if (activePlaylist?.songs?.length > 0) {
      setQueue(activePlaylist.songs, 0);
      setSong(activePlaylist.songs[0]);
    }
  };

  const handleSharePlaylist = async () => {
    if (!activePlaylist?.songs?.length) {
      toast.error('No songs in playlist to share');
      return;
    }

    const trackText = activePlaylist.songs
      .map(s => `${decodeHtml(s.name || s.title)} - ${decodeHtml(s.artists?.primary?.[0]?.name || s.subtitle || '')}`)
      .join('\n');

    const shareData = {
      title: activePlaylist.name,
      text: `🎵 ${activePlaylist.name} (${activePlaylist.songs.length} tracks):\n\n${trackText}`,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        toast.success('Shared successfully!');
        return;
      } catch (e) {
        if (e.name !== 'AbortError') console.warn(e);
      }
    }

    try {
      await navigator.clipboard.writeText(trackText);
      toast.success(`Copied ${activePlaylist.songs.length} track titles to clipboard!`);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className="flex flex-col min-h-full p-4 sm:p-6 lg:p-8 select-none">
      {activePlaylistId && activePlaylist ? (
        <div className="flex flex-col gap-6">
          {/* Back Button */}
          <button 
            onClick={() => setActivePlaylistId(null)} 
            className="flex items-center gap-2 text-[#6B7280] hover:text-[#0F0F0F] font-bold text-[12px] uppercase tracking-wider w-max mb-2 transition-colors"
          >
            <ChevronLeft size={18} /> Back to My Music
          </button>

          {/* Playlist Detail Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 pb-6 border-b border-[#EAEAEA]">
            <div className={clsx(
              "w-36 h-36 sm:w-48 sm:h-48 shadow-xl flex items-center justify-center rounded-3xl overflow-hidden shrink-0 border border-[#E5E7EB]",
              activePlaylistId === 'liked' ? "bg-gradient-to-br from-[#E2F7C2] via-[#C8F142] to-[#B2E690] border-[#5DD62C]/40" : 
              activePlaylistId === 'downloads' ? "bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB]" :
              "bg-[#F3F4F6]"
            )}>
              {activePlaylistId === 'liked' ? (
                <Heart size={56} fill="#337418" className="text-[#337418] drop-shadow-sm" />
              ) : activePlaylistId === 'downloads' ? (
                <Download size={56} className="text-[#0F0F0F]" />
              ) : activePlaylist.songs?.[0]?.image?.[2]?.url ? (
                <img src={activePlaylist.songs[0].image[2].url} className="w-full h-full object-cover" alt="" />
              ) : (
                <Music size={44} className="text-[#9CA3AF]" />
              )}
            </div>

            <div className="flex flex-col gap-2 min-w-0">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#C8F142]/20 text-[#337418] border border-[#5DD62C]/30 w-max">PLAYLIST</span>
              <h1 className="text-3xl sm:text-5xl font-black text-[#0F0F0F] tracking-tight truncate">
                {activePlaylist.name}
              </h1>
              <div className="flex items-center gap-2 text-[13px] font-medium text-[#6B7280]">
                <span className="text-[#0F0F0F] font-bold">Your Library</span>
                <span>•</span>
                <span className="text-[#337418] font-bold">{activePlaylist.songs?.length || 0} tracks</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-4 py-2">
            <button 
              onClick={handlePlayAll}
              disabled={!activePlaylist.songs?.length}
              className="w-13 h-13 rounded-full bg-[#C8F142] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#C8F142]/40 disabled:opacity-40 font-bold"
              title="Play Playlist"
            >
              <Play size={22} fill="currentColor" className="ml-0.5" />
            </button>

            <button 
              onClick={handleSharePlaylist}
              className="w-11 h-11 rounded-full bg-[#FFFFFF] hover:bg-[#F3F4F6] border border-[#E5E7EB] text-[#0F0F0F] flex items-center justify-center transition-colors shadow-sm"
              title="Share / Copy Playlist Tracks"
            >
              <Share2 size={18} />
            </button>

            {activePlaylistId !== 'liked' && activePlaylistId !== 'downloads' && (
              <button 
                onClick={() => {
                  if (window.confirm(`Delete "${activePlaylist.name}"?`)) {
                    deletePlaylist(activePlaylistId);
                    setActivePlaylistId(null);
                  }
                }}
                className="w-11 h-11 rounded-full bg-[#FFFFFF] hover:bg-[#F3F4F6] border border-[#E5E7EB] text-[#6B7280] hover:text-red-500 flex items-center justify-center transition-colors shadow-sm"
                title="Delete Playlist"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>

          {/* Tracks List */}
          <div className="flex flex-col space-y-1.5">
            {activePlaylist.songs?.map((song, index) => {
              const isCurrent = currentSong?.id === song.id;

              return (
                <div 
                  key={`${song.id}-${index}`} 
                  onClick={() => handlePlaySong(song, activePlaylist.songs, index)}
                  className={clsx(
                    "flex items-center justify-between p-3 rounded-2xl hover:bg-[#F4F4F5] border border-transparent hover:border-[#E5E7EB] group cursor-pointer transition-all duration-150",
                    isCurrent ? "bg-[#F0FDF4] border-[#5DD62C]/30" : ""
                  )}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-[#F3F4F6] shrink-0 border border-[#E5E7EB]">
                      <img src={song.image?.[1]?.url || song.image?.[0]?.url || song.image} alt="" className="w-full h-full object-cover" />
                    </div>

                    <div className="min-w-0 flex-1 pr-2">
                      <h4 className={clsx("text-sm font-bold truncate", isCurrent ? "text-[#337418]" : "text-[#0F0F0F]")}>
                        {decodeHtml(song.name || song.title)}
                      </h4>
                      <p className="text-xs text-[#6B7280] truncate mt-0.5 font-medium">
                        By {decodeHtml(song.artists?.primary?.[0]?.name || song.subtitle || "Unknown")}
                      </p>
                    </div>
                  </div>

                  {/* Circular Play Button on the Right */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[#F3F4F6] group-hover:bg-[#C8F142] group-hover:text-black text-[#0F0F0F] flex items-center justify-center transition-all border border-[#E5E7EB] group-hover:border-transparent shadow-sm font-bold">
                      <Play size={15} fill="currentColor" className="ml-0.5" />
                    </div>

                    {activePlaylistId !== 'liked' && activePlaylistId !== 'downloads' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSongFromPlaylist(activePlaylistId, song.id);
                        }}
                        className="p-2 text-[#9CA3AF] opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                        title="Remove from playlist"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {(!activePlaylist.songs || activePlaylist.songs.length === 0) && (
              <div className="text-center py-16 text-[#6B7280] text-[13px]">
                No songs in this playlist yet. Add songs using the context menu (+) button.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* My Music / Library Overview (Matching Image 1 Right Phone) */
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#C8F142]/20 text-[#337418] border border-[#5DD62C]/30 mb-1 inline-block">YOUR COLLECTION</span>
              <h1 className="text-2xl sm:text-4xl font-black text-[#0F0F0F] tracking-tight">My Music</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsCreating(true)}
                className="cohere-btn-primary text-[13px] py-2 px-4 flex items-center gap-1.5"
              >
                <Plus size={15} /> New Playlist
              </button>
              <button 
                onClick={() => setShowImport('spotify')}
                className="cohere-btn-outline text-[13px] py-2 px-4"
              >
                Import
              </button>
            </div>
          </div>

          {/* Pill Category Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'playlists', label: 'Playlists' },
              { id: 'liked', label: 'Liked Songs' },
              { id: 'downloads', label: 'Downloads' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={clsx(
                  "cohere-filter-pill",
                  filterTab === tab.id && "active"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Creation Form */}
          {isCreating && (
            <form onSubmit={handleCreate} className="bg-[#FFFFFF] p-4 rounded-3xl border border-[#E5E7EB] shadow-md flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                placeholder="Playlist name..." 
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                autoFocus
                className="cohere-search-input flex-1 px-4 py-2 text-[14px]"
              />
              <div className="flex gap-2">
                <button type="submit" className="cohere-btn-primary py-2 px-5 text-[13px]">
                  Create
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)} 
                  className="cohere-btn-outline py-2 px-4 text-[13px]"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Playlists Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* Liked Songs Tile */}
            {(filterTab === 'all' || filterTab === 'liked') && (
              <div 
                onClick={() => setActivePlaylistId('liked')}
                className="cohere-card group flex flex-col cursor-pointer"
              >
                <div className="w-full aspect-square bg-gradient-to-br from-[#E2F7C2] via-[#C8F142] to-[#B2E690] rounded-2xl flex items-center justify-center mb-3 shadow-md border border-[#5DD62C]/40">
                  <Heart size={40} fill="#337418" className="drop-shadow-sm text-[#337418]" />
                </div>
                <h3 className="font-bold text-sm text-[#0F0F0F] truncate group-hover:text-[#337418] transition-colors">Liked Songs</h3>
                <p className="text-xs text-[#6B7280] font-medium">{likedSongs.length} tracks</p>
              </div>
            )}

            {/* Offline Downloads Tile */}
            {(filterTab === 'all' || filterTab === 'downloads') && (
              <div 
                onClick={() => setActivePlaylistId('downloads')}
                className="cohere-card group flex flex-col cursor-pointer"
              >
                <div className="w-full aspect-square bg-[#F3F4F6] rounded-2xl flex items-center justify-center mb-3 shadow-sm border border-[#E5E7EB]">
                  <Download size={40} className="text-[#0F0F0F]" />
                </div>
                <h3 className="font-bold text-sm text-[#0F0F0F] truncate group-hover:text-[#337418] transition-colors">Downloads</h3>
                <p className="text-xs text-[#6B7280] font-medium">{downloadedSongs.length} tracks</p>
              </div>
            )}

            {/* Custom User Playlists */}
            {(filterTab === 'all' || filterTab === 'playlists') && playlists.map(p => (
              <div 
                key={p.id}
                onClick={() => setActivePlaylistId(p.id)}
                className="cohere-card group flex flex-col cursor-pointer"
              >
                <div className="w-full aspect-square bg-[#F3F4F6] rounded-2xl flex items-center justify-center mb-3 border border-[#E5E7EB] overflow-hidden shadow-sm">
                  {p.songs?.[0]?.image?.[2]?.url ? (
                    <img src={p.songs[0].image[2].url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Music size={36} className="text-[#9CA3AF]" />
                  )}
                </div>
                <h3 className="font-bold text-sm text-[#0F0F0F] truncate group-hover:text-[#337418] transition-colors">{p.name}</h3>
                <p className="text-xs text-[#6B7280] font-medium">{p.songs?.length || 0} tracks</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showImport && <SpotifyImportModal type={showImport} onClose={() => setShowImport(null)} />}
    </div>
  );
};

export default Library;
