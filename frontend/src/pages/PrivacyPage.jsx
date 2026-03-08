import React from 'react';
import { Navbar } from '../components/sections/Navbar';
import { Footer } from '../components/sections/Footer';

export const PrivacyPage = () => {
  return (
    <div className="bg-dark min-h-screen text-light font-sans">
      <Navbar />
      
      <main className="pt-40 pb-24 px-6 max-w-4xl mx-auto">
        <p className="font-mono text-primary mb-6 uppercase tracking-widest text-xs">
          Legal // Privacy Policy
        </p>
        <h1 className="font-sans font-bold text-5xl md:text-7xl tracking-tighter text-light mb-16">
          Privacy
          <br />
          <span className="font-drama italic font-normal text-primary">Policy.</span>
        </h1>
        
        <div className="prose prose-invert max-w-none space-y-12 text-light/60 leading-relaxed font-sans">
          <section>
            <h2 className="text-light font-bold text-2xl mb-4 tracking-tight">1. Information We Collect</h2>
            <p>
              EduCard collects the data you input into the generator form solely for the purpose of compiling your QR matrix. This includes your name, university, major, and contact details.
            </p>
          </section>

          <section>
            <h2 className="text-light font-bold text-2xl mb-4 tracking-tight">2. How We Use Information</h2>
            <p>
              The data is processed in real-time by our generation engine. Once the card is generated and served to you, the underlying identity vectors are purged from our volatile memory.
            </p>
          </section>

          <section>
            <h2 className="text-light font-bold text-2xl mb-4 tracking-tight">3. Cookies</h2>
            <p>
              We use minimal, essential cookies only to maintain the state of your session during the generation process. We do not use tracking or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-light font-bold text-2xl mb-4 tracking-tight">4. Third Parties</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. All processing happens within our secure, encrypted environment.
            </p>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};
