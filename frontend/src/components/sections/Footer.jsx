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
      { label: 'Features', href: '/#features' },
      { label: 'How It Works', href: '/#protocol' },
    ],
    Company: [
      { label: 'Philosophy', href: '/#philosophy' },
      { label: 'Architecture', href: '/architecture' },
      { label: 'API Reference', href: '/api-reference' },
    ],
    Legal: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
    ],
  };

  const handleNavClick = (e, href) => {
    if (href.startsWith('/#') && window.location.pathname === '/') {
      const id = href.replace('/#', '');
      const element = document.getElementById(id);
      if (element) {
        e.preventDefault();
        window.history.pushState(null, '', href);
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (!href.startsWith('/#')) {
      window.scrollTo(0, 0);
    }
  };

  return (
    <footer className="w-full bg-dark rounded-t-[3rem] md:rounded-t-[4rem] px-6 pt-20 md:pt-24 pb-12 text-light mt-[-2rem] relative z-20">
      <div className="max-w-7xl mx-auto">
        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16 md:mb-20 pb-16 md:pb-20 border-b border-light/10">
          {/* Brand col */}
          <div className="md:col-span-2 flex flex-col h-full text-center md:text-left items-center md:items-start">
            <div className="space-y-6 mb-12 flex flex-col items-center md:items-start">
              <Link to="/" onClick={() => window.scrollTo(0, 0)} className="flex items-center gap-3 group w-fit">
                <img src="/LOGO.png" alt="EduCard Logo" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
                <span className="font-sans font-bold text-3xl md:text-4xl tracking-tighter text-light group-hover:text-primary transition-colors">
                  EduCard.
                </span>
              </Link>
              <p className="font-mono text-xs md:text-sm text-light/40 max-w-sm leading-relaxed">
                High-density, offline-first digital academic credentials. Overriding legacy resumes since 2026.
              </p>
            </div>

            {/* Credits / Branding */}
            <div className="mt-auto pt-8 border-t border-light/10 grid grid-cols-1 sm:grid-cols-2 gap-8 w-full pr-0 md:pr-4">
              {/* Ninety5 */}
              <div className="w-full flex flex-col items-center md:items-start">
                <p className="font-mono text-sm text-light/50 mb-4 uppercase tracking-widest font-bold">A Product Of</p>
                <div className="opacity-80 hover:opacity-100 transition-opacity">
                  <img src="/Ninety5.png" alt="Ninety5 Logo" className="h-12 md:h-14 w-auto object-contain" />
                </div>
              </div>
              
              {/* Developer */}
              <div className="w-full flex flex-col items-center md:items-start">
                <p className="font-mono text-sm text-light/50 mb-4 uppercase tracking-widest font-bold">Developed By</p>
                <a 
                  href="https://rayyan-x95.github.io/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-sans font-bold text-2xl lg:text-3xl text-light/90 hover:text-primary transition-colors block leading-[1.1] text-center md:text-left"
                >
                  Mohammed<br className="hidden sm:block"/>
                  <span className="sm:hidden"> </span>Rayyan
                </a>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section} className="space-y-4 font-mono text-sm text-center md:text-left mt-8 md:mt-0">
              <div className="text-primary mb-6 uppercase tracking-widest text-xs">{section}</div>
              {links.map((link) => (
                <Link 
                  key={link.label} 
                  to={link.href} 
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="block text-light/50 hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between font-mono text-[10px] md:text-xs text-light/30 gap-6 md:gap-4 mt-8 md:mt-0">
          <p className="order-2 md:order-1 text-center md:text-left">© {new Date().getFullYear()} EduCard. All rights reserved.</p>
          <div className="flex items-center gap-2 md:gap-3 order-1 md:order-2 bg-light/5 md:bg-transparent px-4 py-2 md:px-0 md:py-0 rounded-full">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-accent tracking-tighter sm:tracking-normal">
              System Operational // Latency: {latency}ms
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};