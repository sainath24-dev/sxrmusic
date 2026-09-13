import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, ChevronLeft, ChevronRight, X, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { searchAll, decodeHtml } from '../../api/saavn';
import usePlayerStore from '../../store/playerStore';
import Logo from '../ui/Logo';
import UpdatesModal, { SXR_NOTIFICATIONS } from '../ui/UpdatesModal';

const TopBar = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showUpdates, setShowUpdates] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const dropdownRef = useRef(null);
  const { setSong, setQueue } = usePlayerStore();

  useEffect(() => {
    try {
      const lastReadId = localStorage.getItem('sxr_last_read_update');
      if (lastReadId !== SXR_NOTIFICATIONS[0]?.id) {
        setHasUnread(true);
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      const q = query.trim();
      if (q.length > 0) {
        try {
          const res = await searchAll(q);
          if (res.success && res.data) {
            setSuggestions(res.data);
            setShowSuggestions(true);
          } else {
            setSuggestions(null);
            setShowSuggestions(false);
          }
        } catch (err) {
          console.warn("Suggestion error:", err);
        }
      } else {
        setSuggestions(null);
        setShowSuggestions(false);
      }
    };
    const timer = setTimeout(fetchSuggestions, 150);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (item, type) => {
    if (type === 'songs') {
      setSong(item);
      setQueue([item], 0);
    } else if (type === 'albums') {
      navigate(`/album/${item.id}`);
    } else if (type === 'artists') {
      navigate(`/artist/${item.id}`);
    }
    setShowSuggestions(false);
    setQuery('');
  };

  return (
    <header className="h-16 flex items-center justify-between px-3 sm:px-6 bg-[#F8F8F8] border-b border-[#EAEAEA] sticky top-0 z-[800] gap-3 sm:gap-6">
      {/* Left Branding & History Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Logo className="scale-90 sm:scale-100" />
        
        <div className="hidden md:flex items-center gap-1.5 ml-2">
          <button 
            onClick={() => navigate(-1)} 
            className="w-8 h-8 rounded-full bg-[#FFFFFF] border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#0F0F0F] hover:bg-[#F3F4F6] shadow-sm transition-colors"
            title="Go back"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={() => navigate(1)} 
            className="w-8 h-8 rounded-full bg-[#FFFFFF] border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#0F0F0F] hover:bg-[#F3F4F6] shadow-sm transition-colors"
            title="Go forward"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Center Search Bar with Cohere Pill Styling */}
      <div className="relative flex-1 max-w-lg mx-auto" ref={dropdownRef}>
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] z-10 pointer-events-none">
          <Search size={16} />
        </div>
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearch}
          onFocus={() => query.length > 0 && setShowSuggestions(true)}
          placeholder="Search tracks, artists, albums..." 
          className="cohere-search-input w-full h-10 pl-10 pr-9 text-sm font-medium placeholder-[#9CA3AF]"
        />
        {query && (
          <button 
            onClick={() => { setQuery(''); setSuggestions(null); }} 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#0F0F0F] z-10 p-1"
          >
            <X size={15} />
          </button>
        )}

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions && (
          <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-xl overflow-hidden max-h-[70vh] overflow-y-auto z-[1000]">
            {suggestions.songs?.results?.length > 0 && (
              <div className="p-2">
                <h4 className="px-3 py-1.5 text-[11px] font-bold text-[#337418] uppercase tracking-wider">Songs</h4>
                {suggestions.songs.results.slice(0, 5).map((song, idx) => (
                  <div 
                    key={`${song.id}-${idx}`} 
                    onClick={() => handleSelectSuggestion(song, 'songs')} 
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F4F4F5] cursor-pointer group transition-colors"
                  >
                    <div className="relative w-9 h-9 shrink-0 rounded-lg overflow-hidden bg-[#F3F4F6] border border-[#E5E7EB]">
                      <img src={song.image?.[0]?.url || song.image} className="w-full h-full object-cover" alt="" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Play size={13} fill="white" className="text-white ml-0.5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0F0F0F] truncate group-hover:text-[#337418] transition-colors">{decodeHtml(song.name || song.title)}</p>
                      <p className="text-xs text-[#6B7280] truncate">
                        {decodeHtml(song.artists?.primary?.[0]?.name || song.subtitle)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {suggestions.artists?.results?.length > 0 && (
              <div className="p-2 border-t border-[#EAEAEA]">
                <h4 className="px-3 py-1.5 text-[11px] font-bold text-[#337418] uppercase tracking-wider">Artists</h4>
                {suggestions.artists.results.slice(0, 3).map((artist, idx) => (
                  <div 
                    key={`${artist.id}-${idx}`} 
                    onClick={() => handleSelectSuggestion(artist, 'artists')} 
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F4F4F5] cursor-pointer group transition-colors"
                  >
                    <img src={artist.image?.[0]?.url || artist.image?.[0]} className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#E5E7EB]" alt="" />
                    <p className="text-sm font-semibold text-[#0F0F0F] truncate group-hover:text-[#337418]">{decodeHtml(artist.name || artist.title)}</p>
                  </div>
                ))}
              </div>
            )}
            {!suggestions.songs?.results?.length && !suggestions.artists?.results?.length && (
              <div className="p-5 text-center text-[#6B7280] text-xs">Press Enter to search.</div>
            )}
          </div>
        )}
      </div>

      {/* Right Desktop Actions */}
      <div className="flex items-center gap-2 shrink-0 relative">
        <div className="relative">
          <button 
            className={clsx(
              "w-8 h-8 rounded-full border shadow-sm flex items-center justify-center transition-all relative",
              showUpdates 
                ? "bg-[#0F0F0F] text-white border-[#0F0F0F]" 
                : "bg-[#FFFFFF] border-[#E5E7EB] text-[#6B7280] hover:text-[#0F0F0F] hover:bg-[#F3F4F6]"
            )}
            onClick={() => {
              const nextState = !showUpdates;
              setShowUpdates(nextState);
              if (hasUnread) {
                try {
                  localStorage.setItem('sxr_last_read_update', SXR_NOTIFICATIONS[0]?.id || 'read');
                  setHasUnread(false);
                } catch {}
              }
            }}
            title="Notifications"
          >
            <Bell size={16} />
            {hasUnread && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#5DD62C] rounded-full ring-2 ring-[#FFFFFF] animate-pulse" />
            )}
          </button>

          <UpdatesModal 
            isOpen={showUpdates} 
            onClose={() => setShowUpdates(false)}
            hasUnread={hasUnread}
            onMarkAllRead={() => {
              try {
                localStorage.setItem('sxr_last_read_update', SXR_NOTIFICATIONS[0]?.id || 'read');
                setHasUnread(false);
              } catch {}
            }}
          />
        </div>

        <div 
          onClick={() => navigate('/library')}
          className="w-8 h-8 rounded-full bg-[#FFFFFF] border-2 border-[#5DD62C] text-[#337418] shadow-sm flex items-center justify-center font-bold text-xs cursor-pointer hover:bg-[#C8F142] hover:text-black transition-colors"
          title="Library"
        >
          S
        </div>
      </div>
    </header>
  );
};

export default TopBar;

