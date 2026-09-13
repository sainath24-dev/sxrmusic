import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAlbumById, decodeHtml } from '../api/saavn';
import usePlayerStore from '../store/playerStore';
import { Play, Clock, Heart, MoreHorizontal, Disc3 } from 'lucide-react';
import { clsx } from 'clsx';
import { useContextMenuStore } from '../store/contextMenuStore';

const AlbumDetail = () => {
  const { id } = useParams();
  const { setSong, setQueue, currentSong, isPlaying, likedSongs, toggleLike } = usePlayerStore();
  const { openMenu } = useContextMenuStore();

  const { data: album, isLoading } = useQuery({
    queryKey: ['album', id],
    queryFn: () => getAlbumById(id),
  });

  const formatDuration = (secs) => {
    if (!secs) return '3:20';
    const total = parseInt(secs, 10);
    if (isNaN(total)) return secs;
    const m = Math.floor(total / 60);
    const s = Math.floor(total % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="p-8 animate-pulse flex flex-col gap-8 bg-[#FFFFFF] min-h-screen">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end">
          <div className="w-44 h-44 sm:w-52 sm:h-52 bg-[#F3F4F6] rounded-3xl border border-[#E5E7EB]" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-20 bg-[#E5E7EB] rounded-full" />
            <div className="h-10 w-64 bg-[#E5E7EB] rounded-xl" />
            <div className="h-4 w-40 bg-[#E5E7EB] rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  const albumData = album?.data;
  const songs = albumData?.songs || [];

  const handlePlayAlbum = () => {
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
      {/* Album Header */}
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end p-6 sm:p-8 bg-gradient-to-b from-[#F3F4F6] via-[#F8F8F8] to-[#FFFFFF] border-b border-[#EAEAEA] min-h-[240px] sm:min-h-[280px]">
        <div className="w-36 h-36 sm:w-48 sm:h-48 md:w-52 md:h-52 rounded-3xl overflow-hidden shadow-xl shrink-0 bg-[#F3F4F6] border border-[#E5E7EB]">
          <img 
            src={albumData?.image?.[2]?.url || albumData?.image?.[1]?.url || albumData?.image?.[0]?.url} 
            alt="" 
            className="w-full h-full object-cover" 
          />
        </div>

        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#C8F142]/25 text-[#337418] border border-[#5DD62C]/30">ALBUM</span>
            {albumData?.year && (
              <span className="text-[12px] font-medium text-[#6B7280]">{albumData.year}</span>
            )}
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-[#0F0F0F] tracking-tight leading-tight">
            {decodeHtml(albumData?.name)}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#6B7280] font-medium mt-1">
            <span className="font-semibold text-[#0F0F0F] hover:text-[#337418] transition-colors cursor-pointer">
              {albumData?.artists?.primary?.[0]?.name}
            </span>
            <span>•</span>
            <span className="text-[#337418] font-bold">{songs.length} tracks</span>
            {albumData?.playCount && (
              <>
                <span>•</span>
                <span className="text-[#6B7280]">{Number(albumData.playCount).toLocaleString()} plays</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Action Controls */}
        <div className="flex items-center gap-4">
          <button 
            onClick={handlePlayAlbum}
            className="w-14 h-14 rounded-full bg-[#C8F142] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shadow-[#C8F142]/30 hover:bg-[#d4f85e] disabled:opacity-40"
            title="Play Album"
            disabled={songs.length === 0}
          >
            <Play size={24} fill="currentColor" className="ml-1" />
          </button>
          <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
            {songs.length} Tracks
          </span>
        </div>

        {/* Tracks Table */}
        <div className="flex flex-col">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-4 px-4 py-2.5 border-b border-[#EAEAEA] text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-11 sm:col-span-9 md:col-span-9">Title</div>
            <div className="hidden sm:flex sm:col-span-2 md:col-span-2 justify-end items-center pr-4">
              <Clock size={14} />
            </div>
          </div>

          {/* Song Rows */}
          <div className="flex flex-col mt-2 space-y-1">
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

                  {/* Title & Artist */}
                  <div className="col-span-11 sm:col-span-9 md:col-span-9 flex flex-col min-w-0 pr-2">
                    <h4 className={clsx("text-[14px] font-bold truncate", isCurrent ? "text-[#337418]" : "text-[#0F0F0F]")}>
                      {decodeHtml(song.name || song.title)}
                    </h4>
                    <p className="text-[12px] text-[#6B7280] truncate">
                      {decodeHtml(song.artists?.primary?.[0]?.name || albumData?.artists?.primary?.[0]?.name || song.subtitle)}
                    </p>
                  </div>

                  {/* Duration & Heart */}
                  <div className="hidden sm:flex sm:col-span-2 md:col-span-2 items-center justify-end gap-4 pr-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
                      className={clsx("p-1 transition-transform hover:scale-110", isLiked ? "text-[#5DD62C]" : "text-[#9CA3AF] opacity-0 group-hover:opacity-100 hover:text-[#0F0F0F]")}
                    >
                      <Heart size={15} fill={isLiked ? "currentColor" : "none"} />
                    </button>
                    <span className="text-[12px] text-[#6B7280] tabular-nums font-semibold">
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

export default AlbumDetail;
