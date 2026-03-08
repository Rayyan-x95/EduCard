import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Zap, Download, QrCode } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export const Features = () => {
  // Card 1: vCard step shuffler
  const [shuffleItems, setShuffleItems] = useState([
    { id: 1, label: 'Scan QR Signal' },
    { id: 2, label: 'Parse Contact Matrix' },
    { id: 3, label: 'Save to Native Contacts' },
  ]);

  useEffect(() => {
    const int = setInterval(() => {
      setShuffleItems((prev) => {
        const next = [...prev];
        const last = next.pop();
        next.unshift(last);
        return next;
      });
    }, 2500);
    return () => clearInterval(int);
  }, []);

  // Card 2: Typewriter terminal
  const textToType =
    'Validating academic credentials...\nBridging fragmented records...\nStatus: UNIFIED & VERIFIED.';
  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    let currentText = '';
    let i = 0;
    const typeInt = setInterval(() => {
      if (i < textToType.length) {
        currentText += textToType.charAt(i);
        setTypedText(currentText);
        i++;
      } else {
        setTimeout(() => {
          i = 0;
          currentText = '';
          setTypedText('');
        }, 2500);
      }
    }, 45);
    return () => clearInterval(typeInt);
  }, []);

  // Card 3: QR code mockup fields
  const fields = ['Joe Smith', 'CS Engineering', 'IIT Delhi', 'smith@iit.ac.in'];
  const [activeField, setActiveField] = useState(0);
  useEffect(() => {
    const int = setInterval(() => {
      setActiveField((p) => (p + 1) % fields.length);
    }, 1800);
    return () => clearInterval(int);
  }, []);

  // Scroll-in animation for section
  const sectionRef = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.feature-card', {
        scrollTrigger: { trigger: sectionRef.current, start: 'top 70%' },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="features" ref={sectionRef} className="w-full py-32 bg-light relative z-10 px-6">
      <div className="max-w-7xl mx-auto">
        <p className="font-mono text-xs text-primary uppercase tracking-widest mb-4">
          — Core Systems
        </p>
        <h2 className="font-sans font-bold text-4xl md:text-5xl tracking-tighter mb-16 text-dark">
          Functional{' '}
          <span className="font-drama italic text-primary">Subsystems.</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1 — Instant Networking */}
          <div className="feature-card bg-white rounded-[2rem] p-8 border border-dark/5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] h-96 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-sans font-bold text-xl text-dark">Instant Networking</h3>
              <p className="font-mono text-xs text-dark/50 mt-2">The vCard Engine</p>
            </div>
            <div className="relative w-full h-44 flex items-center justify-center">
              {shuffleItems.map((item, index) => (
                <div
                  key={item.id}
                  className="absolute w-4/5 bg-white p-4 rounded-xl border border-dark/10 flex items-center gap-3 shadow-sm transition-all duration-700"
                  style={{
                    transform: `translateY(${index * 18}px) scale(${1 - index * 0.05})`,
                    opacity: 1 - index * 0.25,
                    zIndex: 3 - index,
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-dark flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-mono text-sm text-dark">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2 — Verified Trust (dark) */}
          <div className="feature-card bg-dark rounded-[2rem] p-8 flex flex-col justify-between h-96">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="font-mono text-xs text-accent uppercase tracking-widest">Live Feed</span>
              </div>
              <h3 className="font-sans font-bold text-xl text-light">Verified Trust</h3>
              <p className="font-mono text-xs text-light/50 mt-2">Academic snapshot processing</p>
            </div>

            <div className="bg-[#1a2235] rounded-xl p-4 h-40 border border-white/10 overflow-hidden">
              <pre className="font-mono text-xs text-accent whitespace-pre-wrap leading-relaxed">
                <code className="text-light/30">{'> '}</code>
                {typedText}
                <span className="inline-block w-[7px] bg-primary h-3 ml-1 animate-pulse" />
              </pre>
            </div>
          </div>

          {/* Card 3 — vCard Preview */}
          <div className="feature-card bg-white rounded-[2rem] p-8 border border-dark/5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] h-96 flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <QrCode className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-sans font-bold text-xl text-dark">Premium Identity</h3>
              <p className="font-mono text-xs text-dark/50 mt-2">Your credential, encoded</p>
            </div>

            <div className="w-full bg-light rounded-xl border border-dark/10 p-4 space-y-2">
              {fields.map((f, i) => (
                <div
                  key={f}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all duration-500 ${
                    i === activeField
                      ? 'bg-primary text-white'
                      : 'bg-dark/5 text-dark/60'
                  }`}
                >
                  {f}
                </div>
              ))}
              <div className="flex items-center justify-end pt-1 gap-2">
                <Download className="w-3 h-3 text-primary" />
                <span className="font-mono text-[10px] text-primary">Export vCard</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};