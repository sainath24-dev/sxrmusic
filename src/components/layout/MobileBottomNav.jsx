import React from 'react';
import { Home, Compass, Radio, Bookmark, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';

const MobileBottomNav = () => {
  const location = useLocation();
  
  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Discover', path: '/discover', icon: Compass },
    { name: 'Radio', path: '/languages', icon: Radio },
    { name: 'Library', path: '/library', icon: Bookmark },
    { name: 'Stats', path: '/stats', icon: Settings },
  ];

  return (
    <div className="lg:hidden fixed bottom-3 left-0 right-0 z-[900] flex justify-center px-4 pointer-events-none select-none">
      <nav className="pointer-events-auto w-full max-w-[340px] h-[58px] bg-[#FFFFFF]/92 backdrop-blur-2xl border border-[#E5E7EB] rounded-full shadow-[0_12px_36px_rgba(0,0,0,0.12)] flex items-center justify-between px-2">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
          
          return (
            <Link 
              key={link.name} 
              to={link.path} 
              className="flex items-center justify-center relative"
              title={link.name}
            >
              <div className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                isActive 
                  ? "bg-[#C8F142] text-black shadow-md shadow-[#C8F142]/40 scale-105" 
                  : "text-[#6B7280] hover:text-[#0F0F0F] hover:bg-[#F3F4F6]"
              )}>
                <link.icon size={19} strokeWidth={isActive ? 2.3 : 1.8} />
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileBottomNav;


