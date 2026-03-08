import React, { useState, useRef } from 'react';
import { ArrowLeft, Loader2, QrCode, Download, Link as LinkIcon, Phone, Mail, GraduationCap, Upload, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toPng } from 'html-to-image';

export const GeneratorPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    university: '',
    major: '',
    email: '',
    phone: '',
    portfolio: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [profilePic, setProfilePic] = useState(null); // Background Cover
  const [avatarUrl, setAvatarUrl] = useState(null); // Profile Avatar
  const [isFlipped, setIsFlipped] = useState(false);
  const frontCardRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  // Customization States
  const [nameFont, setNameFont] = useState('font-sans');
  const [nameColor, setNameColor] = useState('#ffffff');
  const [nameSize, setNameSize] = useState(1);
  const [cardTheme, setCardTheme] = useState('dark-glass');

  const themes = {
    'dark-glass': {
      bg: 'bg-gradient-to-br from-[#1a1c29] to-[#0f1016]',
      overlay: 'bg-black/40 backdrop-blur-[2px]',
      text: 'text-light',
      inner: 'bg-light/5 border-light/10 shadow-[inner_0_0_80px_rgba(0,0,0,0.8)]'
    },
    'light-glass': {
      bg: 'bg-gradient-to-br from-white to-gray-200',
      overlay: 'bg-white/30 backdrop-blur-[2px]',
      text: 'text-dark',
      inner: 'bg-dark/5 border-dark/10 shadow-[inner_0_0_80px_rgba(255,255,255,0.8)]'
    },
    'primary-tint': {
      bg: 'bg-gradient-to-br from-primary to-blue-900',
      overlay: 'bg-primary/40 backdrop-blur-[2px] mix-blend-multiply',
      text: 'text-white',
      inner: 'bg-white/10 border-white/20'
    }
  };

  const fonts = [
    { value: 'font-sans', label: 'Modern Sans' },
    { value: 'font-serif', label: 'Elegant Serif' },
    { value: 'font-mono', label: 'Technical Mono' },
    { value: 'font-drama', label: 'Display Signature' },
    { value: 'font-[Impact,sans-serif]', label: 'Impact Bold' },
    { value: 'font-[Georgia,serif]', label: 'Classic Georgia' },
    { value: 'font-[Courier_New,monospace]', label: 'Typewriter' },
    { value: 'font-["Times_New_Roman",Times,serif]', label: 'Traditional Times' },
  ];

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePic(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleAvatarUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // The backend expects firstName and lastName
    const nameParts = formData.name ? formData.name.trim().split(/\s+/) : [];
    const firstName = nameParts.length > 0 ? nameParts[0] : '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const payload = {
      ...formData,
      firstName,
      lastName
    };
    
    try {
      const res = await fetch('http://localhost:8001/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setResult(data.qr_code);
      setIsFlipped(true);
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
    const sanitizedName = formData.name ? formData.name.replace(/\s+/g, '_') : 'Student';
    link.download = `EduCard_QR_${sanitizedName}.png`;
    link.click();
  };

  const exportFrontCard = async () => {
    if (!frontCardRef.current) return;
    try {
      setIsExporting(true);
      // Wait a tick for react to re-render without "Tap to flip" text
      await new Promise(resolve => setTimeout(resolve, 100)); 
      
      const dataUrl = await toPng(frontCardRef.current, {
        cacheBust: true,
        style: { transform: 'none' }, // Ensure 3D transforms don't ruin perspective
        pixelRatio: 2 // High Resolution
      });
      
      const link = document.createElement('a');
      const sanitizedName = formData.name ? formData.name.replace(/\s+/g, '_') : 'Student';
      link.download = `EduCard_Front_${sanitizedName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export card:', err);
      alert('Could not export the ID card image at this time.');
    } finally {
      setIsExporting(false);
    }
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
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1">Profile Avatar (Optional)</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-light/5 border border-light/10 overflow-hidden flex items-center justify-center shrink-0">
                       {avatarUrl ? (
                         <img src={avatarUrl} alt="Avatar preview" className="w-full h-full object-cover" />
                       ) : (
                         <Upload className="w-6 h-6 text-light/20" />
                       )}
                    </div>
                    <label className="cursor-pointer bg-light/5 hover:bg-light/10 text-light text-xs font-mono py-2.5 px-4 rounded-xl transition-all border border-light/10 hover:border-primary">
                      Upload
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1">Background Cover</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-light/5 border border-light/10 overflow-hidden flex items-center justify-center shrink-0">
                       {profilePic ? (
                         <img src={profilePic} alt="Cover preview" className="w-full h-full object-cover" />
                       ) : (
                         <Upload className="w-6 h-6 text-light/20" />
                       )}
                    </div>
                    <label className="cursor-pointer bg-light/5 hover:bg-light/10 text-light text-xs font-mono py-2.5 px-4 rounded-xl transition-all border border-light/10 hover:border-primary">
                      Upload
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1">Full Name *</label>
                <input required name="name" value={formData.name} onChange={handleChange} className="w-full bg-light/5 border border-light/10 rounded-xl px-4 py-3.5 font-sans text-base focus:border-primary focus:bg-light/10 focus:outline-none transition-all placeholder:text-light/20" placeholder="Mohammed Rayyan" />
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

              {/* Customization Options */}
              <div className="pt-8 mt-8 border-t border-light/10 space-y-6">
                <h3 className="font-mono text-xs uppercase tracking-widest text-primary/80 mb-4">Card Styling</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Font Style Selection */}
                  <div className="space-y-2">
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1">Name Font Style</label>
                    <select 
                      value={nameFont} 
                      onChange={(e) => setNameFont(e.target.value)}
                      className="w-full bg-light/5 border border-light/10 rounded-xl px-4 py-3.5 font-sans text-base focus:border-primary focus:bg-light/10 focus:outline-none transition-all text-light appearance-none"
                    >
                      {fonts.map(font => (
                        <option key={font.value} value={font.value} className="bg-dark text-light">{font.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Name Color Selection */}
                  <div className="space-y-2">
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1">Name Color</label>
                    <div className="flex gap-3 h-[52px]">
                      <div className="w-12 h-full rounded-xl border border-light/10 overflow-hidden shrink-0">
                        <input 
                          type="color" 
                          value={nameColor} 
                          onChange={(e) => setNameColor(e.target.value)}
                          className="w-16 h-16 -ml-2 -mt-2 cursor-pointer"
                        />
                      </div>
                      <input 
                        type="text" 
                        value={nameColor} 
                        onChange={(e) => setNameColor(e.target.value)}
                        className="w-full bg-light/5 border border-light/10 rounded-xl px-4 py-3 font-mono text-sm focus:border-primary focus:bg-light/10 focus:outline-none transition-all text-light uppercase"
                      />
                    </div>
                  </div>
                  
                  {/* Name Size Selection */}
                  <div className="space-y-2 sm:col-span-2 mt-4 sm:mt-0">
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1 flex justify-between">
                      <span>Name Size Multiplier</span>
                      <span className="text-primary">{nameSize}x</span>
                    </label>
                    <div className="flex items-center gap-4 h-[52px] bg-light/5 border border-light/10 rounded-xl px-4">
                      <span className="text-light/30 font-mono text-xs">0.5x</span>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="2.0" 
                        step="0.05" 
                        value={nameSize} 
                        onChange={(e) => setNameSize(Number(e.target.value))}
                        className="w-full h-1 bg-light/20 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <span className="text-light/30 font-mono text-xs">2.0x</span>
                    </div>
                  </div>
                </div>

                {/* Theme Selection */}
                <div className="space-y-2">
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1">Card Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.keys(themes).map((themeKey) => (
                      <button
                        key={themeKey}
                        type="button"
                        onClick={() => setCardTheme(themeKey)}
                        className={`py-3 rounded-xl border font-mono text-xs transition-all ${cardTheme === themeKey ? 'bg-primary/20 border-primary text-primary' : 'bg-light/5 border-light/10 text-light/50 hover:border-light/30'}`}
                      >
                        {themeKey.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
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
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => setIsFlipped(!isFlipped)} className="flex items-center gap-2 font-mono text-xs text-light/50 hover:text-primary transition-colors">
                    <RefreshCw className="w-3 h-3" /> Flip Card
                  </button>
                  {result && (
                    <span className="font-mono text-xs text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                      Compiled
                    </span>
                  )}
                </div>
              </div>

              {/* The "Card" - 3D Flippable */}
              <div 
                className="relative w-full max-w-sm mx-auto aspect-[1/1.586] lg:ml-auto cursor-pointer [perspective:1000px] group"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div className={`w-full h-full relative transition-transform duration-700 [transform-style:preserve-3d] shadow-2xl rounded-[2rem] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                  
                  {/* FRONT FACE */}
                  <div 
                    ref={frontCardRef}
                    className="absolute inset-0 w-full h-full rounded-[2rem] overflow-hidden [backface-visibility:hidden] bg-dark"
                  >
                    {/* Background Picture or Fallback Theme */}
                    {profilePic ? (
                      <div className="absolute inset-0 z-0">
                        <img src={profilePic} alt="Background" className="w-full h-full object-cover" />
                        <div className={`absolute inset-0 ${themes[cardTheme].overlay}`}></div>
                      </div>
                    ) : (
                      <div className={`absolute inset-0 z-0 ${themes[cardTheme].bg} border border-light/10`}>
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)] opacity-20"></div>
                      </div>
                    )}
                    
                    {/* Inner Shadow / Frame */}
                    <div className={`absolute inset-0 z-0 pointer-events-none rounded-[2rem] ${themes[cardTheme].inner}`}></div>

                    {/* Card Content - Front */}
                    <div className={`relative z-10 p-6 sm:p-8 h-full flex flex-col items-center justify-between text-center ${themes[cardTheme].text}`}>
                      
                      {/* Logo at Top */}
                      <div className="flex justify-center pt-2">
                        <img src="/LOGO.png" alt="EduCard Logo" className={`w-12 h-12 drop-shadow-lg ${themes[cardTheme].text === 'text-dark' ? 'invert' : ''}`} />
                      </div>

                      {/* Profile Avatar */}
                      {avatarUrl && (
                        <div className="mt-8 mb-auto">
                          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-[4px] border-white/20 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md mx-auto relative group">
                             <div className="absolute inset-0 bg-black/10"></div>
                             <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover relative z-10" />
                          </div>
                        </div>
                      )}

                      {/* Full Screen Name */}
                      <div className="w-full flex-1 flex flex-col justify-center pb-12">
                         <h2 
                            className={`font-bold tracking-tighter leading-[1.1] uppercase break-words px-2 ${nameFont} ${formData.name ? '' : 'opacity-30'}`}
                            style={{ 
                              color: nameColor,
                              fontSize: `clamp(${2.5 * nameSize}rem, ${12 * nameSize}cqw, ${4.5 * nameSize}rem)`,
                              textShadow: cardTheme === 'light-glass' ? '0 4px 20px rgba(0,0,0,0.1)' : '0 4px 30px rgba(0,0,0,0.5)'
                            }}
                          >
                            {formData.name ? (
                              formData.name.split(' ').map((word, i) => (
                                <React.Fragment key={i}>
                                  {word}
                                  {i !== formData.name.split(' ').length - 1 && <br />}
                                </React.Fragment>
                              ))
                            ) : (
                              <>STUDENT<br />NAME</>
                            )}
                          </h2>
                      </div>
                      
                      {/* Front Face QR Code (Only visible when generated) */}
                      {result && (
                        <div className="absolute bottom-6 right-6 w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/20 shadow-xl z-20">
                          <img src={result} alt="QR Code" className="w-full h-full object-contain" />
                        </div>
                      )}

                      {/* Small Call to action indicating flip */}
                      {!isExporting && (
                        <div className="absolute bottom-6 opacity-30 text-[10px] font-mono tracking-widest uppercase z-10">
                          Tap to flip
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BACK FACE */}
                  <div className="absolute inset-0 w-full h-full rounded-[2rem] overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    {/* Card Background / Texture */}
                    <div className="absolute inset-0 bg-gradient-to-tl from-[#1a1c29] to-[#0f1016] border border-light/10 shadow-[inner_0_0_80px_rgba(0,0,0,0.8)] z-0"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3 z-0 pointer-events-none"></div>

                    {/* Card Content - Back */}
                    <div className="relative z-10 p-6 sm:p-8 h-full flex flex-col">
                      
                      {/* Top section: Identity Vectors */}
                      <div className="flex-1 space-y-4">
                         {/* Name again smaller for reference */}
                         <div>
                            <h3 className={`font-sans font-bold text-2xl tracking-tight text-light mb-1 ${formData.name ? '' : 'opacity-40'}`}>
                              {formData.name || 'Student Name'}
                            </h3>
                            {/* Education */}
                            <div className="flex flex-col gap-1 text-light/70">
                              {formData.university && (
                                <p className="font-mono text-xs uppercase tracking-wider flex items-center gap-2 text-light/90">
                                  <GraduationCap className="w-3 h-3 text-primary" />
                                  {formData.university}
                                </p>
                              )}
                              {formData.major && (
                                <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
                                  {formData.major}
                                </p>
                              )}
                            </div>
                         </div>
                         
                         {/* Contact Details Grid */}
                         <div className="pt-4 border-t border-light/10 space-y-3">
                           {(!formData.email && !formData.phone && !formData.portfolio) ? (
                               <div className="text-light/30 font-mono text-xs italic">Awaiting Contact Vectors...</div>
                           ) : (
                             <>
                               {formData.email && (
                                 <div className="flex items-center gap-3 text-[10px] sm:text-xs font-mono text-light/90">
                                   <div className="w-5 h-5 rounded bg-light/5 border border-light/10 flex items-center justify-center shrink-0 text-primary"><Mail className="w-3 h-3" /></div>
                                   <span className="truncate">{formData.email}</span>
                                 </div>
                               )}
                               
                               {formData.phone && (
                                 <div className="flex items-center gap-3 text-[10px] sm:text-xs font-mono text-light/90">
                                   <div className="w-5 h-5 rounded bg-light/5 border border-light/10 flex items-center justify-center shrink-0 text-primary"><Phone className="w-3 h-3" /></div>
                                   <span className="truncate">{formData.phone}</span>
                                 </div>
                               )}

                               {formData.portfolio && (
                                 <div className="flex items-center gap-3 text-[10px] sm:text-xs font-mono text-light/90">
                                   <div className="w-5 h-5 rounded bg-light/5 border border-light/10 flex items-center justify-center shrink-0 text-primary"><LinkIcon className="w-3 h-3" /></div>
                                   <span className="truncate">{formData.portfolio.replace(/^https?:\/\//, '')}</span>
                                 </div>
                               )}
                             </>
                           )}
                         </div>
                      </div>

                      {/* Bottom section: Matrix Logo and QR Code side by side */}
                      <div className="mt-auto pt-6 border-t border-light/10 flex items-end justify-between gap-4">
                        <div className="pb-1">
                          <img src="/LOGO.png" alt="EduCard Logo" className="w-8 h-8 opacity-80 mb-2" />
                          <h3 className="font-sans font-bold text-lg tracking-tighter text-light leading-none">EduCard.</h3>
                          <p className="font-mono text-[8px] tracking-widest uppercase text-primary mt-1">Verified Node</p>
                        </div>

                        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl bg-white/5 border border-light/10 flex items-center justify-center overflow-hidden shrink-0">
                          {result ? (
                            <div className="absolute inset-0 w-full h-full bg-white p-2 z-10">
                              <img src={result} alt="vCard QR" className="w-full h-full object-contain" />
                            </div>
                          ) : (
                            <div className="text-center p-2 z-10">
                              <QrCode className="w-6 h-6 text-light/20 mx-auto mb-1" strokeWidth={1} />
                              <div className="text-[8px] font-mono text-light/30 uppercase tracking-widest leading-tight">Awaiting<br/>Build</div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                    </div>
                  </div>

                </div>
              </div>

              {/* Download Action Area */}
              <div className={`mt-8 flex flex-col sm:flex-row justify-center gap-4 transition-all duration-500 ${result ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none absolute w-full'}`}>
                 <button 
                  onClick={downloadQR} 
                  className="flex items-center justify-center gap-2 bg-light/10 text-light border border-light/20 font-mono text-xs sm:text-sm font-bold px-6 py-4 rounded-xl hover:bg-light/20 transition-all"
                >
                  <Download className="w-4 h-4" />
                  QR Data
                </button>
                 <button 
                  onClick={exportFrontCard} 
                  disabled={isExporting}
                  className="flex flex-1 items-center justify-center gap-2 bg-primary text-light font-mono text-xs sm:text-sm font-bold px-8 py-4 rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {isExporting ? 'Exporting...' : 'Export Front Card (PNG)'}
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};