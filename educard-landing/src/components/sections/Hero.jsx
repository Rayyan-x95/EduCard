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
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.2
      });
    }, container);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={container} className="relative w-full h-[100dvh] flex flex-col justify-end -dark overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop" 
          alt="Brutalist Architecture" 
          className="w-full h-full object-cover opacity-50 mix-blend-luminosity grayscale-[0.5]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/70 to-transparent"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-24 md:pb-32">
        <div className="max-w-4xl -light">
          <p className="hero-elem font-mono -primary mb-6 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full -primary inline-block animate-pulse"></span>
            System Online // EduCard
          </p>
          <h1 className="hero-elem font-sans font-bold text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tighter mix-blend-difference pb-2">
            Program the<br/>
            <span className="font-drama italic font-normal text-7xl md:text-9xl lg:text-[11rem] block -mt-4 mix-blend-normal -light">Identity.</span>
          </h1>
          <p className="hero-elem font-sans text-lg md:text-xl -light/70 max-w-xl mt-8 mb-12">
            To programmatically generate premium, verifiable digital academic profiles equipped with instant-save vCard QR codes for seamless networking.
          </p>
          <Link to="/generate" className="hero-elem magnetic-btn -primary -light px-8 py-4 rounded-full font-mono text-sm inline-flex items-center gap-2 group">
            Initialize Profile
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};