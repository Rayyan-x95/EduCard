import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const Philosophy = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.phil-word', {
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 65%',
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.04,
        ease: 'power3.out',
      });

      gsap.to('.phil-bg', {
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
        y: 80,
        ease: 'none',
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const problem = 'Most academic networking relies on fragmented records and forgettable resumes.'.split(' ');
  const solution1 = 'We focus on:'.split(' ');
  const solution2 = 'verifiable digital trust.'.split(' ');

  return (
    <section
      ref={containerRef}
      id="philosophy"
      className="relative w-full py-24 md:py-40 bg-dark text-light overflow-hidden px-4 md:px-6"
    >
      {/* Background texture — on-brand academic setting */}
      <img
        src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop"
        alt="University lecture hall"
        loading="lazy"
        className="phil-bg absolute top-[-20%] left-0 w-full h-[140%] object-cover opacity-[0.07] grayscale mix-blend-screen pointer-events-none"
      />

      <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-12 lg:gap-16">
        <div className="flex-1 w-full text-center md:text-left">
          <p className="font-mono text-xs text-primary uppercase tracking-widest mb-6 lg:mb-10">
            — Our Thesis
          </p>
          <p className="font-mono text-sm tracking-wide text-light/50 mb-8 lg:mb-12 leading-relaxed">
            {problem.map((word, i) => (
              <span key={i} className="phil-word inline-block mr-2">{word}</span>
            ))}
          </p>
          <h2 className="font-sans font-bold text-5xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tighter text-light">
            {solution1.map((word, i) => (
              <span key={`w1-${i}`} className="phil-word inline-block mr-2 lg:mr-4">{word}</span>
            ))}
            <br className="md:hidden" />
            <span className="font-drama italic text-primary text-5xl md:text-7xl lg:text-8xl font-normal block mt-1 lg:mt-4">
              {solution2.map((word, i) => (
                <span key={`w2-${i}`} className="phil-word inline-block mr-2 lg:mr-4">{word}</span>
              ))}
            </span>
          </h2>
        </div>
        
        <div className="flex-1 w-full relative group mt-8 md:mt-0">
          <div className="absolute inset-0 bg-primary/20 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <img 
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop" 
            alt="Students collaborating and networking digitally" 
            className="relative z-10 w-full h-[300px] sm:h-[400px] lg:h-[600px] object-cover rounded-3xl border border-light/10 shadow-2xl grayscale hover:grayscale-0 transition-all duration-700 transform group-hover:-translate-y-2"
          />
        </div>
      </div>
    </section>
  );
};