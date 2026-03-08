import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FinalCTA = () => {
  return (
    <section className="w-full py-40 bg-light px-6 text-center">
      <div className="max-w-4xl mx-auto">
        <p className="font-mono text-xs text-primary uppercase tracking-widest mb-6">
          — Ready?
        </p>
        <h2 className="font-sans font-bold text-5xl md:text-7xl tracking-tighter text-dark mb-6">
          Launch Your{' '}
          <span className="font-drama italic text-primary">Identity.</span>
        </h2>
        <p className="font-mono text-base text-dark/60 mb-12 max-w-2xl mx-auto leading-relaxed">
          Generate your premium digital academic identity in seconds. No account needed — just your details and a download.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/generate"
            className="bg-primary text-white px-12 py-5 rounded-full font-mono text-base font-bold inline-flex items-center gap-4 group hover:bg-blue-700 transition-colors shadow-xl shadow-primary/20"
          >
            Launch App
            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </Link>
          <a
            href="#features"
            className="border border-dark/20 text-dark px-12 py-5 rounded-full font-mono text-base font-bold inline-flex items-center gap-4 hover:border-dark/50 hover:bg-dark/5 transition-all"
          >
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
};