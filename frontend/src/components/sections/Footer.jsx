import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  // Animated latency counter
  const [latency, setLatency] = useState(12);
  useEffect(() => {
    const int = setInterval(() => {
      setLatency(Math.floor(Math.random() * 8) + 8); // 8–15ms
    }, 2000);
    return () => clearInterval(int);
  }, []);

  const footerLinks = {
    Product: [
      { label: 'Launch App', href: '/generate' },
      { label: 'Features', href: '#features' },
      { label: 'How It Works', href: '#protocol' },
    ],
    Company: [
      { label: 'Philosophy', href: '#philosophy' },
      { label: 'Architecture', href: '#' },
      { label: 'API Reference', href: '#' },
    ],
    Legal: [
      { label: 'Terms of Service', href: '#' },
      { label: 'Privacy Policy', href: '#' },
    ],
  };

  return (
    <footer className="w-full bg-dark rounded-t-[4rem] px-6 pt-24 pb-12 text-light mt-[-2rem] relative z-20">
      <div className="max-w-7xl mx-auto">
        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-20 pb-20 border-b border-light/10">
          {/* Brand col */}
          <div className="md:col-span-2 space-y-6">
            <Link to="/" className="flex items-center gap-3 group w-fit">
              <img src="/LOGO.png" alt="EduCard Logo" className="w-10 h-10 object-contain" />
              <span className="font-sans font-bold text-4xl tracking-tighter text-light group-hover:text-primary transition-colors">
                EduCard.
              </span>
            </Link>
            <p className="font-mono text-sm text-light/40 max-w-xs leading-relaxed">
              High-density, offline-first digital academic credentials. Overriding legacy resumes since 2026.
            </p>

            {/* Ninety5 branding */}
            <div className="pt-6 mt-6 border-t border-light/10">
              <p className="font-mono text-[10px] text-light/30 mb-3 uppercase tracking-widest">A Product Of</p>
              <div className="opacity-60 hover:opacity-100 transition-opacity">
                <img src="/Ninety5.png" alt="Ninety5 Logo" className="h-8 w-auto object-contain" />
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section} className="space-y-4 font-mono text-sm">
              <div className="text-primary mb-6 uppercase tracking-widest text-xs">{section}</div>
              {links.map((link) => (
                link.href.startsWith('/')
                  ? <Link key={link.label} to={link.href} className="block text-light/50 hover:text-primary transition-colors">{link.label}</Link>
                  : <a key={link.label} href={link.href} className="block text-light/50 hover:text-primary transition-colors">{link.label}</a>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between font-mono text-xs text-light/30 gap-4">
          <p>© {new Date().getFullYear()} EduCard. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-accent">
              System Operational // Latency: {latency}ms
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};