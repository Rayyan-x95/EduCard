const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'educard-landing', 'src');

const files = {
  'components/sections/Navbar.jsx': import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

export const Navbar = () => {
  const navRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        start: 'top -50',
        onUpdate: (self) => {
          if (self.progress > 0) {
            gsap.to(navRef.current, {
              backgroundColor: 'rgba(243, 244, 246, 0.8)',
              backdropFilter: 'blur(16px)',
              color: '#0F172A',
              border: '1px solid rgba(15, 23, 42, 0.1)',
              duration: 0.3,
            });
          } else {
            gsap.to(navRef.current, {
              backgroundColor: 'transparent',
              backdropFilter: 'blur(0px)',
              color: '#F3F4F6',
              border: '1px solid transparent',
              duration: 0.3,
            });
          }
        },
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav ref={navRef} className="pointer-events-auto flex items-center justify-between px-6 py-3 rounded-full w-full max-w-4xl text-light transition-colors">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="EduCard Logo" className="h-8 w-8 object-contain" />
          <span className="font-sans font-bold text-xl tracking-tighter">EduCard.</span>
        </div>
        <div className="hidden md:flex gap-8 font-mono text-sm tracking-tight opacity-70">
          <a href="#features" className="hover:-translate-y-[1px] transition-transform">Features</a>
          <a href="#philosophy" className="hover:-translate-y-[1px] transition-transform">Philosophy</a>
          <a href="#protocol" className="hover:-translate-y-[1px] transition-transform">Protocol</a>
        </div>
        <Link to="/generate" className="btn-primary px-5 py-2 text-xs">
          Access Terminal
        </Link>
      </nav>
    </div>
  );
};,

  'components/sections/Hero.jsx': import React, { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Hero = () => {
  const container = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-elem', { y: 60, opacity: 0, duration: 1.2, stagger: 0.1, ease: 'power3.out', delay: 0.2 });
    }, container);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={container} className="relative w-full h-[100dvh] flex flex-col justify-end bg-dark overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop" alt="Brutalist Architecture" className="w-full h-full object-cover opacity-30 mix-blend-luminosity grayscale-[0.5]"/>
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/80 to-transparent"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-24 md:pb-32">
        <div className="max-w-4xl text-light">
          <p className="hero-elem font-mono text-accent mb-6 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent inline-block animate-pulse"></span>
            System Online // EduCard
          </p>
          <h1 className="hero-elem font-sans font-bold text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tighter pb-2 text-light">
            Program the<br/>
            <span className="font-drama italic font-normal text-7xl md:text-9xl lg:text-[11rem] block -mt-4 text-primary">Identity.</span>
          </h1>
          <p className="hero-elem font-sans text-lg md:text-xl text-light/70 max-w-xl mt-8 mb-12">
            To programmatically generate premium, verifiable digital academic profiles equipped with instant-save vCard QR codes for seamless networking.
          </p>
          <Link to="/generate" className="hero-elem btn-primary group">
            Initialize Profile
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};,

  'components/sections/Features.jsx': import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Zap, MousePointer2 } from 'lucide-react';

export const Features = () => {
  const [shuffleItems, setShuffleItems] = useState([
    { id: 1, label: "Scan QR Signal" },
    { id: 2, label: "Parse Contact Matrix" },
    { id: 3, label: "Save to Native Contacts" }
  ]);
  
  useEffect(() => {
    const int = setInterval(() => {
      setShuffleItems(prev => { const next = [...prev]; const last = next.pop(); next.unshift(last); return next; });
    }, 3000);
    return () => clearInterval(int);
  }, []);

  const textToType = "Validating academic credentials...\\nBridging fragmented records...\\nStatus: UNIFIED & VERIFIED.";
  const [typedText, setTypedText] = useState("");
  
  useEffect(() => {
    let currentText = ""; let i = 0;
    const typeInt = setInterval(() => {
      if (i < textToType.length) { currentText += textToType.charAt(i); setTypedText(currentText); i++; } 
      else { setTimeout(() => { i = 0; currentText = ""; }, 2000); }
    }, 50);
    return () => clearInterval(typeInt);
  }, []);

  const cursorRef = useRef(null);
  const [clicked, setClicked] = useState(false);
  
  useEffect(() => {
    const curCtx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
      tl.set(cursorRef.current, { x: 0, y: 0, opacity: 0 }).to(cursorRef.current, { opacity: 1, duration: 0.3 }).to(cursorRef.current, { x: 40, y: 40, duration: 1, ease: "power2.inOut" }).to(cursorRef.current, { scale: 0.8, duration: 0.1 }).call(() => setClicked(true)).to(cursorRef.current, { scale: 1, duration: 0.1 }).to(cursorRef.current, { x: 120, y: 70, duration: 0.8, ease: "power2.inOut", delay: 0.2 }).to(cursorRef.current, { scale: 0.8, duration: 0.1 }).to(cursorRef.current, { scale: 1, duration: 0.1 }).to(cursorRef.current, { opacity: 0, duration: 0.3 }).call(() => setClicked(false));
    });
    return () => curCtx.revert();
  }, []);

  return (
    <section id="features" className="w-full py-32 bg-light relative z-10 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-sans font-bold text-4xl md:text-5xl tracking-tighter mb-16 text-dark">
          Functional <span className="font-drama italic text-primary">Subsystems.</span>
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-[2rem] p-8 border border-dark/5 shadow-lg h-96 flex flex-col justify-between">
            <div>
              <h3 className="font-sans font-bold text-xl text-dark">Instant Networking</h3>
              <p className="font-mono text-xs text-dark/60 mt-2">The vCard Engine</p>
            </div>
            <div className="relative w-full h-48 flex items-center justify-center">
              {shuffleItems.map((item, index) => (
                <div key={item.id} className="absolute w-4/5 bg-light p-4 rounded-xl border border-dark/10 flex items-center gap-3 shadow-sm transition-all duration-[0.8s]" style={{ transform: \	ranslateY(\px) scale(\)\, opacity: 1 - index * 0.2, zIndex: 3 - index }}>
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-mono text-sm text-dark">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-dark rounded-[2rem] p-8 shrink-0 flex flex-col justify-between h-96">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                <span className="font-mono text-xs text-accent uppercase">Live Feed</span>
              </div>
              <h3 className="font-sans font-bold text-xl text-light">Verified Trust</h3>
              <p className="font-mono text-xs text-light/60 mt-2">Academic snapshot processing</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 h-40 border border-slate-700 overflow-hidden">
              <pre className="font-mono text-xs text-accent whitespace-pre-wrap leading-relaxed">
                <code className="text-light/50">{'> '}</code>{typedText}<span className="inline-block w-2 bg-primary h-3 ml-1 animate-pulse"></span>
              </pre>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-dark/5 shadow-lg h-96 flex flex-col justify-between relative overflow-hidden">
            <div>
              <h3 className="font-sans font-bold text-xl text-dark">Premium Identity</h3>
              <p className="font-mono text-xs text-dark/60 mt-2">Design as a differentiator</p>
            </div>
            <div className="w-full bg-light rounded-xl h-40 mt-4 border border-dark/10 p-4 relative">
              <div className="grid grid-cols-7 gap-1 h-3/4">
                {["S","M","T","W","T","F","S"].map((d, i) => (
                  <div key={i} className="flex flex-col gap-1 items-center">
                    <span className="font-mono text-[10px] text-dark/40">{d}</span>
                    <div className={\w-8 h-8 rounded-md transition-colors duration-300 \\} />
                  </div>
                ))}
              </div>
              <div className="absolute bottom-2 right-2 bg-dark text-light px-3 py-1 rounded text-[10px] font-mono">Deploy Site</div>
              <MousePointer2 ref={cursorRef} className="absolute top-0 left-0 w-6 h-6 text-dark drop-shadow-md z-20" fill="white" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};,

  'components/sections/Philosophy.jsx': import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const Philosophy = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.phil-word', { scrollTrigger: { trigger: containerRef.current, start: 'top 60%', }, y: 40, opacity: 0, duration: 0.8, stagger: 0.05, ease: 'power3.out' });
      gsap.to('.phil-bg', { scrollTrigger: { trigger: containerRef.current, start: 'top bottom', end: 'bottom top', scrub: true }, y: 100, ease: 'none' });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} id="philosophy" className="relative w-full py-40 bg-dark text-light overflow-hidden px-6">
      <img src="https://images.unsplash.com/photo-1518002171953-a080ee817e1f?q=80&w=2070&auto=format&fit=crop" alt="Texture" className="phil-bg absolute top-[-20%] left-0 w-full h-[140%] object-cover opacity-10 grayscale mix-blend-screen pointer-events-none" />
      <div className="max-w-4xl mx-auto relative z-10">
        <p className="font-mono text-sm tracking-widest text-light/60 mb-12 uppercase">
          { "Most academic networking focuses on: fragmented records and flat resumes.".split(' ').map((word, i) => ( <span key={i} className="phil-word inline-block mr-2">{word}</span> )) }
        </p>
        <h2 className="font-sans font-bold text-5xl md:text-7xl lg:text-8xl leading-tight tracking-tighter">
          { "We focus on: ".split(' ').map((word, i) => <span key={\w-\\} className="phil-word inline-block mr-4">{word}</span>) }<br/>
          <span className="font-drama italic text-primary text-7xl md:text-8xl lg:text-9xl font-normal block mt-4">
            { "verifiable digital trust.".split(' ').map((word, i) => <span key={\w2-\\} className="phil-word inline-block mr-4">{word}</span>) }
          </span>
        </h2>
      </div>
    </section>
  );
};,

  'components/sections/Protocol.jsx': import React, { useEffect, useRef } from 'react';
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
        ScrollTrigger.create({ trigger: card, start: 'top top', endTrigger: containerRef.current, end: 'bottom bottom', pin: true, pinSpacing: false });
        gsap.to(card, { scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top top', scrub: true }, scale: 0.9, opacity: 0.3, filter: 'blur(10px)', ease: 'none' });
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const steps = [
    { num: "01", title: "Connect Source", desc: "Link your institutional data to our API bridge.", icon: <Hexagon className="w-16 h-16 text-primary" strokeWidth={1} /> },
    { num: "02", title: "Generate Matrix", desc: "We synthesize your achievements into a hardened data block.", icon: <GitMerge className="w-16 h-16 text-primary" strokeWidth={1} /> },
    { num: "03", title: "Deploy Identity", desc: "Your secure vCard is ready for global distribution.", icon: <Maximize className="w-16 h-16 text-primary" strokeWidth={1} /> }
  ];

  return (
    <section ref={containerRef} id="protocol" className="w-full bg-dark pb-32">
      <div className="max-w-5xl mx-auto px-6 pt-32">
        <h2 className="font-sans font-bold text-4xl md:text-5xl text-light mb-16 tracking-tighter">
          Execution <span className="font-drama italic text-light/50">Path.</span>
        </h2>
        <div className="relative">
          {steps.map((step, i) => (
            <div key={i} className={\proto-card w-full bg-white rounded-[3rem] p-12 md:p-20 shadow-xl flex flex-col md:flex-row items-center justify-between gap-12 border border-dark/5 min-h-[50vh] \\}>
              <div className="flex-1">
                <span className="font-mono text-accent text-2xl mb-4 block">STEP _{step.num}</span>
                <h3 className="font-sans font-bold text-4xl md:text-6xl text-dark tracking-tighter leading-none mb-6">{step.title}</h3>
                <p className="font-mono text-dark/70 text-lg max-w-sm">{step.desc}</p>
              </div>
              <div className="w-48 h-48 rounded-full border border-dark/10 flex items-center justify-center shrink-0 relative overflow-hidden bg-light">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[length:12px_12px]"></div>
                <div className="relative z-10 animate-[spin_20s_linear_infinite]">{step.icon}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};,

  'components/sections/FinalCTA.jsx': import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FinalCTA = () => {
  return (
    <section className="w-full py-40 bg-light px-6 text-center">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-sans font-bold text-5xl md:text-7xl tracking-tighter text-dark mb-6">
          Initialize Your <span className="font-drama italic text-primary">Node.</span>
        </h2>
        <p className="font-mono text-lg text-dark/70 mb-12 max-w-2xl mx-auto">
          Generate your premium digital identity in seconds, or verify a student's academic credentials instantly.
        </p>
        <Link to="/generate" className="btn-primary px-12 py-5 text-lg shadow-xl shadow-primary/20">
          Deploy Now
          <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
        </Link>
      </div>
    </section>
  );
};,

  'components/sections/Footer.jsx': import React from 'react';

export const Footer = () => {
  return (
    <footer className="w-full bg-dark rounded-t-[4rem] px-6 pt-24 pb-12 text-light mt-[-2rem] relative z-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20 border-b border-light/10 pb-20">
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="EduCard Logo" className="h-10 w-10 object-contain" />
            <span className="font-sans font-bold text-4xl tracking-tighter">EduCard.</span>
          </div>
          <p className="font-mono text-sm text-light/50 max-w-sm">
            High-density, offline-first digital credentials. Overriding legacy resumes.
          </p>
        </div>
        <div className="space-y-4 font-mono text-sm">
          <div className="text-primary mb-6 uppercase tracking-widest text-xs">Directory</div>
          <a href="#" className="block text-light/70 hover:text-primary transition-colors">Manifesto</a>
          <a href="#" className="block text-light/70 hover:text-primary transition-colors">Architecture</a>
          <a href="#" className="block text-light/70 hover:text-primary transition-colors">API Logs</a>
        </div>
        <div className="space-y-4 font-mono text-sm">
          <div className="text-primary mb-6 uppercase tracking-widest text-xs">Legal</div>
          <a href="#" className="block text-light/70 hover:text-primary transition-colors">Terms of Service</a>
          <a href="#" className="block text-light/70 hover:text-primary transition-colors">Privacy Shield</a>
        </div>
      </div>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between font-mono text-xs text-light/40">
        <p>&copy; {new Date().getFullYear()} EduCard. All rights reserved.</p>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
          <span className="text-accent">System Operational // Latency: 12ms</span>
        </div>
      </div>
    </footer>
  );
};,

  'pages/GeneratorPage.jsx': import React, { useState } from 'react';
import { ArrowLeft, Loader2, Maximize } from 'lucide-react';
import { Link } from 'react-router-dom';

export const GeneratorPage = () => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', university: '', major: '', email: '', phone: '', portfolio: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
      });
      const data = await res.json();
      setResult(data.qr_code);
    } catch (err) {
      console.error(err);
      alert('Node connection failed. Ensure backend API is active.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-dark text-light p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between py-6 mb-12 border-b border-light/10">
          <Link to="/" className="inline-flex items-center gap-2 font-mono text-sm text-light/70 hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" /> Abort & Return
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            <span className="font-mono text-xs text-accent uppercase tracking-widest">Generator Active</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <h1 className="font-sans font-bold text-5xl md:text-6xl tracking-tighter mb-4 text-light">
              Compile <span className="font-drama italic text-primary font-normal">Identity.</span>
            </h1>
            <p className="font-mono text-sm text-light/50 mb-12">
              Input parameters to generate a cryptographic vCard matrix. All fields marked * are required.
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div><label className="block font-mono text-xs uppercase tracking-wider text-light/70 mb-2">First Name *</label><input required name="firstName" onChange={handleChange} className="w-full bg-slate-800 border border-light/10 rounded-xl px-4 py-3 font-mono text-sm text-light focus:border-primary focus:outline-none transition-colors" placeholder="John" /></div>
                <div><label className="block font-mono text-xs uppercase tracking-wider text-light/70 mb-2">Last Name *</label><input required name="lastName" onChange={handleChange} className="w-full bg-slate-800 border border-light/10 rounded-xl px-4 py-3 font-mono text-sm text-light focus:border-primary focus:outline-none transition-colors" placeholder="Doe" /></div>
              </div>
              <div><label className="block font-mono text-xs uppercase tracking-wider text-light/70 mb-2">University / Institution *</label><input required name="university" onChange={handleChange} className="w-full bg-slate-800 border border-light/10 rounded-xl px-4 py-3 font-mono text-sm text-light focus:border-primary focus:outline-none transition-colors" placeholder="MIT, Harvard, etc." /></div>
              <div><label className="block font-mono text-xs uppercase tracking-wider text-light/70 mb-2">Major / Degree *</label><input required name="major" onChange={handleChange} className="w-full bg-slate-800 border border-light/10 rounded-xl px-4 py-3 font-mono text-sm text-light focus:border-primary focus:outline-none transition-colors" placeholder="B.S. Computer Science" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block font-mono text-xs uppercase tracking-wider text-light/70 mb-2">Email Node *</label><input required type="email" name="email" onChange={handleChange} className="w-full bg-slate-800 border border-light/10 rounded-xl px-4 py-3 font-mono text-sm text-light focus:border-primary focus:outline-none transition-colors" placeholder="jdoe@edu.org" /></div>
                <div><label className="block font-mono text-xs uppercase tracking-wider text-light/70 mb-2">Phone Vector</label><input type="tel" name="phone" onChange={handleChange} className="w-full bg-slate-800 border border-light/10 rounded-xl px-4 py-3 font-mono text-sm text-light focus:border-primary focus:outline-none transition-colors" placeholder="+1 234 567 890" /></div>
              </div>
              <div><label className="block font-mono text-xs uppercase tracking-wider text-light/70 mb-2">Portfolio / Network URL</label><input type="url" name="portfolio" onChange={handleChange} className="w-full bg-slate-800 border border-light/10 rounded-xl px-4 py-3 font-mono text-sm text-light focus:border-primary focus:outline-none transition-colors" placeholder="https://github.com/..." /></div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-4 mt-8 justify-center rounded-xl disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Execute Build'}
              </button>
            </form>
          </div>

          <div className="flex flex-col items-center justify-center bg-white rounded-[3rem] p-12 text-dark min-h-[600px] border border-light/10 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[length:12px_12px] opacity-50 z-0"></div>
            <div className="relative z-10 w-full flex flex-col items-center text-center">
              {!result ? (
                <><Maximize className="w-16 h-16 text-dark/20 mb-6" strokeWidth={1} /><p className="font-mono text-lg text-dark/60">Awaiting input compilation...</p></>
              ) : (
                <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center">
                  <div className="bg-white p-4 rounded-2xl shadow-xl mb-8 border border-dark/10">
                    <img src={result} alt="Generated QR Code" className="w-64 h-64 rounded-lg" />
                  </div>
                  <h3 className="font-sans font-bold text-3xl tracking-tighter mb-2 text-dark">Node Verified.</h3>
                  <p className="font-mono text-sm text-dark/60 max-w-xs mb-8">Scan via native iOS/Android camera to directly patch into contact arrays.</p>
                  <button onClick={() => { const link = document.createElement('a'); link.href = result; link.download = 'EduCard_Signal.png'; link.click(); }} className="btn-secondary px-8 py-3">
                    Download Matrix
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
};

for (const [relPath, content] of Object.entries(files)) {
  const fullPath = path.join(dir, relPath);
  fs.writeFileSync(fullPath, content, 'utf8');
}
console.log('Successfully recreated all components using standard Tailwind Design System!');
