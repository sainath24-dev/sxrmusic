import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getArtistById, getArtistSongs, decodeHtml } from '../api/saavn';
import usePlayerStore from '../store/playerStore';
import { Play, Heart, MoreHorizontal, Check, Clock, UserCheck, UserPlus } from 'lucide-react';
import { clsx } from 'clsx';
import { useContextMenuStore } from '../store/contextMenuStore';

const ArtistDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentSong, setSong, setQueue, followedArtists, toggleFollowArtist, likedSongs, toggleLike } = usePlayerStore();
  const { openMenu } = useContextMenuStore();

  const { data: artist, isLoading: isArtistLoading } = useQuery({
    queryKey: ['artist', id],
    queryFn: () => getArtistById(id),
  });

  const { data: artistSongs, isLoading: isSongsLoading } = useQuery({
    queryKey: ['artistSongs', id],
    queryFn: () => getArtistSongs(id),
    enabled: !!id,
  });

  const formatDuration = (secs) => {
    if (!secs) return '3:20';
    const total = parseInt(secs, 10);
    if (isNaN(total)) return secs;
    const m = Math.floor(total / 60);
    const s = Math.floor(total % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isArtistLoading) {
    return (
      <div className="p-8 animate-pulse bg-[#FFFFFF] min-h-screen">
        <div className="h-60 bg-[#F3F4F6] rounded-2xl mb-8 border border-[#E5E7EB]" />
        <div className="h-8 w-48 bg-[#E5E7EB] rounded mb-4" />
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => <div key={i} className="h-12 bg-[#F3F4F6] rounded-xl" />)}
        </div>
      </div>
    );
  }

  const artistData = artist?.data;
  const songs = artistSongs?.data?.results || [];
  const isFollowed = followedArtists.some(a => a.id === id);
  const artistImg = artistData?.image?.[2]?.url || artistData?.image?.[2] || artistData?.image?.[1]?.url || '';

  const handlePlayArtist = () => {
    if (songs.length > 0) {
      setQueue(songs, 0);
      setSong(songs[0]);
    }
  };

  const handlePlaySong = (song, index) => {
    setQueue(songs, index);
    setSong(song);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#FFFFFF] text-[#0F0F0F]">
      {/* Header Banner */}
      <div className="relative p-6 sm:p-8 md:p-12 flex flex-col justify-end min-h-[260px] sm:min-h-[320px] overflow-hidden border-b border-[#EAEAEA] bg-[#F8F8F8]">
        {artistImg && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20 blur-md scale-105 pointer-events-none" 
            style={{ backgroundImage: `url(${artistImg})` }} 
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#FFFFFF] via-[#FFFFFF]/80 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#C8F142]/30 text-[#337418] border border-[#5DD62C]/30 flex items-center gap-1">
              <Check size={11} strokeWidth={3} /> VERIFIED ARTIST
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-[#0F0F0F] tracking-tight leading-tight">
            {decodeHtml(artistData?.name)}
          </h1>
          <p className="text-[13px] font-medium text-[#6B7280]">
            {artistData?.followerCount ? `${parseInt(artistData.followerCount, 10).toLocaleString()} followers` : 'Popular Artist'}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Action Controls */}
        <div className="flex items-center gap-4">
          <button 
            onClick={handlePlayArtist}
            className="w-13 h-13 bg-[#C8F142] text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shadow-[#C8F142]/30 disabled:opacity-40"
            title="Play Artist"
            disabled={songs.length === 0}
          >
            <Play size={22} fill="currentColor" className="ml-0.5" />
          </button>

          <button 
            onClick={() => toggleFollowArtist({ id, name: artistData?.name, image: artistData?.image })}
            className={clsx(
              "px-5 py-2.5 rounded-full text-[13px] font-bold transition-all duration-150 border flex items-center gap-1.5",
              isFollowed 
                ? "bg-[#F3F4F6] text-[#0F0F0F] border-[#E5E7EB] hover:border-[#5DD62C]" 
                : "border-[#0F0F0F] bg-[#0F0F0F] text-white hover:bg-black"
            )}
          >
            {isFollowed ? <UserCheck size={15} /> : <UserPlus size={15} />}
            {isFollowed ? "Following" : "Follow"}
          </button>
        </div>

        {/* All Songs Section */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-bold text-[#0F0F0F]">All Tracks</h2>
            {songs.length > 0 && (
              <span className="text-xs font-bold text-[#337418] bg-[#C8F142]/20 px-2.5 py-0.5 rounded-full border border-[#5DD62C]/30">
                {songs.length} Tracks
              </span>
            )}
          </div>

          <div className="flex flex-col space-y-1.5">
            {songs.map((song, index) => {
              const isCurrent = currentSong?.id === song.id;
              const isLiked = likedSongs.some(s => s.id === song.id);

              return (
                <div 
                  key={`${song.id}-${index}`}
                  onClick={() => handlePlaySong(song, index)}
                  onContextMenu={(e) => openMenu(e, song)}
                  className={clsx(
                    "grid grid-cols-12 gap-4 items-center px-4 py-3 rounded-2xl hover:bg-[#F4F4F5] border border-transparent hover:border-[#E5E7EB] group cursor-pointer transition-all duration-150",
                    isCurrent ? "bg-[#F0FDF4] border-[#5DD62C]/30" : ""
                  )}
                >
                  {/* Index / Play */}
                  <div className="col-span-1 text-center text-[13px] text-[#6B7280]">
                    <span className="group-hover:hidden tabular-nums">{index + 1}</span>
                    <Play size={14} fill="#0F0F0F" className="hidden group-hover:inline ml-auto mr-auto text-[#0F0F0F]" />
                  </div>

                  {/* Artwork & Title */}
                  <div className="col-span-11 sm:col-span-6 md:col-span-5 flex items-center gap-3.5 min-w-0 pr-2">
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#F3F4F6] shrink-0 border border-[#E5E7EB]">
                      <img src={song.image?.[0]?.url || song.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className={clsx("text-sm font-bold truncate", isCurrent ? "text-[#337418]" : "text-[#0F0F0F]")}>
                        {decodeHtml(song.name || song.title)}
                      </h4>
                      <p className="text-xs text-[#6B7280] truncate">
                        {decodeHtml(song.artists?.primary?.[0]?.name || song.subtitle)}
                      </p>
                    </div>
                  </div>

                  {/* Album Name */}
                  <div className="hidden sm:block sm:col-span-5 md:col-span-4 text-xs text-[#6B7280] truncate font-medium">
                    {decodeHtml(song.album?.name || '')}
                  </div>

                  {/* Duration & Like */}
                  <div className="hidden md:flex md:col-span-2 items-center justify-end gap-4 pr-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
                      className={clsx("p-1 transition-transform hover:scale-110", isLiked ? "text-[#5DD62C]" : "text-[#9CA3AF] opacity-0 group-hover:opacity-100 hover:text-[#0F0F0F]")}
                    >
                      <Heart size={15} fill={isLiked ? "#5DD62C" : "none"} />
                    </button>
                    <span className="text-xs font-semibold text-[#6B7280] tabular-nums">
                      {formatDuration(song.duration)}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); openMenu(e, song); }}
                      className="p-1 text-[#9CA3AF] opacity-0 group-hover:opacity-100 hover:text-[#0F0F0F] transition-opacity"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistDetail;
