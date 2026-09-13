import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTopArtists, decodeHtml } from '../api/saavn';
import { useNavigate } from 'react-router-dom';
import { Play, Mic2, UserCheck, UserPlus } from 'lucide-react';
import usePlayerStore from '../store/playerStore';
import { clsx } from 'clsx';

const AllArtists = () => {
  const navigate = useNavigate();
  const { followedArtists, toggleFollowArtist } = usePlayerStore();

  const { data: artists, isLoading } = useQuery({
    queryKey: ['allArtists'],
    queryFn: () => getTopArtists(),
  });

  const artistList = artists?.data?.results || [];

  return (
    <div className="p-4 sm:p-8 pb-32 bg-[#FFFFFF] min-h-full">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#C8F142]/20 border border-[#5DD62C]/30 flex items-center justify-center text-[#337418] shadow-sm">
          <Mic2 size={24} />
        </div>
        <div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#C8F142]/20 text-[#337418] border border-[#5DD62C]/30 mb-1 inline-block">DIRECTORY</span>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F0F0F] tracking-tight">Artists</h1>
          <p className="text-[13px] text-[#6B7280] font-normal mt-1">Explore top talent and trending voices from around the world.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {isLoading ? (
          Array(18).fill(0).map((_, i) => (
            <div key={i} className="bg-[#F9FAFB] p-4 rounded-3xl border border-[#E5E7EB] flex flex-col items-center gap-4 animate-pulse">
              <div className="aspect-square w-full rounded-full bg-[#E5E7EB]" />
              <div className="h-4 w-2/3 bg-[#E5E7EB] rounded" />
              <div className="h-3 w-1/3 bg-[#E5E7EB] rounded" />
            </div>
          ))
        ) : (
          artistList.map((artist) => {
            const isFollowed = followedArtists.some(a => a.id === artist.id);
            const imageUrl = artist.image?.[2]?.url || artist.image?.[2] || artist.image?.[1]?.url || artist.image?.[1] || artist.image?.[0]?.url || artist.image?.[0];
            
            return (
              <div 
                key={artist.id} 
                className="cohere-card group flex flex-col items-center text-center cursor-pointer p-3 sm:p-4 rounded-3xl" 
                onClick={() => navigate(`/artist/${artist.id}`)}
              >
                <div className="relative aspect-square w-full mb-4 rounded-full overflow-hidden bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center shadow-sm">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={artist.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      loading="lazy"
                    />
                  ) : (
                    <Mic2 size={36} className="text-[#9CA3AF]" />
                  )}
                  
                  {/* hover play button */}
                  <div className="absolute right-2.5 bottom-2.5 cohere-play-btn opacity-0 group-hover:opacity-100 transition-all duration-150">
                    <Play size={18} fill="black" className="ml-0.5 text-black" />
                  </div>
                </div>

                <h3 className="font-bold truncate text-[14px] text-[#0F0F0F] w-full text-center mb-0.5 group-hover:text-[#337418] transition-colors">
                  {decodeHtml(artist.name)}
                </h3>
                <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Artist</span>
                
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    toggleFollowArtist(artist); 
                  }}
                  className={clsx(
                    "w-full py-1.5 px-3 rounded-full text-[12px] font-bold transition-all duration-150 flex items-center justify-center gap-1.5 border",
                    isFollowed 
                      ? "bg-[#F3F4F6] text-[#0F0F0F] border-[#E5E7EB] hover:border-[#5DD62C]" 
                      : "border-[#0F0F0F] bg-[#0F0F0F] text-white hover:bg-black"
                  )}
                >
                  {isFollowed ? (
                    <>
                      <UserCheck size={13} />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={13} />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AllArtists;
