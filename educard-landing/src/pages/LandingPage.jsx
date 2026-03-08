import React from 'react';
import { Navbar } from '../components/sections/Navbar';
import { Hero } from '../components/sections/Hero';
import { Features } from '../components/sections/Features';
import { Philosophy } from '../components/sections/Philosophy';
import { Protocol } from '../components/sections/Protocol';
import { FinalCTA } from '../components/sections/FinalCTA';
import { Footer } from '../components/sections/Footer';

export const LandingPage = () => {
  return (
    <div className="-dark">
      <div className="noise-overlay"></div>
      <Navbar />
      <Hero />
      <Features />
      <Philosophy />
      <Protocol />
      <FinalCTA />
      <Footer />
    </div>
  );
};