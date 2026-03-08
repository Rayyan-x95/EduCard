import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export const Navbar = () => {
  const navRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        start: 'top -50',
        onUpdate: (self) => {
          setScrolled(self.progress > 0);
        },
      });
    });
    return () => ctx.revert();
  }, []);

  const navLinks = [
    { label: 'Features', href: '/#features' },
    { label: 'Philosophy', href: '/#philosophy' },
    { label: 'Protocol', href: '/#protocol' },
  ];

  const handleNavClick = (e, href) => {
    if (href.startsWith('/#')) {
      const id = href.replace('/#', '');
      const element = document.getElementById(id);
      if (element) {
        e.preventDefault();
        window.history.pushState(null, '', href);
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <div className="fixed top-4 md:top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <nav
          ref={navRef}
          className={`pointer-events-auto flex items-center justify-between px-4 md:px-6 py-2 md:py-3 rounded-full w-full max-w-4xl transition-all duration-300 ${
            scrolled
              ? 'bg-light/80 backdrop-blur-lg text-dark border border-dark/10 shadow-lg'
              : 'bg-transparent text-light border border-transparent'
          }`}
        >
          <div className="flex items-center gap-2">
            <Link to="/" onClick={() => window.scrollTo(0, 0)} className="flex items-center gap-2">
              <img src="/LOGO.png" alt="EduCard Logo" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
              <span className={`font-sans font-bold text-lg md:text-xl tracking-tighter ${scrolled ? 'text-dark' : 'text-light'}`}>
                EduCard.
              </span>
            </Link>
          </div>

          {/* Desktop links */}
          <div className={`hidden md:flex gap-8 font-mono text-sm tracking-tight opacity-70`}>
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="hover:-translate-y-[1px] transition-transform"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/generate"
              className="hidden md:inline-flex bg-primary text-white px-5 py-2 rounded-full font-mono text-xs font-bold hover:bg-blue-700 transition-colors"
            >
              Launch App
            </Link>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-full border border-current opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-dark/95 backdrop-blur-xl flex flex-col items-center justify-center gap-10 md:hidden">
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute top-8 right-8 p-2 text-light/50 hover:text-light transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              onClick={(e) => {
                setMenuOpen(false);
                handleNavClick(e, link.href);
              }}
              className="font-mono text-2xl text-light/70 hover:text-primary transition-colors tracking-widest uppercase"
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/generate"
            onClick={() => setMenuOpen(false)}
            className="bg-primary text-white px-10 py-4 rounded-full font-mono text-sm font-bold hover:bg-blue-700 transition-colors mt-4"
          >
            Launch App
          </Link>
        </div>
      )}
    </>
  );
};
