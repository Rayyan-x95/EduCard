import React from 'react';
import { Hexagon } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="w-full bg-dark rounded-t-[4rem] px-6 pt-24 pb-12 text-light mt-[-2rem] relative z-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20 border-b border-light/10 pb-20">
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <Hexagon className="h-10 w-10 text-primary" strokeWidth={1.5} />
            <span className="font-sans font-bold text-4xl tracking-tighter">EduCard.</span>
          </div>
          <p className="font-mono text-sm text-light/50 max-w-sm">
            High-density, offline-first digital credentials. Overriding legacy resumes since 2026.
          </p>
          
          <div className="pt-6 mt-6 border-t border-light/10 inline-block">
            <p className="font-mono text-[10px] text-light/40 mb-3 uppercase tracking-widest">A Product Of</p>
            {/* If ninety5.png is missing, it falls back to this SVG text version */}
            <object data="/ninety5.png" type="image/png" className="h-10 opacity-70 hover:opacity-100 transition-opacity flex items-center">
              <div className="flex items-center gap-3">
                <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 80L40 20L60 80L80 20" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" className="text-light"/>
                </svg>
                <div>
                  <div className="font-sans font-bold text-2xl tracking-tighter text-light leading-none">Ninety5</div>
                  <div className="font-mono text-[8px] tracking-[0.2em] text-light/50 mt-1">CREATE BOLD. STAY MODERN</div>
                </div>
              </div>
            </object>
          </div>
        </div>
        <div className="space-y-4 font-mono text-sm">
          <div className="text-primary mb-6 uppercase tracking-widest text-xs">Directory</div>
          <a href="#" className="block text-light/70 hover:text-primary transition-colors">Manifesto</a>
          <a href="#" className="block text-light/70 hover:text-primary transition-colors">Architecture</a>
          <a href="#" className="block text-light/70 hover:text-primary transition-colors">API Logs</a>
        </div>
        <div className="space-y-4 font-mono text-sm">
          <div className="text-primary mb-6 uppercase tracking-widest text-xs">Legal</div>
          <a href="#" className="block text-light/70 hover:text-primary transition-colors">Terms of Service</a>
          <a href="#" className="block text-light/70 hover:text-primary transition-colors">Privacy Shield</a>
        </div>
      </div>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between font-mono text-xs text-light/40">
        <p>&copy; {new Date().getFullYear()} EduCard. All rights reserved.</p>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
          <span className="text-accent">System Operational // Latency: 12ms</span>
        </div>
      </div>
    </footer>
  );
};