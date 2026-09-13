import React from 'react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';

const Logo = ({ className = "" }) => {
  return (
    <Link to="/" className={clsx("flex items-center gap-2.5 select-none group cursor-pointer", className)}>
      <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#FFFFFF] border border-[#E5E7EB] flex items-center justify-center shadow-sm shrink-0 transition-transform duration-200 group-hover:scale-105">
        <img 
          src="/logo.png" 
          alt="SxR-Music" 
          className="w-full h-full object-cover" 
        />
      </div>
      <div className="flex items-center gap-1 leading-none">
        <span className="font-extrabold text-[17px] text-[#0F0F0F] tracking-tight">
          SxR<span className="text-[#337418]">-Music</span>
        </span>
      </div>
    </Link>
  );
};

export default Logo;
