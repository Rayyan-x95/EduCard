import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FinalCTA = () => {
  return (
    <section className="w-full py-40 -light px-6 text-center">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-sans font-bold text-5xl md:text-7xl tracking-tighter -dark mb-6">
          Initialize Your <span className="font-drama italic -primary">Node.</span>
        </h2>
        <p className="font-mono text-lg -dark/70 mb-12 max-w-2xl mx-auto">
          Generate your premium digital identity in seconds, or verify a student's academic credentials instantly.
        </p>
        <Link to="/generate" className="magnetic-btn -primary -light px-12 py-5 rounded-full font-mono text-lg font-bold inline-flex items-center gap-4 group shadow-xl -primary/20">
          Deploy Now
          <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
        </Link>
      </div>
    </section>
  );
};