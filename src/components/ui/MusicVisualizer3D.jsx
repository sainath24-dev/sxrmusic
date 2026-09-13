import React from 'react';

const MusicVisualizer3D = ({ isPlaying = true }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#F9FAFB] to-[#F3F4F6] p-8 rounded-2xl border border-[#E5E7EB]">
      <div className="flex items-end gap-2 h-28">
        {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50, 80, 65, 90, 45, 70, 85].map((height, i) => (
          <div
            key={i}
            className="w-2 rounded-full bg-[#5DD62C] transition-all duration-300 shadow-sm shadow-[#5DD62C]/40"
            style={{
              height: isPlaying ? `${height}%` : '15%',
              animation: isPlaying ? `pulse ${0.6 + (i % 5) * 0.2}s ease-in-out infinite alternate` : 'none',
              animationDelay: `${i * 0.08}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default MusicVisualizer3D;
