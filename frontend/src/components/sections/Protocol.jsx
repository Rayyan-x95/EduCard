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
          pinSpacing: false,
        });

        gsap.to(card, {
          scrollTrigger: {
            trigger: cards[i + 1],
            start: 'top bottom',
            end: 'top top',
            scrub: true,
          },
          scale: 0.92,
          opacity: 0.4,
          filter: 'blur(6px)',
          ease: 'none',
        });
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const steps = [
    {
      num: '01',
      title: 'Connect Source',
      desc: 'Fill in your academic profile — university, major, email, and portfolio.',
      icon: <Hexagon className="w-16 h-16 text-dark" strokeWidth={1} />,
    },
    {
      num: '02',
      title: 'Generate Matrix',
      desc: 'Our API synthesises your data into a cryptographic vCard data block.',
      icon: <GitMerge className="w-16 h-16 text-dark" strokeWidth={1} />,
    },
    {
      num: '03',
      title: 'Deploy Identity',
      desc: 'Download your QR code. Share it digitally, print it, or embed it anywhere.',
      icon: <Maximize className="w-16 h-16 text-dark" strokeWidth={1} />,
    },
  ];

  return (
    <section ref={containerRef} id="protocol" className="w-full bg-dark pb-32">
      <div className="max-w-5xl mx-auto px-6 pt-32">
        <p className="font-mono text-xs text-primary uppercase tracking-widest mb-4">
          — How It Works
        </p>
        <h2 className="font-sans font-bold text-4xl md:text-5xl text-light mb-16 tracking-tighter">
          Execution{' '}
          <span className="font-drama italic text-light/40">Path.</span>
        </h2>
        <div className="relative">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`proto-card w-full bg-light rounded-[3rem] p-12 md:p-20 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-12 min-h-[50vh] ${
                i !== 0 ? 'mt-8' : ''
              }`}
            >
              <div className="flex-1">
                <span className="font-mono text-primary text-xl mb-4 block">
                  STEP _{step.num}
                </span>
                <h3 className="font-sans font-bold text-4xl md:text-6xl text-dark tracking-tighter leading-none mb-6">
                  {step.title}
                </h3>
                <p className="font-mono text-dark/60 text-base max-w-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>
              <div className="w-40 h-40 md:w-48 md:h-48 rounded-full border-2 border-dark/15 flex items-center justify-center shrink-0 relative overflow-hidden bg-light">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(17,17,17,0.04)_1px,transparent_1px)] bg-[length:12px_12px]" />
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