import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  getTrending, getHindiHits, getTamilHits, getTeluguHits, 
  getPunjabiHits, getKannadaHits, getTopArtists, getArtistSongs, decodeHtml 
} from '../api/saavn';
import usePlayerStore from '../store/playerStore';
import useDownloadStore from '../store/downloadStore';
import { Play, Plus, Heart, Compass, Download, WifiOff, Music2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import PlaylistPicker from '../components/ui/PlaylistPicker';
import { CardSkeleton } from '../components/ui/Skeleton';
import { useContextMenuStore } from '../store/contextMenuStore';
import BentoGrid from '../components/ui/BentoGrid';

const SongCard = ({ song, list }) => {
  const { setSong, setQueue, likedSongs, toggleLike } = usePlayerStore();
  const { openMenu } = useContextMenuStore();
  const [showPicker, setShowPicker] = useState(false);
  const isLiked = likedSongs.some(s => s.id === song.id);

  const imageUrl = song.image?.[2]?.url || song.image?.[2] || song.image?.[1]?.url || song.image?.[0]?.url || song.image?.[0] || song.image;

  return (
    <div 
      className="cohere-card group flex flex-col"
      onContextMenu={(e) => openMenu(e, song)}
    >
      <div 
        className="relative aspect-square mb-3 rounded-2xl overflow-hidden bg-[#F3F4F6] border border-[#E5E7EB]" 
        onClick={() => { setSong(song); setQueue(list, list.findIndex(s => s.id === song.id)); }}
      >
        <img 
          src={imageUrl} 
          alt="" 
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" 
          loading="lazy"
        />
        <div className="absolute right-2.5 bottom-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            className="w-10 h-10 rounded-full bg-[#C8F142] text-black flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all font-bold"
            onClick={(e) => {
              e.stopPropagation();
              setSong(song);
              setQueue(list, list.findIndex(s => s.id === song.id));
            }}
            title="Play"
          >
            <Play size={17} fill="currentColor" className="ml-0.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col min-w-0 flex-1">
        <h3 
          className="font-bold text-[#0F0F0F] truncate text-sm leading-snug mb-1 cursor-pointer hover:text-[#337418] transition-colors"
          onClick={() => { setSong(song); setQueue(list, list.findIndex(s => s.id === song.id)); }}
        >
          {decodeHtml(song.name || song.title)}
        </h3>

        <div className="flex items-center justify-between mt-auto">
          <p className="text-xs text-[#6B7280] truncate flex-1 hover:text-[#0F0F0F] cursor-pointer transition-colors font-medium">
            {decodeHtml(song.artists?.primary?.[0]?.name || song.artists?.all?.[0]?.name || song.subtitle)}
          </p>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
            <button 
              onClick={(e) => { e.stopPropagation(); toggleLike(song); }} 
              className={clsx("p-1 transition-colors", isLiked ? "text-[#5DD62C]" : "text-[#9CA3AF] hover:text-[#0F0F0F]")}
              title={isLiked ? "Unlike" : "Like"}
            >
              <Heart size={14} fill={isLiked ? "#5DD62C" : "none"} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowPicker(!showPicker); }} 
              className="p-1 text-[#9CA3AF] hover:text-[#0F0F0F] transition-colors"
              title="Add to Playlist"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>
      </div>

      {showPicker && <PlaylistPicker song={song} onClose={() => setShowPicker(false)} />}
    </div>
  );
};

const Home = ({ isOnline = true }) => {
  const { followedArtists, setSong, setQueue } = usePlayerStore();
  const { downloadedSongs } = useDownloadStore();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');
  const [limits, setLimits] = useState({ trending: 12, hindi: 12, tamil: 12, telugu: 12, punjabi: 12, kannada: 12 });

  const { data: trending, isLoading: tl } = useQuery({ queryKey: ['trending'], queryFn: getTrending, enabled: isOnline });
  const { data: hindi, isLoading: hl } = useQuery({ queryKey: ['hindi'], queryFn: getHindiHits, enabled: isOnline });
  const { data: tamil, isLoading: tml } = useQuery({ queryKey: ['tamil'], queryFn: getTamilHits, enabled: isOnline });
  const { data: telugu, isLoading: tgl } = useQuery({ queryKey: ['telugu'], queryFn: getTeluguHits, enabled: isOnline });
  const { data: punjabi, isLoading: pl } = useQuery({ queryKey: ['punjabi'], queryFn: getPunjabiHits, enabled: isOnline });
  const { data: kannada, isLoading: kl } = useQuery({ queryKey: ['kannada'], queryFn: getKannadaHits, enabled: isOnline });
  const { data: artists, isLoading: al } = useQuery({ queryKey: ['topArtists'], queryFn: getTopArtists, enabled: isOnline });

  const { data: followedSongs } = useQuery({
    queryKey: ['followedSongs', followedArtists.map(a => a.id).join(',')],
    queryFn: async () => {
      const results = await Promise.all(followedArtists.slice(0, 3).map(a => getArtistSongs(a.id, 1)));
      return results.flatMap(res => res.data?.results || []);
    },
    enabled: followedArtists.length > 0 && isOnline,
  });

  const handleLoadMore = (key) => {
    setLimits(prev => ({ ...prev, [key]: prev[key] + 12 }));
  };

  const categories = ['All', 'New Release', 'Trending', 'Hindi', 'Punjabi', 'Telugu', 'Tamil'];

  const renderSection = (id, title, list, loading) => {
    if (!isOnline) return null;

    if (loading) {
      return (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#0F0F0F]">{title}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        </section>
      );
    }

    if (!list || list.length === 0) return null;

    const displayList = list.slice(0, limits[id] || 12);
    const hasMore = list.length > displayList.length;

    return (
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg sm:text-xl font-bold text-[#0F0F0F]">{title}</h2>
          {hasMore && (
            <button 
              onClick={() => handleLoadMore(id)} 
              className="text-xs font-semibold text-[#6B7280] hover:text-[#337418] uppercase tracking-wider transition-colors"
            >
              View More →
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {displayList.map((song, idx) => (
            <SongCard key={`${song.id}-${idx}`} song={song} list={list} />
          ))}
        </div>
      </section>
    );
  };

  const trendingList = trending?.data?.results || trending?.data?.songs || [];
  const hindiList = hindi?.data?.results || hindi?.data?.songs || [];
  const tamilList = tamil?.data?.results || tamil?.data?.songs || [];
  const teluguList = telugu?.data?.results || telugu?.data?.songs || [];
  const punjabiList = punjabi?.data?.results || punjabi?.data?.songs || [];
  const kannadaList = kannada?.data?.results || kannada?.data?.songs || [];
  const artistList = artists?.data?.results || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-full">
      {/* Offline Mode Alert & Downloaded Tracks Hub */}
      {!isOnline && (
        <div className="mb-8 p-6 rounded-3xl bg-gradient-to-br from-[#FEF3C7] via-[#FFFBEB] to-[#FEF3C7] border border-[#F59E0B]/40 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FFFFFF] shadow-sm flex items-center justify-center text-[#D97706] border border-[#F59E0B]/30">
                <WifiOff size={24} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-[#92400E]">
                  Offline Music Mode
                </h2>
                <p className="text-xs text-[#B45309] font-medium">
                  {downloadedSongs.length > 0 
                    ? `You have ${downloadedSongs.length} downloaded track${downloadedSongs.length > 1 ? 's' : ''} ready for offline playback.`
                    : "Connect to the internet to download songs for offline playback."}
                </p>
              </div>
            </div>

            {downloadedSongs.length > 0 && (
              <button 
                onClick={() => {
                  setQueue(downloadedSongs, 0);
                  setSong(downloadedSongs[0]);
                }}
                className="py-2.5 px-5 rounded-full bg-[#C8F142] text-black font-bold text-xs flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-md shadow-[#C8F142]/30"
              >
                <Play size={15} fill="currentColor" /> Play All Offline
              </button>
            )}
          </div>

          {downloadedSongs.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 mt-2">
              {downloadedSongs.map((song, idx) => (
                <SongCard key={`${song.id}-${idx}`} song={song} list={downloadedSongs} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#92400E] text-xs font-semibold">
              No offline downloads saved yet. When connected, tap the download icon (⬇) on any song to save it offline!
            </div>
          )}
        </div>
      )}

      {/* Top Greeting Header with Aurora Glow & Filter Bar (Online Mode) */}
      {isOnline && (
        <div className="mb-6 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#5DD62C] to-[#C8F142] p-0.5 shadow-sm">
                <div className="w-full h-full rounded-full bg-[#FFFFFF] flex items-center justify-center font-black text-sm text-[#337418]">
                  S
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#0F0F0F] tracking-tight">
                  Hi, Music Lover
                </h1>
                <p className="text-xs text-[#6B7280] font-medium">Discover curated tracks crafted for your day</p>
              </div>
            </div>
          </div>

          {/* Pill Category Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={clsx(
                  "cohere-filter-pill",
                  activeFilter === cat && "active"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bento Grid (Online Mode) */}
      {isOnline && <BentoGrid trendingSongs={trendingList} />}

      {/* Followed Artists Mix */}
      {isOnline && followedSongs && followedSongs.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-bold text-[#337418] uppercase tracking-wider">Curated</span>
              <h2 className="text-lg sm:text-xl font-bold text-[#0F0F0F]">From Your Followed Artists</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {followedSongs.slice(0, 6).map((song, idx) => (
              <SongCard key={`${song.id}-${idx}`} song={song} list={followedSongs} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Artists */}
      {isOnline && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#0F0F0F]">Featured Artists</h2>
            <button 
              onClick={() => navigate('/artists')} 
              className="text-xs font-semibold text-[#6B7280] hover:text-[#337418] uppercase tracking-wider transition-colors"
            >
              All Artists →
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {al ? (
              Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)
            ) : (
              artistList.slice(0, 6).map(artist => {
                const img = artist.image?.[2]?.url || artist.image?.[1]?.url || artist.image?.[0]?.url || artist.image?.[0];
                return (
                  <div 
                    key={artist.id} 
                    className="cohere-card group flex flex-col items-center text-center cursor-pointer"
                    onClick={() => navigate(`/artist/${artist.id}`)}
                  >
                    <div className="relative aspect-square w-full mb-3 rounded-full overflow-hidden border border-[#E5E7EB] bg-[#F3F4F6]">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <div className="absolute right-2 bottom-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-9 h-9 rounded-full bg-[#C8F142] text-black flex items-center justify-center shadow-md font-bold">
                          <Play size={15} fill="currentColor" className="ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <h3 className="font-bold text-sm text-[#0F0F0F] truncate w-full group-hover:text-[#337418] transition-colors">{decodeHtml(artist.name)}</h3>
                    <p className="text-xs text-[#6B7280]">Artist</p>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* Main Music Sections */}
      {isOnline && renderSection('trending', 'Top Daily Playlists', trendingList, tl)}
      {isOnline && renderSection('hindi', 'Today’s Hindi Hits', hindiList, hl)}
      {isOnline && renderSection('punjabi', 'Hot Punjabi Tracks', punjabiList, pl)}
      {isOnline && renderSection('tamil', 'Top Tamil Hits', tamilList, tml)}
      {isOnline && renderSection('telugu', 'Telugu Chartbusters', teluguList, tgl)}
      {isOnline && renderSection('kannada', 'Fresh Kannada Tunes', kannadaList, kl)}
    </div>
  );
};

export default Home;
