import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Hexagon, GitMerge, Maximize } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export const Protocol = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.proto-card');
      
      cards.forEach((card, i) => {
        if (i === cards.length - 1) return;
        
        ScrollTrigger.create({
          trigger: card,
          start: 'top top',
          endTrigger: containerRef.current,
          end: 'bottom bottom',
          pin: true,
          pinSpacing: false
        });

        gsap.to(card, {
          scrollTrigger: {
            trigger: cards[i + 1],
            start: 'top bottom',
            end: 'top top',
            scrub: true
          },
          scale: 0.9,
          opacity: 0.3,
          filter: 'blur(10px)',
          ease: 'none'
        });
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const steps = [
    { num: "01", title: "Connect Source", desc: "Link your institutional data to our API bridge.", icon: <Hexagon className="w-16 h-16 -dark" strokeWidth={1} /> },
    { num: "02", title: "Generate Matrix", desc: "We synthesize your achievements into a hardened data block.", icon: <GitMerge className="w-16 h-16 -dark" strokeWidth={1} /> },
    { num: "03", title: "Deploy Identity", desc: "Your secure vCard is ready for global distribution.", icon: <Maximize className="w-16 h-16 -dark" strokeWidth={1} /> }
  ];

  return (
    <section ref={containerRef} id="protocol" className="w-full -dark pb-32">
      <div className="max-w-5xl mx-auto px-6 pt-32">
        <h2 className="font-sans font-bold text-4xl md:text-5xl -light mb-16 tracking-tighter">
          Execution <span className="font-drama italic -light/50">Path.</span>
        </h2>
        <div className="relative">
          {steps.map((step, i) => (
            <div key={i} className={`proto-card w-full -light rounded-[3rem] p-12 md:p-20 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-12 border -light min-h-[50vh] ${i !== 0 ? 'mt-8' : ''}`}>
              <div className="flex-1">
                <span className="font-mono -primary text-2xl mb-4 block">STEP _{step.num}</span>
                <h3 className="font-sans font-bold text-4xl md:text-6xl -dark tracking-tighter leading-none mb-6">
                  {step.title}
                </h3>
                <p className="font-mono -dark/70 text-lg max-w-sm">
                  {step.desc}
                </p>
              </div>
              <div className="w-48 h-48 rounded-full border -dark/20 flex items-center justify-center shrink-0 relative overflow-hidden -light">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(17,17,17,0.05)_1px,transparent_1px)] bg-[length:12px_12px]"></div>
                <div className="relative z-10 animate-[spin_20s_linear_infinite]">
                  {step.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};