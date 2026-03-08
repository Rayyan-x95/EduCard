import React, { useState } from 'react';
import { ArrowLeft, Loader2, Maximize } from 'lucide-react';
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
      const res = await fetch('http://localhost:8000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setResult(data.qr_code);
    } catch (err) {
      console.error(err);
      alert('Node connection failed. Ensure backend API is active.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] -dark -light p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="flex items-center justify-between py-6 mb-12 border-b -light/10">
          <Link to="/" className="inline-flex items-center gap-2 font-mono text-sm -light/70 hover:-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Abort & Return
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full -primary animate-pulse"></span>
            <span className="font-mono text-xs -primary uppercase tracking-widest">Generator Active</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Form Side */}
          <div>
            <h1 className="font-sans font-bold text-5xl md:text-6xl tracking-tighter mb-4">
              Compile <span className="font-drama italic -primary font-normal">Identity.</span>
            </h1>
            <p className="font-mono text-sm -light/50 mb-12">
              Input parameters to generate a cryptographic vCard matrix. All fields marked * are required for standard compilation.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider -light/70 mb-2">First Name *</label>
                  <input required name="firstName" onChange={handleChange} className="w-full -slate-800 border -light/10 rounded-xl px-4 py-3 font-mono text-sm focus:-primary focus:outline-none transition-colors" placeholder="John" />
                </div>
                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider -light/70 mb-2">Last Name *</label>
                  <input required name="lastName" onChange={handleChange} className="w-full -slate-800 border -light/10 rounded-xl px-4 py-3 font-mono text-sm focus:-primary focus:outline-none transition-colors" placeholder="Doe" />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs uppercase tracking-wider -light/70 mb-2">University / Institution *</label>
                <input required name="university" onChange={handleChange} className="w-full -slate-800 border -light/10 rounded-xl px-4 py-3 font-mono text-sm focus:-primary focus:outline-none transition-colors" placeholder="MIT, Harvard, etc." />
              </div>

              <div>
                <label className="block font-mono text-xs uppercase tracking-wider -light/70 mb-2">Major / Degree *</label>
                <input required name="major" onChange={handleChange} className="w-full -slate-800 border -light/10 rounded-xl px-4 py-3 font-mono text-sm focus:-primary focus:outline-none transition-colors" placeholder="B.S. Computer Science" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider -light/70 mb-2">Email Node *</label>
                  <input required type="email" name="email" onChange={handleChange} className="w-full -slate-800 border -light/10 rounded-xl px-4 py-3 font-mono text-sm focus:-primary focus:outline-none transition-colors" placeholder="jdoe@edu.org" />
                </div>
                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider -light/70 mb-2">Phone Vector</label>
                  <input type="tel" name="phone" onChange={handleChange} className="w-full -slate-800 border -light/10 rounded-xl px-4 py-3 font-mono text-sm focus:-primary focus:outline-none transition-colors" placeholder="+1 234 567 890" />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs uppercase tracking-wider -light/70 mb-2">Portfolio / Network URL</label>
                <input type="url" name="portfolio" onChange={handleChange} className="w-full -slate-800 border -light/10 rounded-xl px-4 py-3 font-mono text-sm focus:-primary focus:outline-none transition-colors" placeholder="https://github.com/..." />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full -light -dark font-bold font-mono py-4 rounded-xl mt-8 flex items-center justify-center gap-2 hover:-light transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Execute Build'}
              </button>
            </form>
          </div>

          {/* Result Side */}
          <div className="flex flex-col items-center justify-center -light rounded-[3rem] p-12 -dark min-h-[600px] border -light/10 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(17,17,17,0.05)_1px,transparent_1px)] bg-[length:12px_12px] opacity-50 z-0"></div>
            
            <div className="relative z-10 w-full flex flex-col items-center text-center">
              {!result ? (
                <>
                  <Maximize className="w-16 h-16 -dark/20 mb-6" strokeWidth={1} />
                  <p className="font-mono text-lg -dark/60">Awaiting input compilation...</p>
                </>
              ) : (
                <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center">
                  <div className="-dark p-4 rounded-2xl shadow-xl mb-8">
                    <img src={result} alt="Generated QR Code" className="w-64 h-64 rounded-lg mix-blend-screen" style={{filter: 'invert(1)'}} />
                  </div>
                  <h3 className="font-sans font-bold text-3xl tracking-tighter mb-2">Node Verified.</h3>
                  <p className="font-mono text-sm -dark/60 max-w-xs mb-8">
                    Scan via native iOS/Android camera to directly patch into contact arrays.
                  </p>
                  <button onClick={() => {
                    const link = document.createElement('a');
                    link.href = result;
                    link.download = 'EduCard_Signal.png';
                    link.click();
                  }} className="-dark -light px-8 py-3 rounded-full font-mono text-sm hover:-primary transition-colors">
                    Download Matrix
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};