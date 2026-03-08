import React, { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Hero = () => {
  const container = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-elem', {
        y: 60,
        opacity: 0,
        duration: 1.2,
        stagger: 0.12,
        ease: 'power3.out',
        delay: 0.3,
      });
    }, container);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={container} className="relative w-full h-[100dvh] flex flex-col justify-end overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop"
          alt="University campus"
          loading="lazy"
          className="w-full h-full object-cover opacity-60 grayscale-[0.3]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/60 to-dark/10" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-24 md:pb-32">
        <div className="max-w-4xl text-light">
          <p className="hero-elem font-mono text-primary mb-6 uppercase tracking-widest text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary inline-block animate-pulse" />
            System Online // EduCard
          </p>
          <h1 className="hero-elem font-sans font-bold text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tighter text-light pb-2">
            Program the
            <br />
            <span className="font-drama italic font-normal text-7xl md:text-9xl lg:text-[10rem] block -mt-4 text-light">
              Identity.
            </span>
          </h1>
          <p className="hero-elem font-sans text-lg md:text-xl text-light/70 max-w-xl mt-8 mb-12 leading-relaxed">
            Generate premium, verifiable digital academic profiles with instant vCard QR codes — ready to share, print, or tap.
          </p>
          <div className="hero-elem flex flex-col sm:flex-row gap-4">
            <Link
              to="/generate"
              className="bg-primary text-white px-8 py-4 rounded-full font-mono text-sm font-bold inline-flex items-center gap-2 group hover:bg-blue-700 transition-colors"
            >
              Launch App
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#features"
              className="border border-light/30 text-light px-8 py-4 rounded-full font-mono text-sm font-bold inline-flex items-center gap-2 hover:border-light/70 hover:bg-light/5 transition-all"
            >
              See How It Works
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};