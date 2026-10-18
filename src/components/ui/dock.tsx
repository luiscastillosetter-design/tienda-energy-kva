'use client';
import React from 'react';

export function Dock({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`flex items-end justify-center gap-2 md:gap-4 p-2 ${className || ''}`}>
      {children}
    </div>
  );
}

export function DockItem({ className, onClick, children }: { className?: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <div 
      onClick={onClick} 
      className={`group relative flex flex-col items-center justify-end cursor-pointer transition-all duration-300 ease-out hover:-translate-y-3 hover:scale-125 hover:mx-2 md:hover:mx-3 ${className || ''}`}
    >
      {children}
    </div>
  );
}

export function DockIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center w-10 h-10 md:w-14 md:h-14 rounded-full p-2 md:p-3">
      {children}
    </div>
  );
}

export function DockLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50 ${className || ''}`}>
      {children}
    </span>
  );
}