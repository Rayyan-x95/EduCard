import React from 'react';
import { Navbar } from '../components/sections/Navbar';
import { Footer } from '../components/sections/Footer';

export const TermsPage = () => {
  return (
    <div className="bg-dark min-h-screen text-light font-sans">
      <Navbar />
      
      <main className="pt-40 pb-24 px-6 max-w-4xl mx-auto">
        <p className="font-mono text-primary mb-6 uppercase tracking-widest text-xs">
          Legal // Terms of Service
        </p>
        <h1 className="font-sans font-bold text-5xl md:text-7xl tracking-tighter text-light mb-16">
          Terms of
          <br />
          <span className="font-drama italic font-normal text-primary">Service.</span>
        </h1>
        
        <div className="prose prose-invert max-w-none space-y-12 text-light/60 leading-relaxed font-sans">
          <section>
            <h2 className="text-light font-bold text-2xl mb-4 tracking-tight">1. Acceptance of Terms</h2>
            <p>
              By accessing or using EduCard, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-light font-bold text-2xl mb-4 tracking-tight">2. Use of Service</h2>
            <p>
              EduCard provides a platform to generate digital academic identity cards. You are responsible for ensuring the accuracy of the information provided and for maintaining the security of your generated cards.
            </p>
          </section>

          <section>
            <h2 className="text-light font-bold text-2xl mb-4 tracking-tight">3. Data Privacy</h2>
            <p>
              EduCard is designed with an "offline-first" philosophy. We do not store your identity vectors on our servers after the generation process. Your data remains your own.
            </p>
          </section>

          <section>
            <h2 className="text-light font-bold text-2xl mb-4 tracking-tight">4. Restrictions</h2>
            <p>
              You may not use the service for any illegal purposes or to generate fraudulent academic credentials. We reserve the right to terminate access for any violations of these terms.
            </p>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};
