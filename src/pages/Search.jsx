import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchAll, decodeHtml } from '../api/saavn';
import usePlayerStore from '../store/playerStore';
import { Play, Plus, Heart, MoreHorizontal, Disc, Mic2 } from 'lucide-react';
import { clsx } from 'clsx';
import PlaylistPicker from '../components/ui/PlaylistPicker';
import { CardSkeleton, RowSkeleton } from '../components/ui/Skeleton';
import { useContextMenuStore } from '../store/contextMenuStore';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();
  const { setSong, setQueue, likedSongs, toggleLike, currentSong } = usePlayerStore();
  const { openMenu } = useContextMenuStore();
  const [activeFilter, setActiveFilter] = useState('all');
  const [pickerSong, setPickerSong] = useState(null);

  const { data: results, isLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchAll(query),
    enabled: !!query,
  });

  const formatDuration = (secs) => {
    if (!secs) return '3:20';
    const total = parseInt(secs, 10);
    if (isNaN(total)) return secs;
    const m = Math.floor(total / 60);
    const s = Math.floor(total % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!query) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 min-h-full select-none bg-[#FFFFFF] text-[#0F0F0F]">
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F0F0F] mb-6">
          Explore Genres & Categories
        </h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <div 
              key={cat.name} 
              className={clsx(
                "relative rounded-2xl p-4 sm:p-5 overflow-hidden cursor-pointer group border border-[#E5E7EB] transition-all duration-200 aspect-[1.15/1] flex flex-col justify-between bg-[#F9FAFB] hover:bg-[#F3F4F6] hover:border-[#5DD62C]/50 shadow-sm",
                cat.accent
              )}
              onClick={() => navigate(`/discover?lang=${cat.name.toLowerCase()}`)}
            >
              <h3 className="text-lg sm:text-xl font-bold text-[#0F0F0F] leading-tight z-10 group-hover:text-[#337418] transition-colors">
                {cat.name}
              </h3>
              
              <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider z-10">
                Explore →
              </span>
              
              <Disc size={70} strokeWidth={1.5} className="absolute -right-3 -bottom-3 text-black/5 group-hover:text-black/10 rotate-[20deg] group-hover:rotate-[35deg] transition-all duration-300 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const songs = results?.data?.songs?.results || [];
  const topResult = songs[0];
  const artists = results?.data?.artists?.results || [];
  const albums = results?.data?.albums?.results || [];  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-full select-none bg-[#FFFFFF] text-[#0F0F0F]">
      {pickerSong && <PlaylistPicker song={pickerSong} onClose={() => setPickerSong(null)} />}

      {/* Filter Taxonomy Chips */}
      <div className="flex items-center gap-2 mb-6 sticky top-0 z-20 py-2 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#EAEAEA]">
        {['all', 'songs', 'artists', 'albums'].map(filter => (
          <button 
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={clsx(
              "cohere-filter-pill capitalize",
              activeFilter === filter && "active"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(6).fill(0).map((_, i) => <RowSkeleton key={i} />)}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Top Result + Songs Section */}
          {activeFilter === 'all' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Top Result Card */}
              {topResult && (
                <div className="lg:col-span-5 flex flex-col">
                  <h2 className="text-base font-bold text-[#0F0F0F] mb-3">Top Result</h2>
                  <div 
                    className="cohere-card p-5 flex flex-col justify-between flex-1 group relative cursor-pointer min-h-[200px]"
                    onClick={() => { setSong(topResult); setQueue(songs, 0); }}
                  >
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#F3F4F6] border border-[#E5E7EB] mb-3 shadow-sm">
                      <img src={topResult.image?.[2]?.url || topResult.image?.[1]?.url} alt="" className="w-full h-full object-cover" />
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-[#0F0F0F] truncate mb-1">{decodeHtml(topResult.name || topResult.title)}</h3>
                      <p className="text-xs text-[#6B7280] font-medium flex items-center gap-2">
                        <span className="text-[#0F0F0F] font-bold">{decodeHtml(topResult.artists?.primary?.[0]?.name || topResult.subtitle)}</span>
                        <span>•</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C8F142]/20 text-[#337418] border border-[#5DD62C]/30">Track</span>
                      </p>
                    </div>

                    <div className="absolute right-5 bottom-5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        className="w-11 h-11 rounded-full bg-[#C8F142] text-black flex items-center justify-center shadow-lg hover:scale-105 transition-all font-bold"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSong(topResult);
                          setQueue(songs, 0);
                        }}
                      >
                        <Play size={18} fill="currentColor" className="ml-0.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Songs List */}
              <div className={topResult ? "lg:col-span-7 flex flex-col" : "lg:col-span-12 flex flex-col"}>
                <h2 className="text-base font-bold text-[#0F0F0F] mb-3">Songs</h2>
                <div className="flex flex-col gap-1">
                  {songs.slice(0, 5).map((song, index) => {
                    const isLiked = likedSongs.some(s => s.id === song.id);
                    const isCurrent = currentSong?.id === song.id;

                    return (
                      <div 
                        key={`${song.id}-${index}`} 
                        onClick={() => { setSong(song); setQueue(songs, index); }}
                        onContextMenu={(e) => openMenu(e, song)}
                        className={clsx(
                          "flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#F4F4F5] border border-transparent hover:border-[#E5E7EB] group cursor-pointer transition-all",
                          isCurrent ? "bg-[#F0FDF4] border-[#5DD62C]/30" : ""
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#F3F4F6] border border-[#E5E7EB] shrink-0 relative">
                            <img src={song.image?.[0]?.url || song.image} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                              <Play size={14} fill="white" className="text-white ml-0.5" />
                            </div>
                          </div>

                          <div className="min-w-0 flex-1 pr-2">
                            <h4 className={clsx("text-sm font-bold truncate", isCurrent ? "text-[#337418]" : "text-[#0F0F0F]")}>
                              {decodeHtml(song.name || song.title)}
                            </h4>
                            <p className="text-xs text-[#6B7280] truncate font-medium">
                              {decodeHtml(song.artists?.primary?.[0]?.name || song.subtitle)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
                            className={clsx("p-1 transition-colors", isLiked ? "text-[#5DD62C]" : "text-[#9CA3AF] opacity-0 group-hover:opacity-100 hover:text-[#0F0F0F]")}
                          >
                            <Heart size={15} fill={isLiked ? "#5DD62C" : "none"} />
                          </button>
                          <span className="text-xs font-semibold text-[#6B7280] w-10 text-right tabular-nums">
                            {formatDuration(song.duration)}
                          </span>
                          <button 
                            onClick={(e) => openMenu(e, song)}
                            className="p-1 text-[#9CA3AF] opacity-0 group-hover:opacity-100 hover:text-[#0F0F0F]"
                          >
                            <MoreHorizontal size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* All Songs View */}
          {activeFilter === 'songs' && (
            <div className="flex flex-col">
              <h2 className="text-base font-bold text-[#0F0F0F] mb-3">All Tracks</h2>
              <div className="flex flex-col gap-1">
                {songs.map((song, index) => {
                  const isLiked = likedSongs.some(s => s.id === song.id);
                  const isCurrent = currentSong?.id === song.id;

                  return (
                    <div 
                      key={`${song.id}-${index}`} 
                      onClick={() => { setSong(song); setQueue(songs, index); }}
                      onContextMenu={(e) => openMenu(e, song)}
                      className={clsx(
                        "flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#F4F4F5] border border-transparent hover:border-[#E5E7EB] group cursor-pointer transition-all",
                        isCurrent ? "bg-[#F0FDF4] border-[#5DD62C]/30" : ""
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-xs font-semibold text-[#6B7280] w-6 text-center tabular-nums group-hover:hidden">
                          {index + 1}
                        </span>
                        <div className="w-6 hidden group-hover:flex items-center justify-center">
                          <Play size={13} fill="#0F0F0F" className="text-[#0F0F0F]" />
                        </div>
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#F3F4F6] border border-[#E5E7EB] shrink-0">
                          <img src={song.image?.[0]?.url || song.image} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1 pr-2">
                          <h4 className={clsx("text-sm font-bold truncate", isCurrent ? "text-[#337418]" : "text-[#0F0F0F]")}>
                            {decodeHtml(song.name || song.title)}
                          </h4>
                          <p className="text-xs text-[#6B7280] truncate font-medium">
                            {decodeHtml(song.artists?.primary?.[0]?.name || song.subtitle)}
                          </p>
                        </div>
                      </div>

                      <div className="hidden md:block w-1/4 text-xs text-[#6B7280] truncate pr-4">
                        {decodeHtml(song.album?.name || '')}
                      </div>

                      <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
                          className={clsx("p-1 transition-colors", isLiked ? "text-[#5DD62C]" : "text-[#9CA3AF] opacity-0 group-hover:opacity-100 hover:text-[#0F0F0F]")}
                        >
                          <Heart size={15} fill={isLiked ? "#5DD62C" : "none"} />
                        </button>
                        <span className="text-xs font-semibold text-[#6B7280] w-10 text-right tabular-nums">
                          {formatDuration(song.duration)}
                        </span>
                        <button 
                          onClick={(e) => openMenu(e, song)}
                          className="p-1 text-[#9CA3AF] opacity-0 group-hover:opacity-100 hover:text-[#0F0F0F]"
                        >
                          <MoreHorizontal size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Artists Section */}
          {(activeFilter === 'all' || activeFilter === 'artists') && artists.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-[#0F0F0F] mb-3">Artists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {artists.map(artist => {
                  const img = artist.image?.[2]?.url || artist.image?.[1]?.url || artist.image?.[0]?.url || artist.image?.[0];
                  return (
                    <div 
                      key={artist.id} 
                      onClick={() => navigate(`/artist/${artist.id}`)} 
                      className="cohere-card group flex flex-col items-center text-center cursor-pointer"
                    >
                      <div className="relative aspect-square w-full mb-3 rounded-full overflow-hidden border border-[#E5E7EB] bg-[#F3F4F6] flex items-center justify-center">
                        {img ? (
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Mic2 size={32} className="text-[#9CA3AF]" />
                        )}
                        <div className="absolute right-2 bottom-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-8 h-8 rounded-full bg-[#C8F142] text-black flex items-center justify-center shadow-md font-bold">
                            <Play size={14} fill="currentColor" className="ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <p className="font-bold text-sm text-[#0F0F0F] truncate w-full group-hover:text-[#337418] transition-colors">{decodeHtml(artist.name || artist.title)}</p>
                      <p className="text-xs text-[#6B7280]">Artist</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Albums Section */}
          {(activeFilter === 'all' || activeFilter === 'albums') && albums.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-[#0F0F0F] mb-3">Albums</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {albums.map(album => (
                  <div 
                    key={album.id} 
                    onClick={() => navigate(`/album/${album.id}`)} 
                    className="cohere-card group flex flex-col"
                  >
                    <div className="relative aspect-square w-full mb-3 rounded-2xl overflow-hidden bg-[#F3F4F6] border border-[#E5E7EB]">
                      <img src={album.image?.[2]?.url || album.image?.[1]?.url || album.image?.[0]?.url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute right-2.5 bottom-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-8 h-8 rounded-full bg-[#C8F142] text-black flex items-center justify-center shadow-md font-bold">
                          <Play size={14} fill="currentColor" className="ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <p className="font-bold text-sm text-[#0F0F0F] truncate w-full group-hover:text-[#337418] transition-colors">{decodeHtml(album.name)}</p>
                    <p className="text-xs text-[#6B7280] truncate">{decodeHtml(album.artists?.primary?.[0]?.name || 'Album')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const categories = [
  { name: 'Pop', accent: 'hover:border-[#c8f142]' },
  { name: 'Hip-Hop', accent: 'hover:border-[#c8f142]' },
  { name: 'Lo-Fi', accent: 'hover:border-[#c8f142]' },
  { name: 'Bollywood', accent: 'hover:border-[#c8f142]' },
  { name: 'Romance', accent: 'hover:border-[#c8f142]' },
  { name: 'Workout', accent: 'hover:border-[#c8f142]' },
  { name: 'Chill', accent: 'hover:border-[#c8f142]' },
  { name: 'Party', accent: 'hover:border-[#c8f142]' },
  { name: 'Punjabi', accent: 'hover:border-[#c8f142]' },
  { name: 'Tamil', accent: 'hover:border-[#c8f142]' },
  { name: 'Telugu', accent: 'hover:border-[#c8f142]' },
  { name: 'Rock', accent: 'hover:border-[#c8f142]' },
  { name: 'EDM', accent: 'hover:border-[#c8f142]' },
  { name: 'Indie', accent: 'hover:border-[#c8f142]' },
  { name: 'Classical', accent: 'hover:border-[#c8f142]' },
];

export default Search;

