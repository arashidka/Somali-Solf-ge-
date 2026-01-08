
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-somali-blue/20 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-somali-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-somali-blue/20">
            {/* Somali Star Inspired Logo */}
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none">Somali Solfège</h1>
            <p className="text-[10px] text-somali-blue font-bold tracking-[0.2em] uppercase mt-1">Musicology Engine</p>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
          <a href="#" className="hover:text-somali-blue transition-colors">Archive</a>
          <a href="#" className="hover:text-somali-blue transition-colors">Instruments</a>
          <div className="flex items-center px-3 py-1 bg-somali-light text-somali-blue rounded-full border border-somali-blue/10">
            <span className="w-2 h-2 bg-somali-blue rounded-full mr-2 animate-pulse"></span>
            <span>AI Online</span>
          </div>
        </div>
      </div>
    </header>
  );
};
