import React from 'react';
import { Navbar } from '../components/sections/Navbar';
import { Footer } from '../components/sections/Footer';
import { Database, Link as LinkIcon, UserCircle, LayoutDashboard, Share2, Palette, LineChart, Wifi } from 'lucide-react';
import { Link } from 'react-router-dom';

export const V2RoadmapPage = () => {
  const features = [
    {
      icon: Database,
      title: "Persistent Storage",
      desc: "Cards will no longer disappear on refresh. Every interaction is saved securely, allowing multiple networking matrices (e.g., Hackathon, Enterprise)."
    },
    {
      icon: Share2,
      title: "Shareable Profiles",
      desc: "Cards transition from local image blobs to dynamic cloud-hosted pages. Accessible globally via a clean URL like educard.app/card/johndoe."
    },
    {
      icon: UserCircle,
      title: "User Accounts",
      desc: "Robust authentication supporting Email/Password and OAuth (GitHub, Google). Claim your custom slug and govern your own payload."
    },
    {
      icon: LayoutDashboard,
      title: "Command Dashboards",
      desc: "A centralized control panel to view all active cards, edit live vectors retroactively, and temporarily disable tracking instantly."
    },
    {
      icon: LinkIcon,
      title: "Extended Vectors",
      desc: "Beyond basic networks. Attach infinite relational data: LinkedIn, GitHub, X, Discord, and personal portfolios directly to the interactive matrix."
    },
    {
      icon: Palette,
      title: "Custom Theming Engine",
      desc: "Save custom hex-codes, unlock premium Holo-foils, and fine-tune typography tokens that sync securely to your cloud profile."
    },
    {
      icon: LineChart,
      title: "Telemetry & Analytics",
      desc: "Understand your networking impact. Track total profile views, unique physical QR scans, and specific social link click-through-rates (CTR)."
    },
    {
      icon: Wifi,
      title: "NFC Hardware Bridge",
      desc: "Write your persistent URL directly to NDEF-enabled physical NFC tags. Tapping a phone instantly loads your dynamic digital matrix."
    }
  ];

  return (
    <div className="bg-dark min-h-screen text-light">
      <Navbar />

      <main className="pt-40 pb-24 px-6 max-w-7xl mx-auto">
        <div className="max-w-4xl">
          <p className="font-mono text-primary mb-6 uppercase tracking-widest text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary inline-block animate-pulse" />
            Project Blueprint // V2 Roadmap
          </p>
          <h1 className="font-sans font-bold text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tighter text-light mb-8">
            The Future of
            <br />
            <span className="font-drama italic font-normal text-primary">Identity.</span>
          </h1>
          
          <p className="font-mono text-sm md:text-base text-light/50 leading-relaxed mb-12 max-w-2xl">
            V1 successfully defined the core aesthetic. The goal of EduCard V2 is to cross the chasm from an ephemeral UI generator into a comprehensive, cloud-native Digital Identity Ecosystem.
          </p>

          <Link to="/generate" className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/30 px-6 py-3 rounded-full font-mono text-xs font-bold hover:bg-primary hover:text-white transition-all">
            Access V1 Generator Now
          </Link>

          <div className="mt-24">
            <h2 className="font-sans font-bold text-3xl mb-12 flex items-center gap-4">
              <span className="w-8 h-px bg-primary"></span>
              Upcoming Directives
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div key={i} className="p-8 rounded-3xl bg-light/5 border border-white/10 backdrop-blur-sm group hover:bg-light/10 transition-all border-l-2 hover:border-l-primary flex flex-col items-start text-left">
                    <div className="w-12 h-12 rounded-2xl bg-dark/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-sans font-bold text-xl mb-3">{feature.title}</h3>
                    <p className="font-mono text-xs md:text-sm text-light/50 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-24 p-10 rounded-3xl bg-gradient-to-br from-primary/20 to-dark border border-primary/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
            <h2 className="font-sans font-bold text-3xl mb-4 relative z-10">Architectural Shift</h2>
            <p className="font-mono text-sm text-light/70 leading-relaxed max-w-xl relative z-10 mb-6">
              Migrating from a localized Single Page Application to a decentralized platform powered by React + Next.js SEO rendering, Supabase PostgreSQL Datastores, Edge Functions, and globally cached Vercel nodes.
            </p>
            <div className="flex gap-4 font-mono text-xs text-primary/80 relative z-10">
              <span className="px-3 py-1 bg-dark/40 rounded-full border border-primary/20">Supabase</span>
              <span className="px-3 py-1 bg-dark/40 rounded-full border border-primary/20">PostgreSQL</span>
              <span className="px-3 py-1 bg-dark/40 rounded-full border border-primary/20">Edge CDN</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
