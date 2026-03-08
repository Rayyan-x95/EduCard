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
          start: 'top 60%',
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.05,
        ease: 'power3.out'
      });
      
      gsap.to('.phil-bg', {
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        },
        y: 100,
        ease: 'none'
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} id="philosophy" className="relative w-full py-40 -dark -light overflow-hidden px-6">
      <img 
        src="https://images.unsplash.com/photo-1518002171953-a080ee817e1f?q=80&w=2070&auto=format&fit=crop" 
        alt="Texture" 
        className="phil-bg absolute top-[-20%] left-0 w-full h-[140%] object-cover opacity-10 grayscale mix-blend-screen pointer-events-none" 
      />
      <div className="max-w-4xl mx-auto relative z-10">
        <p className="font-mono text-sm tracking-widest -light/60 mb-12 uppercase">
          { "Most academic networking focuses on: fragmented records and flat resumes.".split(' ').map((word, i) => (
             <span key={i} className="phil-word inline-block mr-2">{word}</span>
          )) }
        </p>
        <h2 className="font-sans font-bold text-5xl md:text-7xl lg:text-8xl leading-tight tracking-tighter">
          { "We ".split(' ').map((word, i) => <span key={`w1-${i}`} className="phil-word inline-block mr-4">{word}</span>) }
          { "focus ".split(' ').map((word, i) => <span key={`w2-${i}`} className="phil-word inline-block mr-4">{word}</span>) }
          { "on: ".split(' ').map((word, i) => <span key={`w3-${i}`} className="phil-word inline-block mr-4">{word}</span>) }<br/>
          <span className="font-drama italic -primary text-7xl md:text-8xl lg:text-9xl font-normal block mt-4">
            { "verifiable ".split(' ').map((word, i) => <span key={`w4-${i}`} className="phil-word inline-block mr-4">{word}</span>) }
            { "digital ".split(' ').map((word, i) => <span key={`w5-${i}`} className="phil-word inline-block mr-4">{word}</span>) }
            { "trust.".split(' ').map((word, i) => <span key={`w6-${i}`} className="phil-word inline-block mr-4">{word}</span>) }
          </span>
        </h2>
      </div>
    </section>
  );
};