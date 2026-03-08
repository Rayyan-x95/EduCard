import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Zap, MousePointer2 } from 'lucide-react';

export const Features = () => {
  // Card 1: Diagnostic Shuffler
  const [shuffleItems, setShuffleItems] = useState([
    { id: 1, label: "Scan QR Signal" },
    { id: 2, label: "Parse Contact Matrix" },
    { id: 3, label: "Save to Native Contacts" }
  ]);
  
  useEffect(() => {
    const int = setInterval(() => {
      setShuffleItems(prev => {
        const next = [...prev];
        const last = next.pop();
        next.unshift(last);
        return next;
      });
    }, 3000);
    return () => clearInterval(int);
  }, []);

  // Card 2: Telemetry Typewriter
  const textToType = "Validating academic credentials...\nBridging fragmented records...\nStatus: UNIFIED & VERIFIED.";
  const [typedText, setTypedText] = useState("");
  
  useEffect(() => {
    let currentText = "";
    let i = 0;
    const typeInt = setInterval(() => {
      if (i < textToType.length) {
        currentText += textToType.charAt(i);
        setTypedText(currentText);
        i++;
      } else {
        setTimeout(() => { i = 0; currentText = ""; }, 2000);
      }
    }, 50);
    return () => clearInterval(typeInt);
  }, []);

  // Card 3: Cursor Animator
  const cursorRef = useRef(null);
  const clickTargetRef = useRef(null);
  const [clicked, setClicked] = useState(false);
  
  useEffect(() => {
    const curCtx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
      
      tl.set(cursorRef.current, { x: 0, y: 0, opacity: 0 })
        .to(cursorRef.current, { opacity: 1, duration: 0.3 })
        .to(cursorRef.current, { 
          x: 40, y: 40, 
          duration: 1,
          ease: "power2.inOut" 
        })
        .to(cursorRef.current, { scale: 0.8, duration: 0.1 }) // click
        .call(() => setClicked(true))
        .to(cursorRef.current, { scale: 1, duration: 0.1 }) // release
        .to(cursorRef.current, { x: 120, y: 70, duration: 0.8, ease: "power2.inOut", delay: 0.2 })
        .to(cursorRef.current, { scale: 0.8, duration: 0.1 }) // save click
        .to(cursorRef.current, { scale: 1, duration: 0.1 })
        .to(cursorRef.current, { opacity: 0, duration: 0.3 })
        .call(() => setClicked(false));
    });
    return () => curCtx.revert();
  }, []);

  return (
    <section id="features" className="w-full py-32 -light relative z-10 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-sans font-bold text-4xl md:text-5xl tracking-tighter mb-16 -dark">
          Functional <span className="font-drama italic -primary">Subsystems.</span>
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="-light rounded-[2rem] p-8 border -dark/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-96 flex flex-col justify-between">
            <div>
              <h3 className="font-sans font-bold text-xl -dark">Instant Networking</h3>
              <p className="font-mono text-xs -dark/60 mt-2">The vCard Engine</p>
            </div>
            <div className="relative w-full h-48 flex items-center justify-center">
              {shuffleItems.map((item, index) => (
                <div 
                  key={item.id} 
                  className="absolute w-4/5 -light p-4 rounded-xl border -dark/10 flex items-center gap-3 shadow-sm transition-all duration-[0.8s]"
                  style={{
                    transform: `translateY(${index * 15}px) scale(${1 - index * 0.05})`,
                    opacity: 1 - index * 0.2,
                    zIndex: 3 - index,
                  }}
                >
                  <div className="w-8 h-8 rounded-full -dark flex items-center justify-center">
                    <Zap className="w-4 h-4 -light" />
                  </div>
                  <span className="font-mono text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2 */}
          <div className="-dark rounded-[2rem] p-8 shrink-0 flex flex-col justify-between h-96">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full -primary animate-pulse"></span>
                <span className="font-mono text-xs -primary uppercase">Live Feed</span>
              </div>
              <h3 className="font-sans font-bold text-xl -light">Verified Trust</h3>
              <p className="font-mono text-xs -light/60 mt-2">Academic snapshot processing</p>
            </div>
            
            <div className="-slate-800 rounded-xl p-4 h-40 border border-[#333]">
              <pre className="font-mono text-xs -accent whitespace-pre-wrap leading-relaxed">
                <code className="text-[#888]">{'> '}</code>
                {typedText}
                <span className="inline-block w-2 -primary h-3 ml-1 animate-pulse"></span>
              </pre>
            </div>
          </div>

          {/* Card 3 */}
          <div className="-light rounded-[2rem] p-8 border -dark/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-96 flex flex-col justify-between relative overflow-hidden">
            <div>
              <h3 className="font-sans font-bold text-xl -dark">Premium Identity</h3>
              <p className="font-mono text-xs -dark/60 mt-2">Design as a differentiator</p>
            </div>
            
            <div className="w-full -light rounded-xl h-40 mt-4 border -dark/10 p-4 relative">
              <div className="grid grid-cols-7 gap-1 h-3/4">
                {["S","M","T","W","T","F","S"].map((d, i) => (
                  <div key={i} className="flex flex-col gap-1 items-center">
                    <span className="font-mono text-[10px] -dark/40">{d}</span>
                    <div className={`w-8 h-8 rounded-md transition-colors duration-300 ${i === 3 && clicked ? '-primary' : '-dark/5'}`} />
                  </div>
                ))}
              </div>
              <div className="absolute bottom-2 right-2 -dark -light px-3 py-1 rounded text-[10px] font-mono">
                Deploy Site
              </div>
              <MousePointer2 ref={cursorRef} className="absolute top-0 left-0 w-6 h-6 -dark drop-shadow-md z-20" fill="white" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};