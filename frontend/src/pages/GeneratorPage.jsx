import React, { useState } from 'react';
import { ArrowLeft, Loader2, QrCode, Download, Link as LinkIcon, Phone, Mail, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

export const GeneratorPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    university: '',
    major: '',
    email: '',
    phone: '',
    portfolio: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('http://localhost:8001/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setResult(data.qr_code);
    } catch (err) {
      console.error(err);
      alert('Node connection failed. Ensure backend API is active at port 8000.');
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result;
    link.download = `EduCard_${formData.firstName}_${formData.lastName}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-dark text-light p-6 font-sans selection:bg-primary/30">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-900/20 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between py-6 mb-8 border-b border-light/10 gap-4">
          <Link to="/" className="inline-flex items-center gap-2 font-mono text-sm text-light/70 hover:text-primary transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" />
            Abort & Return
          </Link>
          <div className="flex items-center gap-3">
            <img src="/LOGO.png" alt="EduCard Logo" className="w-6 h-6 object-contain" />
            <span className="font-sans font-bold text-xl tracking-tighter">EduCard.</span>
            <div className="h-4 w-px bg-light/20 mx-2"></div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="font-mono text-xs text-primary uppercase tracking-widest">Generator Active</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 relative items-start">
          
          {/* Form Side (Left) */}
          <div className="lg:col-span-6 xl:col-span-5 pb-20">
            <h1 className="font-sans font-bold text-5xl md:text-6xl tracking-tighter mb-4">
              Compile <span className="font-drama italic text-primary font-normal">Identity.</span>
            </h1>
            <p className="font-mono text-sm text-light/50 mb-10 leading-relaxed">
              Input system parameters to generate your cryptographic vCard matrix. All fields marked <span className="text-primary">*</span> are required for successful compilation.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1">First Name *</label>
                  <input required name="firstName" value={formData.firstName} onChange={handleChange} className="w-full bg-light/5 border border-light/10 rounded-xl px-4 py-3.5 font-sans text-base focus:border-primary focus:bg-light/10 focus:outline-none transition-all placeholder:text-light/20" placeholder="John" />
                </div>
                <div className="space-y-2">
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1">Last Name *</label>
                  <input required name="lastName" value={formData.lastName} onChange={handleChange} className="w-full bg-light/5 border border-light/10 rounded-xl px-4 py-3.5 font-sans text-base focus:border-primary focus:bg-light/10 focus:outline-none transition-all placeholder:text-light/20" placeholder="Doe" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1">University / Institution *</label>
                <input required name="university" value={formData.university} onChange={handleChange} className="w-full bg-light/5 border border-light/10 rounded-xl px-4 py-3.5 font-sans text-base focus:border-primary focus:bg-light/10 focus:outline-none transition-all placeholder:text-light/20" placeholder="Stanford University" />
              </div>

              <div className="space-y-2">
                <label className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1">Major / Prefix *</label>
                <input required name="major" value={formData.major} onChange={handleChange} className="w-full bg-light/5 border border-light/10 rounded-xl px-4 py-3.5 font-sans text-base focus:border-primary focus:bg-light/10 focus:outline-none transition-all placeholder:text-light/20" placeholder="B.S. Computer Science" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1">Email Node *</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-light/5 border border-light/10 rounded-xl px-4 py-3.5 font-sans text-base focus:border-primary focus:bg-light/10 focus:outline-none transition-all placeholder:text-light/20" placeholder="jdoe@edu.org" />
                </div>
                <div className="space-y-2">
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1">Phone Vector</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-light/5 border border-light/10 rounded-xl px-4 py-3.5 font-sans text-base focus:border-primary focus:bg-light/10 focus:outline-none transition-all placeholder:text-light/20" placeholder="+1 (555) 000-0000" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1">Portfolio / Network URL</label>
                <input type="url" name="portfolio" value={formData.portfolio} onChange={handleChange} className="w-full bg-light/5 border border-light/10 rounded-xl px-4 py-3.5 font-sans text-base focus:border-primary focus:bg-light/10 focus:outline-none transition-all placeholder:text-light/20" placeholder="https://github.com/jdoe" />
              </div>

              <div className="pt-6">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full group relative overflow-hidden bg-primary text-light font-bold font-mono py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                  {loading ? (
                    <><Loader2 className="animate-spin w-5 h-5 relative z-10" /><span className="relative z-10">Compiling Matrix...</span></>
                  ) : (
                    <><QrCode className="w-5 h-5 relative z-10" /><span className="relative z-10">Execute Build</span></>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Side (Right) */}
          <div className="lg:col-span-6 xl:col-span-7 pb-20">
            <div className="sticky top-12">
              <div className="flex items-center justify-between mb-6 border-b border-light/10 pb-4">
                <h3 className="font-mono text-sm tracking-widest uppercase text-light/50">Live Preview</h3>
                {result && (
                  <span className="font-mono text-xs text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                    Compiled
                  </span>
                )}
              </div>

              {/* The "Card" */}
              <div className="relative w-full max-w-lg mx-auto aspect-[1.6/1] rounded-[2rem] overflow-hidden group shadow-2xl transition-transform duration-500 hover:rotate-1">
                {/* Card Background / Texture */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a1c29] to-[#0f1016] border border-light/10 shadow-[inset_0_0_80px_rgba(0,0,0,0.8)] z-0"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] rounded-full translate-x-1/3 -translate-y-1/3 z-0 pointer-events-none"></div>

                {/* Card Content */}
                <div className="relative z-10 p-8 h-full flex flex-col justify-between">
                  {/* Top Row: Name & Uni */}
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h2 className={`font-sans font-bold text-3xl tracking-tight leading-none ${formData.firstName || formData.lastName ? 'text-light' : 'text-light/20'}`}>
                        {formData.firstName || 'Student'} <br />
                        {formData.lastName || 'Name'}
                      </h2>
                      <img src="/LOGO.png" alt="EduCard Logo" className="w-8 h-8 opacity-50 grayscale" />
                    </div>
                    
                    <div className="flex items-center gap-2 mt-4 text-light/70">
                      <GraduationCap className="w-4 h-4 text-primary" />
                      <p className={`font-mono text-xs uppercase tracking-wider ${formData.university ? 'text-light/90' : 'text-light/40'}`}>
                        {formData.university || 'University Name'}
                      </p>
                    </div>
                    
                    <p className={`font-mono text-[10px] pl-6 mt-1 uppercase tracking-widest ${formData.major ? 'text-primary' : 'text-primary/40'}`}>
                      {formData.major || 'Degree / Major'}
                    </p>
                  </div>

                  {/* Bottom Row: Contact & QR */}
                  <div className="flex justify-between items-end gap-4 mt-8">
                    {/* Contact details */}
                    <div className="space-y-3 flex-1 overflow-hidden min-w-0">
                      <div className={`flex items-center gap-3 text-xs font-mono transition-opacity ${formData.email ? 'opacity-100' : 'opacity-30'}`}>
                        <div className="w-6 h-6 rounded-full bg-light/5 border border-light/10 flex items-center justify-center shrink-0">
                          <Mail className="w-3 h-3 text-light/70" />
                        </div>
                        <span className="truncate">{formData.email || 'email@domain.edu'}</span>
                      </div>
                      
                      <div className={`flex items-center gap-3 text-xs font-mono transition-opacity ${formData.phone ? 'opacity-100' : 'opacity-30'}`}>
                        <div className="w-6 h-6 rounded-full bg-light/5 border border-light/10 flex items-center justify-center shrink-0">
                          <Phone className="w-3 h-3 text-light/70" />
                        </div>
                        <span className="truncate">{formData.phone || '+1 (000) 000-0000'}</span>
                      </div>

                      <div className={`flex items-center gap-3 text-xs font-mono transition-opacity ${formData.portfolio ? 'opacity-100' : 'opacity-30'}`}>
                        <div className="w-6 h-6 rounded-full bg-light/5 border border-light/10 flex items-center justify-center shrink-0">
                          <LinkIcon className="w-3 h-3 text-light/70" />
                        </div>
                        <span className="truncate block max-w-[150px]">{formData.portfolio ? formData.portfolio.replace(/^https?:\/\//, '') : 'portfolio.link'}</span>
                      </div>
                    </div>

                    {/* QR Code Area */}
                    <div className="shrink-0 relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-white/5 border border-light/10 flex items-center justify-center overflow-hidden backdrop-blur-sm">
                      {result ? (
                        <div className="absolute inset-0 w-full h-full bg-white p-2 animate-in zoom-in duration-300">
                           {/* API returns QR code on white bg. We preserve it for scanning. */}
                          <img src={result} alt="vCard QR" className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="text-center p-2">
                          <QrCode className="w-8 h-8 text-light/20 mx-auto mb-2" strokeWidth={1} />
                          <div className="text-[8px] font-mono text-light/30 uppercase tracking-widest leading-tight">Awaiting Build</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Download Action Area */}
              <div className={`mt-8 flex justify-center transition-all duration-500 ${result ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none absolute w-full'}`}>
                 <button 
                  onClick={downloadQR} 
                  className="flex items-center gap-2 bg-light text-dark font-mono text-sm font-bold px-8 py-4 rounded-xl hover:scale-105 transition-transform"
                >
                  <Download className="w-4 h-4" />
                  Download Matrix (PNG)
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};