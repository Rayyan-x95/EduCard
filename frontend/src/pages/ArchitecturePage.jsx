import React from 'react';
import { Navbar } from '../components/sections/Navbar';
import { Footer } from '../components/sections/Footer';
import { Cpu, Server, Database, Globe } from 'lucide-react';

export const ArchitecturePage = () => {
  return (
    <div className="bg-dark min-h-screen text-light">
      <Navbar />
      
      <main className="pt-40 pb-24 px-6 max-w-7xl mx-auto">
        <div className="max-w-4xl">
          <p className="font-mono text-primary mb-6 uppercase tracking-widest text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary inline-block animate-pulse" />
            Protocol Documentation // Architecture
          </p>
          <h1 className="font-sans font-bold text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tighter text-light mb-12">
            System
            <br />
            <span className="font-drama italic font-normal text-primary">Architecture.</span>
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-24">
            <div className="p-8 rounded-3xl bg-light/5 border border-white/10 backdrop-blur-sm group hover:bg-light/10 transition-all">
              <Cpu className="w-10 h-10 text-primary mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="font-sans font-bold text-2xl mb-4">Edge Runtime</h3>
              <p className="font-mono text-sm text-light/50 leading-relaxed">
                Frontend built with React + Vite, deployed across global edge nodes for sub-10ms response times.
              </p>
            </div>
            
            <div className="p-8 rounded-3xl bg-light/5 border border-white/10 backdrop-blur-sm group hover:bg-light/10 transition-all">
              <Server className="w-10 h-10 text-primary mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="font-sans font-bold text-2xl mb-4">FastAPI Core</h3>
              <p className="font-mono text-sm text-light/50 leading-relaxed">
                Asynchronous Python backend handling high-density vCard generation and Matrix compilation.
              </p>
            </div>
            
            <div className="p-8 rounded-3xl bg-light/5 border border-white/10 backdrop-blur-sm group hover:bg-light/10 transition-all">
              <Database className="w-10 h-10 text-primary mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="font-sans font-bold text-2xl mb-4">Zero-Knowledge Storage</h3>
              <p className="font-mono text-sm text-light/50 leading-relaxed">
                Offline-first data strategy. Credentials reside on the card matrix, not in our databases.
              </p>
            </div>
            
            <div className="p-8 rounded-3xl bg-light/5 border border-white/10 backdrop-blur-sm group hover:bg-light/10 transition-all">
              <Globe className="w-10 h-10 text-primary mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="font-sans font-bold text-2xl mb-4">Decentralized Pings</h3>
              <p className="font-mono text-sm text-light/50 leading-relaxed">
                Universal scanner compatibility via standard ISO-compliant vCard protocols.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};
