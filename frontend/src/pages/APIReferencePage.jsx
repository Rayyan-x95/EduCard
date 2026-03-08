import React from 'react';
import { Navbar } from '../components/sections/Navbar';
import { Footer } from '../components/sections/Footer';
import { Code2, Terminal, ShieldCheck, Zap } from 'lucide-react';

export const APIReferencePage = () => {
  return (
    <div className="bg-dark min-h-screen text-light">
      <Navbar />
      
      <main className="pt-40 pb-24 px-6 max-w-7xl mx-auto">
        <div className="max-w-4xl">
          <p className="font-mono text-primary mb-6 uppercase tracking-widest text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary inline-block animate-pulse" />
            Developer Portal // API Reference
          </p>
          <h1 className="font-sans font-bold text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tighter text-light mb-12">
            Protocol
            <br />
            <span className="font-drama italic font-normal text-primary">Endpoints.</span>
          </h1>
          
          <div className="space-y-12 mt-24 font-mono">
            <div className="p-8 rounded-3xl bg-light/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-primary/20 text-primary px-3 py-1 rounded-md text-xs font-bold">POST</span>
                <span className="text-light/80 text-sm">/api/generate</span>
              </div>
              <h3 className="font-sans font-bold text-xl mb-4 text-light">Generate vCard Matrix</h3>
              <p className="text-sm text-light/50 mb-6 leading-relaxed">
                Compiles user identity vectors into a high-density QR Matrix.
              </p>
              <pre className="bg-black/50 p-6 rounded-xl text-xs text-primary/80 overflow-x-auto border border-white/5">
{`{
  "firstName": "John",
  "lastName": "Doe",
  "university": "Stanford",
  "major": "Computer Science",
  "email": "john@doe.com"
}`}
              </pre>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-light/5 border border-white/10">
                <Terminal className="w-5 h-5 text-primary mb-4" />
                <h4 className="text-xs font-bold uppercase mb-2">Auth</h4>
                <p className="text-[10px] text-light/40">Bearer Token Required</p>
              </div>
              <div className="p-6 rounded-2xl bg-light/5 border border-white/10">
                <Zap className="w-5 h-5 text-primary mb-4" />
                <h4 className="text-xs font-bold uppercase mb-2">Rate Limit</h4>
                <p className="text-[10px] text-light/40">1k Requests / min</p>
              </div>
              <div className="p-6 rounded-2xl bg-light/5 border border-white/10">
                <ShieldCheck className="w-5 h-5 text-primary mb-4" />
                <h4 className="text-xs font-bold uppercase mb-2">Security</h4>
                <p className="text-[10px] text-light/40">TLS 1.3 Encryption</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};
