import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';
import { Hexagon } from 'lucide-react';

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
              backgroundColor: 'rgba(243, 244, 246, 0.8)',
              backdropFilter: 'blur(16px)',
              color: '#0F172A',
              border: '1px solid rgba(15, 23, 42, 0.1)',
              duration: 0.3,
            });
          } else {
            gsap.to(navRef.current, {
              backgroundColor: 'transparent',
              backdropFilter: 'blur(0px)',
              color: '#F3F4F6',
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
        className="pointer-events-auto flex items-center justify-between px-6 py-3 rounded-full w-full max-w-4xl text-light transition-colors"
      >
        <div className="flex items-center gap-2">
          <Hexagon className="h-8 w-8 text-primary" strokeWidth={1.5} />
          <span className="font-sans font-bold text-xl tracking-tighter">EduCard.</span>
        </div>
        <div className="hidden md:flex gap-8 font-mono text-sm tracking-tight opacity-70">
          <a href="#features" className="hover:-translate-y-[1px] transition-transform">Features</a>
          <a href="#philosophy" className="hover:-translate-y-[1px] transition-transform">Philosophy</a>
          <a href="#protocol" className="hover:-translate-y-[1px] transition-transform">Protocol</a>
        </div>
        <Link to="/generate" className="magnetic-btn -primary -light px-5 py-2 rounded-full font-mono text-xs font-bold overflow-hidden relative group">
          <span className="relative z-10">Access Terminal</span>
          <div className="absolute inset-0 bg-black/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        </Link>
      </nav>
    </div>
  );
};
