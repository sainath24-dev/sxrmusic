import React, { useEffect, useRef } from 'react';
import { Sparkles, Download, Music, Mic2, Disc, Zap, Check, X, Bell, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';

export const APP_UPDATES = [
  {
    id: 'update-offline-mode',
    version: 'v2.4',
    date: 'Latest Release',
    title: 'Offline Playback & Downloads',
    tag: 'NEW FEATURE',
    tagColor: 'bg-[#C8F142]/30 text-[#245811] border-[#5DD62C]/40',
    icon: Download,
    iconBg: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]',
    summary: 'Download any song directly to your device and play it anytime without an active internet connection.',
    highlights: [
      'Full offline audio caching using high-speed browser CacheStorage',
      'Dedicated "Offline Downloads" section in your Library',
      'Automatic offline fallback banner with instant access to saved music'
    ]
  },
  {
    id: 'update-playlist-import',
    version: 'v2.3',
    date: 'Recent',
    title: 'Unlimited Playlist Import (100+ Songs)',
    tag: 'IMPROVED',
    tagColor: 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]',
    icon: Music,
    iconBg: 'bg-[#ECFDF5] text-[#047857] border-[#6EE7B7]',
    summary: 'Import large Spotify and YouTube playlists up to 500+ tracks with parallel multi-page extraction.',
    highlights: [
      'Full pagination across YouTube continuation tokens and Spotify Partner API',
      '4× faster concurrent song matching with live progress display',
      'Automatic duplicate filtering when refreshing existing playlists'
    ]
  },
  {
    id: 'update-word-lyrics',
    version: 'v2.2',
    date: 'Recent',
    title: 'Dynamic Word-by-Word Live Lyrics',
    tag: 'ENHANCED',
    tagColor: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
    icon: Mic2,
    iconBg: 'bg-[#FFFBEB] text-[#B45309] border-[#FCD34D]',
    summary: 'Experience real-time karaoke synchronization with smooth fluid word highlights and zero jumpy scrolling.',
    highlights: [
      'Smooth karaoke highlight animations matched to singer vocal timing',
      'Full-screen theater mode and lyrics panel toggle in bottom player',
      'Clean typography with high-contrast Cohere styling'
    ]
  },
  {
    id: 'update-artist-discography',
    version: 'v2.1',
    date: 'Earlier',
    title: 'Complete Artist Discographies',
    tag: 'EXPANDED',
    tagColor: 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]',
    icon: Disc,
    iconBg: 'bg-[#F0F9FF] text-[#0369A1] border-[#BAE6FD]',
    summary: 'Browse complete discographies of your favorite artists without arbitrary 15-song caps.',
    highlights: [
      'Concurrent multi-page catalog fetching for instant album and single loading',
      'Direct one-click playback of top songs and release discography',
      'Instant artist search from global search bar'
    ]
  },
  {
    id: 'update-hifi-audio',
    version: 'v2.0',
    date: 'Major',
    title: 'Lossless Hi-Fi Audio Streaming',
    tag: 'AUDIO ENGINE',
    tagColor: 'bg-[#FAF5FF] text-[#6B21A8] border-[#E9D5FF]',
    icon: Zap,
    iconBg: 'bg-[#FDF4FF] text-[#A21CAF] border-[#F0ABFC]',
    summary: 'Studio master quality (320kbps AAC and lossless streams) with gapless transitions.',
    highlights: [
      'Lossless stream resolution with auto-fallback to high-bitrate mirrors',
      'Crossfade engine and background Media Session lockscreen controls',
      'Zero audio buffering and lightning-fast track switching'
    ]
  }
];

const UpdatesModal = ({ isOpen, onClose, onMarkAllRead }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={modalRef}
      className="absolute right-0 top-[calc(100%+10px)] w-[92vw] sm:w-[420px] max-h-[80vh] bg-[#FFFFFF] border border-[#E5E7EB] rounded-3xl shadow-2xl z-[1200] overflow-hidden flex flex-col select-none animate-in fade-in zoom-in-95 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[#EAEAEA] bg-gradient-to-b from-[#FAFAFA] to-[#FFFFFF] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#C8F142]/30 border border-[#5DD62C]/40 flex items-center justify-center text-[#245811]">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#0F0F0F] tracking-tight">What's New</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C8F142]/25 text-[#245811] border border-[#5DD62C]/30">
                v2.4
              </span>
            </div>
            <p className="text-[11px] text-[#6B7280]">Recent updates & features added to SXR Music</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#6B7280] hover:text-[#0F0F0F] flex items-center justify-center transition-colors"
          title="Close"
        >
          <X size={14} />
        </button>
      </div>

      {/* Updates List */}
      <div className="overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-3 flex-1">
        {APP_UPDATES.map((update) => {
          const Icon = update.icon;
          return (
            <div 
              key={update.id}
              className="p-3.5 rounded-2xl bg-[#FAFAFA] hover:bg-[#F4F4F5] border border-[#EAEAEA] transition-all duration-150 flex flex-col gap-2"
            >
              {/* Header inside card */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={clsx("w-8 h-8 rounded-xl border flex items-center justify-center shrink-0", update.iconBg)}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-[#0F0F0F] leading-snug">
                      {update.title}
                    </h4>
                    <span className="text-[11px] font-medium text-[#6B7280]">
                      {update.date}
                    </span>
                  </div>
                </div>

                <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0", update.tagColor)}>
                  {update.tag}
                </span>
              </div>

              {/* Summary Description */}
              <p className="text-[12px] text-[#4B5563] leading-relaxed pl-10">
                {update.summary}
              </p>

              {/* Highlight Bullets */}
              {update.highlights && update.highlights.length > 0 && (
                <div className="pl-10 space-y-1 mt-0.5">
                  {update.highlights.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[11px] text-[#6B7280]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5DD62C] shrink-0 mt-1.5" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 px-4 border-t border-[#EAEAEA] bg-[#FAFAFA] flex items-center justify-between text-[11px] text-[#6B7280]">
        <div className="flex items-center gap-1.5 font-medium">
          <ShieldCheck size={14} className="text-[#337418]" />
          <span>SXR Music • Always Free & Lossless</span>
        </div>
        <button
          onClick={() => {
            if (onMarkAllRead) onMarkAllRead();
            onClose();
          }}
          className="text-[#337418] font-bold hover:underline"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

export default UpdatesModal;
