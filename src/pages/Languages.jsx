import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSongsByLanguage, decodeHtml } from '../api/saavn';
import usePlayerStore from '../store/playerStore';
import { Play, Heart, Plus, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import PlaylistPicker from '../components/ui/PlaylistPicker';
import { CardSkeleton } from '../components/ui/Skeleton';
import { useContextMenuStore } from '../store/contextMenuStore';

const Languages = () => {
  const [selectedLang, setSelectedLang] = useState('hindi');
  const [page, setPage] = useState(1);
  const [allSongs, setAllSongs] = useState([]);
  const { setSong, setQueue, likedSongs, toggleLike } = usePlayerStore();
  const { openMenu } = useContextMenuStore();
  const [pickerSong, setPickerSong] = useState(null);

  const { data: songsData, isLoading, isFetching } = useQuery({
    queryKey: ['languages', selectedLang, page],
    queryFn: () => getSongsByLanguage(selectedLang, page, 40),
  });

  useEffect(() => {
    if (songsData?.data) {
      const newSongs = songsData.data.results || songsData.data.songs || [];
      if (page === 1) {
        setAllSongs(newSongs);
      } else {
        setAllSongs(prev => [...prev, ...newSongs]);
      }
    }
  }, [songsData, page]);

  const handleLangChange = (lang) => {
    setSelectedLang(lang);
    setPage(1);
    setAllSongs([]);
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-full select-none bg-[#FFFFFF] text-[#0F0F0F]">
      {pickerSong && <PlaylistPicker song={pickerSong} onClose={() => setPickerSong(null)} />}
      
      {/* Top Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#C8F142]/25 text-[#337418] border border-[#5DD62C]/30 mb-1 inline-block">REGIONAL DISCOVERY</span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0F0F0F] tracking-tight">Discover Languages</h1>
          <p className="text-[13px] text-[#6B7280] mt-1 font-normal">Explore top trending tracks in regional and international languages.</p>
        </div>
        
        {/* Language Tabs / Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {languages.map(lang => (
            <button 
              key={lang.id}
              onClick={() => handleLangChange(lang.id)}
              className={clsx(
                "cohere-filter-pill",
                selectedLang === lang.id && "active"
              )}
            >
              {lang.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Songs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {isLoading && page === 1 ? (
          Array(12).fill(0).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          allSongs.map((song, idx) => {
            const isLiked = likedSongs.some(s => s.id === song.id);
            const img = song.image?.[2]?.url || song.image?.[1]?.url || song.image?.[0]?.url || song.image;

            return (
              <div 
                key={`${song.id}-${idx}`} 
                className="cohere-card group flex flex-col"
                onContextMenu={(e) => openMenu(e, song)}
              >
                <div 
                  className="relative aspect-square w-full mb-3 rounded-2xl overflow-hidden bg-[#F3F4F6] border border-[#E5E7EB] cursor-pointer" 
                  onClick={() => { setSong(song); setQueue(allSongs, allSongs.findIndex(s => s.id === song.id)); }}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute right-2.5 bottom-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      className="w-10 h-10 rounded-full bg-[#C8F142] text-black flex items-center justify-center shadow-md hover:scale-105 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSong(song);
                        setQueue(allSongs, allSongs.findIndex(s => s.id === song.id));
                      }}
                    >
                      <Play size={17} fill="currentColor" className="ml-0.5" />
                    </button>
                  </div>
                </div>

                <h4 
                  className="font-bold text-[14px] text-[#0F0F0F] truncate hover:text-[#337418] transition-colors cursor-pointer"
                  onClick={() => { setSong(song); setQueue(allSongs, allSongs.findIndex(s => s.id === song.id)); }}
                >
                  {decodeHtml(song.name || song.title)}
                </h4>
                <div className="flex items-center justify-between mt-auto pt-1">
                  <p className="text-[12px] text-[#6B7280] truncate flex-1">
                    {decodeHtml(song.artists?.primary?.[0]?.name || song.subtitle)}
                  </p>
                  <button 
                    onClick={() => toggleLike(song)} 
                    className={clsx("p-1 transition-transform hover:scale-110", isLiked ? "text-[#5DD62C]" : "text-[#9CA3AF] opacity-0 group-hover:opacity-100 hover:text-[#0F0F0F]")}
                  >
                    <Heart size={15} fill={isLiked ? "#5DD62C" : "none"} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {allSongs.length > 0 && (
        <div className="flex justify-center mt-10">
          <button 
            onClick={handleLoadMore} 
            disabled={isFetching}
            className="cohere-btn-outline py-2.5 px-6 text-[13px]"
          >
            {isFetching ? "Loading..." : "Load More Tracks"}
          </button>
        </div>
      )}
    </div>
  );
};

const languages = [
  { id: 'hindi', name: 'Hindi' },
  { id: 'punjabi', name: 'Punjabi' },
  { id: 'tamil', name: 'Tamil' },
  { id: 'telugu', name: 'Telugu' },
  { id: 'kannada', name: 'Kannada' },
  { id: 'malayalam', name: 'Malayalam' },
  { id: 'bhojpuri', name: 'Bhojpuri' },
  { id: 'bengali', name: 'Bengali' },
  { id: 'english', name: 'English' },
  { id: 'haryanvi', name: 'Haryanvi' },
  { id: 'marathi', name: 'Marathi' },
  { id: 'gujarati', name: 'Gujarati' },
];

export default Languages;
