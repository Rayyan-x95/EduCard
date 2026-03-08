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
      className="relative w-full py-40 bg-dark text-light overflow-hidden px-6"
    >
      {/* Background texture — on-brand academic setting */}
      <img
        src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop"
        alt="University lecture hall"
        loading="lazy"
        className="phil-bg absolute top-[-20%] left-0 w-full h-[140%] object-cover opacity-[0.07] grayscale mix-blend-screen pointer-events-none"
      />

      <div className="max-w-4xl mx-auto relative z-10">
        <p className="font-mono text-xs text-primary uppercase tracking-widest mb-10">
          — Our Thesis
        </p>
        <p className="font-mono text-sm tracking-wide text-light/50 mb-12 leading-relaxed">
          {problem.map((word, i) => (
            <span key={i} className="phil-word inline-block mr-2">{word}</span>
          ))}
        </p>
        <h2 className="font-sans font-bold text-5xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tighter text-light">
          {solution1.map((word, i) => (
            <span key={`w1-${i}`} className="phil-word inline-block mr-4">{word}</span>
          ))}
          <br />
          <span className="font-drama italic text-primary text-6xl md:text-7xl lg:text-8xl font-normal block mt-4">
            {solution2.map((word, i) => (
              <span key={`w2-${i}`} className="phil-word inline-block mr-4">{word}</span>
            ))}
          </span>
        </h2>
      </div>
    </section>
  );
};