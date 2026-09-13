import React, { useEffect, useRef } from 'react';
import { Download, Music, Mic2, Disc, X, Bell, CheckCheck } from 'lucide-react';
import { clsx } from 'clsx';

export const SXR_NOTIFICATIONS = [
  {
    id: 'notif-offline',
    title: 'Offline Downloads Ready',
    message: 'Download any song to your library and listen offline without an internet connection.',
    time: 'Just now',
    icon: Download,
    iconColor: 'text-[#166534] bg-[#F0FDF4] border-[#DCFCE7]'
  },
  {
    id: 'notif-import-limit',
    title: 'High-Capacity Playlist Import',
    message: 'Import 100, 200, or 500+ songs from Spotify and YouTube with automatic matching.',
    time: '2h ago',
    icon: Music,
    iconColor: 'text-[#065F46] bg-[#ECFDF5] border-[#A7F3D0]'
  },
  {
    id: 'notif-word-lyrics',
    title: 'Word-by-Word Synced Lyrics',
    message: 'Karaoke lyrics now highlight word-by-word with smooth fluid animations in the player.',
    time: 'Yesterday',
    icon: Mic2,
    iconColor: 'text-[#92400E] bg-[#FEF3C7] border-[#FDE68A]'
  },
  {
    id: 'notif-artist-catalog',
    title: 'Complete Artist Discographies',
    message: 'Browse all songs and full album discographies for artists without the 15-song limit.',
    time: '3d ago',
    icon: Disc,
    iconColor: 'text-[#1E40AF] bg-[#EFF6FF] border-[#BFDBFE]'
  }
];

const UpdatesModal = ({ isOpen, onClose, onMarkAllRead, hasUnread }) => {
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
      className="absolute right-0 top-[calc(100%+10px)] w-[90vw] sm:w-[380px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-2xl z-[1200] overflow-hidden flex flex-col select-none animate-in fade-in zoom-in-95 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-[#EAEAEA] bg-[#FAFAFA] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg overflow-hidden bg-[#FFFFFF] border border-[#E5E7EB] shrink-0">
            <img src="/logo.png" alt="SXR" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-[13px] font-bold text-[#0F0F0F] tracking-tight">SXR Music</h3>
              {hasUnread && (
                <span className="w-2 h-2 rounded-full bg-[#5DD62C]" />
              )}
            </div>
            <p className="text-[11px] text-[#6B7280]">Recent Updates</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {hasUnread && (
            <button 
              onClick={onMarkAllRead}
              className="text-[11px] font-bold text-[#337418] hover:text-[#166534] px-2 py-1 rounded-md hover:bg-[#F0FDF4] transition-colors flex items-center gap-1"
              title="Mark all as read"
            >
              <CheckCheck size={13} />
              Read
            </button>
          )}
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#6B7280] hover:text-[#0F0F0F] flex items-center justify-center transition-colors"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-[#F3F4F6] max-h-[60vh] overflow-y-auto custom-scrollbar">
        {SXR_NOTIFICATIONS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div 
              key={item.id}
              className="p-3.5 hover:bg-[#F9FAFB] transition-colors flex items-start gap-3"
            >
              <div className={clsx("w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5", item.iconColor)}>
                <Icon size={15} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <h4 className="text-[12px] font-bold text-[#0F0F0F] truncate">
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-[#9CA3AF] shrink-0 font-medium">
                    {item.time}
                  </span>
                </div>
                <p className="text-[12px] text-[#4B5563] leading-relaxed">
                  {item.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UpdatesModal;
