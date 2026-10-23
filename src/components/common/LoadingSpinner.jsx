import React from 'react';
import { GraduationCap } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading Campus AI...' }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50/70 backdrop-blur-xs p-6 select-none transition-all">
      <div className="relative flex items-center justify-center">
        {/* Ambient Glow */}
        <div className="absolute w-20 h-20 bg-indigo-500/15 rounded-full blur-xl animate-pulse" />

        {/* Outer Spinning Dual Ring */}
        <div className="w-16 h-16 rounded-full border-[3px] border-indigo-100 border-t-indigo-600 border-r-indigo-500 animate-spin" />

        {/* Center Icon */}
        <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
          <GraduationCap size={24} className="animate-bounce" />
        </div>
      </div>

      <div className="mt-5 text-center">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">{message}</h3>
        <p className="text-[11px] font-medium text-slate-400 mt-1">Please wait while components are loaded</p>
      </div>
    </div>
  );
}
