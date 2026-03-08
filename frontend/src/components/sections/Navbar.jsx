import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const Navbar = () => {
  const navRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        start: 'top -50',
        onUpdate: (self) => {
          if (self.progress > 0) {
            gsap.to(navRef.current, {
              backgroundColor: 'rgba(245, 243, 238, 0.7)',
              backdropFilter: 'blur(16px)',
              color: '#111111',
              border: '1px solid rgba(17,17,17,0.1)',
              duration: 0.3,
            });
          } else {
            gsap.to(navRef.current, {
              backgroundColor: 'transparent',
              backdropFilter: 'blur(0px)',
              color: '#F5F3EE',
              border: '1px solid transparent',
              duration: 0.3,
            });
          }
        },
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav
        ref={navRef}
        className="pointer-events-auto flex items-center justify-between px-6 py-3 rounded-full w-full max-w-4xl text-[#F5F3EE] transition-colors"
      >
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="EduCard Logo" className="h-8 w-8 object-contain" />
          <span className="font-sans font-bold text-xl tracking-tighter">EduCard.</span>
        </div>
        <div className="hidden md:flex gap-8 font-mono text-sm tracking-tight opacity-70">
          <a href="#features" className="hover:-translate-y-[1px] transition-transform">Features</a>
          <a href="#philosophy" className="hover:-translate-y-[1px] transition-transform">Philosophy</a>
          <a href="#protocol" className="hover:-translate-y-[1px] transition-transform">Protocol</a>
        </div>
        <button className="magnetic-btn bg-[#E63B2E] text-[#F5F3EE] px-5 py-2 rounded-full font-mono text-xs font-bold overflow-hidden relative group">
          <span className="relative z-10">Access Terminal</span>
          <div className="absolute inset-0 bg-black/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        </button>
      </nav>
    </div>
  );
};
