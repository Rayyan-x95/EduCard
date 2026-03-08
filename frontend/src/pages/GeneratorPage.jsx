import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Loader2, QrCode, Download, Link as LinkIcon, Phone, Mail, GraduationCap, Upload, RefreshCw, Trash2, Share2, Linkedin, Twitter, Github, Printer, Wand2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { toPng } from 'html-to-image';
import QRCodeStyling from 'qr-code-styling';
import jsPDF from 'jspdf';

export const GeneratorPage = () => {
  const [searchParams] = useSearchParams();

  // Load initial state from localStorage if available
  const [formData, setFormData] = useState(() => {
    // 1. Check URL for shareable data
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        return JSON.parse(atob(dataParam));
      } catch (e) {
         console.error('Failed to parse shareable link', e);
      }
    }

    // 2. Fallback to local storage
    const saved = localStorage.getItem('educard_draft');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
         console.error('Failed to parse saved draft', e);
      }
    }
    return {
      name: '',
      university: '',
      major: '',
      email: '',
      phone: '',
      portfolio: '',
      linkedin: '',
      twitter: '',
      github: '',
      bio: ''
    };
  });

  // Save to localStorage when form data changes
  useEffect(() => {
    localStorage.setItem('educard_draft', JSON.stringify(formData));
  }, [formData]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [profilePic, setProfilePic] = useState(null); // Background Cover
  const [avatarUrl, setAvatarUrl] = useState(null); // Profile Avatar
  const [isFlipped, setIsFlipped] = useState(false);
  const frontCardRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const backCardRef = useRef(null);

  // 3D Parallax State
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const handleMouseMove = useCallback((e) => {
    if (!frontCardRef.current || isExporting) return;
    const rect = frontCardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // Max rotation 12 degrees
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;
    setTilt({ x: rotateX, y: rotateY });
  }, [isExporting]);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  // Image Upload States
  const onSelectFile = (e, type) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const result = reader.result?.toString() || '';
        if (type === 'avatar') {
          setAvatarUrl(result);
        } else {
          setProfilePic(result);
        }
      });
      reader.readAsDataURL(e.target.files[0]);
      e.target.value = ''; // reset input
    }
  };

  // Customization States
  const [nameFont, setNameFont] = useState('font-sans');
  const [nameColor, setNameColor] = useState('#ffffff');
  const [nameSize, setNameSize] = useState(1);
  const [nameWeight, setNameWeight] = useState(700);
  const [nameSpacing, setNameSpacing] = useState(0);
  const [avatarRoundness, setAvatarRoundness] = useState(25);
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateVCard = (data) => {
    return `BEGIN:VCARD
VERSION:3.0
FN:${data.name || ''}
ORG:${data.university || ''}
TITLE:${data.major || ''}
EMAIL:${data.email || ''}
TEL:${data.phone || ''}
URL:${data.portfolio || ''}
END:VCARD`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!avatarUrl) {
      alert('Please upload a Profile Avatar before generating the card.');
      return;
    }
    if (!formData.phone) {
      alert('Please provide a Phone number before generating the card.');
      return;
    }
    setLoading(true);
    
    try {
      const vCardText = generateVCard(formData);
      
      const qrCode = new QRCodeStyling({
        width: 800,
        height: 800,
        data: vCardText,
        image: "/LOGO.png",
        margin: 10,
        qrOptions: {
          errorCorrectionLevel: "H"
        },
        dotsOptions: {
          color: "#000000",
          type: "rounded"
        },
        cornersSquareOptions: {
          color: "#000000",
          type: "extra-rounded"
        },
        cornersDotOptions: {
          color: "#000000",
          type: "dot"
        },
        imageOptions: {
          crossOrigin: "anonymous",
          margin: 10,
          imageSize: 0.3
        }
      });

      const blob = await qrCode.getRawData("png");
      if (!blob) throw new Error("Failed to generate styled QR code.");
      const qrDataUrl = URL.createObjectURL(blob);

      setResult(qrDataUrl);
      setIsFlipped(true);
    } catch (err) {
      console.error(err);
      alert('Failed to generate QR code locally.');
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result;
    const sanitizedName = formData.name ? formData.name.replace(/\s+/g, '_') : 'Student';
    link.download = `EduCard_${sanitizedName}.png`;
    link.click();
  };

  const exportFrontCard = async () => {
    if (!frontCardRef.current) return;
    try {
      setIsExporting(true);
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

  const exportBackCard = async () => {
    if (!backCardRef.current) return;
    try {
      setIsExporting(true);
      await new Promise(resolve => setTimeout(resolve, 100)); 
      
      const dataUrl = await toPng(backCardRef.current, {
        cacheBust: true,
        style: { transform: 'none' }, // Ensure 3D transforms don't ruin perspective
        pixelRatio: 2 // High Resolution
      });
      
      const link = document.createElement('a');
      const sanitizedName = formData.name ? formData.name.replace(/\s+/g, '_') : 'Student';
      link.download = `EduCard_Back_${sanitizedName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export back card:', err);
      alert('Could not export the ID card image at this time.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportPDF = async () => {
    if (!frontCardRef.current || !backCardRef.current) return;
    try {
      setIsExporting(true);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const frontDataUrl = await toPng(frontCardRef.current, { cacheBust: true, style: { transform: 'none' }, pixelRatio: 2 });
      const backDataUrl = await toPng(backCardRef.current, { cacheBust: true, style: { transform: 'none' }, pixelRatio: 2 });
      
      // Create A4 PDF (210 x 297 mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Card standard size is approx 54mm x 86mm, but let's make it 63mm x 100mm to match our visual aspect ratio (1 : 1.586)
      const cardW = 63;
      const cardH = 100;
      const marginX = (210 - (cardW * 2 + 10)) / 2; // Center horizontally
      
      pdf.setFontSize(16);
      pdf.text('EduCard - Print Layout', 105, 20, { align: 'center' });
      pdf.setFontSize(10);
      pdf.text('Cut along the edges and fold in the middle.', 105, 26, { align: 'center' });
      
      // Front Card
      pdf.addImage(frontDataUrl, 'PNG', marginX, 40, cardW, cardH);
      
      // Back Card
      pdf.addImage(backDataUrl, 'PNG', marginX + cardW + 10, 40, cardW, cardH);
      
      // Draw fold dashed line between them
      pdf.setLineDash([2, 2], 0);
      pdf.line(marginX + cardW + 5, 35, marginX + cardW + 5, 40 + cardH + 5);
      
      const sanitizedName = formData.name ? formData.name.replace(/\s+/g, '_') : 'Student';
      pdf.save(`EduCard_Print_${sanitizedName}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Could not generate PDF at this time.');
    } finally {
      setIsExporting(false);
    }
  };

  const generateShareableLink = () => {
    const encoded = btoa(JSON.stringify(formData));
    const url = `${window.location.origin}/generate?data=${encoded}`;
    navigator.clipboard.writeText(url);
    alert('Shareable link copied to clipboard!');
  };

  const clearCanvas = () => {
    if(window.confirm('Wipe canvas and start fresh? All local data will be lost.')) {
      localStorage.removeItem('educard_draft');
      setFormData({
        name: '', university: '', major: '', email: '', phone: '', portfolio: '', bio: '', linkedin: '', twitter: '', github: ''
      });
      setProfilePic(null);
      setAvatarUrl(null);
      setResult(null);
      setIsFlipped(false);
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
            <Link to="/roadmap" className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded border border-primary/20 bg-primary/10 ml-1 hover:scale-105 transition-transform cursor-pointer">
               <span className="font-mono text-[9px] uppercase tracking-wider text-primary font-bold">V2 In Progress</span>
            </Link>
            <div className="h-4 w-px bg-light/20 mx-1"></div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="font-mono text-xs text-primary uppercase tracking-widest">Generator Active</span>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 relative items-start">
          
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
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1">Profile Avatar *</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-light/5 border border-light/10 overflow-hidden flex items-center justify-center shrink-0">
                       {avatarUrl ? (
                         <img src={avatarUrl} alt="Avatar preview" className="w-full h-full object-cover" />
                       ) : (
                         <Upload className="w-6 h-6 text-light/20" />
                       )}
                    </div>
                    <label className="cursor-pointer bg-light/5 hover:bg-light/10 text-light text-xs font-mono py-2.5 px-4 rounded-xl transition-all border border-light/10 hover:border-primary">
                      Upload
                      <input type="file" accept="image/*" onChange={(e) => onSelectFile(e, 'avatar')} className="hidden" />
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
                      <input type="file" accept="image/*" onChange={(e) => onSelectFile(e, 'background')} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="input-name" className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1">Full Name *</label>
                <input id="input-name" required name="name" value={formData.name} onChange={handleChange} className={`w-full bg-light/5 border rounded-xl px-4 py-3.5 font-sans text-base focus:outline-none transition-all placeholder:text-light/20 ${formData.name.length > 0 ? 'border-primary/50 focus:border-primary focus:bg-light/10' : 'border-light/10 focus:border-light/30'}`} placeholder="Joe Smith" />
              </div>

              <div className="space-y-2">
                <label htmlFor="input-university" className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1">University / Institution *</label>
                <input id="input-university" required name="university" value={formData.university} onChange={handleChange} className={`w-full bg-light/5 border rounded-xl px-4 py-3.5 font-sans text-base focus:outline-none transition-all placeholder:text-light/20 ${formData.university.length > 0 ? 'border-primary/50 focus:border-primary focus:bg-light/10' : 'border-light/10 focus:border-light/30'}`} placeholder="Stanford University" />
              </div>

              <div className="space-y-2">
                <label htmlFor="input-major" className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1">Major / Prefix *</label>
                <input id="input-major" required name="major" value={formData.major} onChange={handleChange} className={`w-full bg-light/5 border rounded-xl px-4 py-3.5 font-sans text-base focus:outline-none transition-all placeholder:text-light/20 ${formData.major.length > 0 ? 'border-primary/50 focus:border-primary focus:bg-light/10' : 'border-light/10 focus:border-light/30'}`} placeholder="B.S. Computer Science" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="input-email" className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1">Email Node *</label>
                  <input id="input-email" required type="email" name="email" value={formData.email} onChange={handleChange} className={`w-full bg-light/5 border rounded-xl px-4 py-3.5 font-sans text-base focus:outline-none transition-all placeholder:text-light/20 ${formData.email.includes('@') ? 'border-primary/50 focus:border-primary focus:bg-light/10' : formData.email.length > 0 ? 'border-red-400 focus:border-red-500' : 'border-light/10 focus:border-light/30'}`} placeholder="jdoe@edu.org" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="input-phone" className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1">Phone Vector *</label>
                  <input id="input-phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} required className={`w-full bg-light/5 border rounded-xl px-4 py-3.5 font-sans text-base focus:outline-none transition-all placeholder:text-light/20 ${formData.phone.length > 0 ? 'border-primary/50 focus:border-primary focus:bg-light/10' : 'border-light/10 focus:border-light/30'}`} placeholder="+1 (555) 000-0000" />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="input-portfolio" className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1">Portfolio / Network URL</label>
                <input id="input-portfolio" type="url" name="portfolio" value={formData.portfolio} onChange={handleChange} className={`w-full bg-light/5 border rounded-xl px-4 py-3.5 font-sans text-base focus:outline-none transition-all placeholder:text-light/20 ${formData.portfolio.includes('http') ? 'border-primary/50 focus:border-primary focus:bg-light/10' : formData.portfolio.length > 0 ? 'border-red-400 focus:border-red-500' : 'border-light/10 focus:border-light/30'}`} placeholder="https://github.com/jdoe" />
              </div>

              <div className="space-y-2">
                <label htmlFor="input-bio" className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1">Short Bio</label>
                <textarea id="input-bio" name="bio" value={formData.bio} onChange={handleChange} maxLength="120" className={`w-full bg-light/5 border rounded-xl px-4 py-3.5 font-sans text-base focus:outline-none transition-all placeholder:text-light/20 resize-none h-24 ${formData.bio?.length > 0 ? 'border-primary/50 focus:border-primary focus:bg-light/10' : 'border-light/10 focus:border-light/30'}`} placeholder="Student by day, developer by night..." />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="input-linkedin" className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1"><Linkedin className="w-3 h-3 inline mr-1" />LinkedIn</label>
                  <input id="input-linkedin" type="text" name="linkedin" value={formData.linkedin} onChange={handleChange} className="w-full bg-light/5 border border-light/10 rounded-xl px-4 py-3 font-sans text-sm focus:border-primary focus:bg-light/10 focus:outline-none transition-all" placeholder="username" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="input-twitter" className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1"><Twitter className="w-3 h-3 inline mr-1" />Twitter/X</label>
                  <input id="input-twitter" type="text" name="twitter" value={formData.twitter} onChange={handleChange} className="w-full bg-light/5 border border-light/10 rounded-xl px-4 py-3 font-sans text-sm focus:border-primary focus:bg-light/10 focus:outline-none transition-all" placeholder="@username" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="input-github" className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1"><Github className="w-3 h-3 inline mr-1" />Github</label>
                  <input id="input-github" type="text" name="github" value={formData.github} onChange={handleChange} className="w-full bg-light/5 border border-light/10 rounded-xl px-4 py-3 font-sans text-sm focus:border-primary focus:bg-light/10 focus:outline-none transition-all" placeholder="username" />
                </div>
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
                  <div className="space-y-2 mt-4 sm:mt-0">
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1 flex justify-between">
                      <span>Width</span>
                      <span className="text-primary">{nameSize}x</span>
                    </label>
                    <div className="flex items-center gap-4 h-[52px] bg-light/5 border border-light/10 rounded-xl px-4">
                      <span className="text-light/30 font-mono text-xs">0.5</span>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="2.0" 
                        step="0.05" 
                        value={nameSize} 
                        onChange={(e) => setNameSize(Number(e.target.value))}
                        className="w-full h-1.5 bg-light/20 rounded-lg appearance-none cursor-pointer accent-primary"
                        style={{
                           background: `linear-gradient(to right, var(--primary) ${((nameSize - 0.5) / 1.5) * 100}%, rgba(255,255,255,0.2) ${((nameSize - 0.5) / 1.5) * 100}%)`
                        }}
                      />
                      <span className="text-light/30 font-mono text-xs">2.0</span>
                    </div>
                  </div>

                  {/* Name Weight Selection */}
                  <div className="space-y-2 mt-4 sm:mt-0">
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1 flex justify-between">
                      <span>Weight</span>
                      <span className="text-primary">{nameWeight}</span>
                    </label>
                    <div className="flex items-center gap-4 h-[52px] bg-light/5 border border-light/10 rounded-xl px-4">
                      <span className="text-light/30 font-mono text-xs">100</span>
                      <input 
                        type="range" 
                        min="100" 
                        max="900" 
                        step="100" 
                        value={nameWeight} 
                        onChange={(e) => setNameWeight(Number(e.target.value))}
                        className="w-full h-1.5 bg-light/20 rounded-lg appearance-none cursor-pointer accent-primary"
                        style={{
                           background: `linear-gradient(to right, var(--primary) ${((nameWeight - 100) / 800) * 100}%, rgba(255,255,255,0.2) ${((nameWeight - 100) / 800) * 100}%)`
                        }}
                      />
                      <span className="text-light/30 font-mono text-xs">900</span>
                    </div>
                  </div>

                  {/* Name Letter Spacing Selection */}
                  <div className="space-y-2 mt-4 sm:mt-0">
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1 flex justify-between">
                      <span>Text Spacing</span>
                      <span className="text-primary">{nameSpacing}px</span>
                    </label>
                    <div className="flex items-center gap-4 h-[52px] bg-light/5 border border-light/10 rounded-xl px-4">
                      <span className="text-light/30 font-mono text-xs">-10</span>
                      <input 
                        type="range" 
                        min="-10" 
                        max="30" 
                        step="1" 
                        value={nameSpacing} 
                        onChange={(e) => setNameSpacing(Number(e.target.value))}
                        className="w-full h-1.5 bg-light/20 rounded-lg appearance-none cursor-pointer accent-primary"
                        style={{
                           background: `linear-gradient(to right, var(--primary) ${((nameSpacing + 10) / 40) * 100}%, rgba(255,255,255,0.2) ${((nameSpacing + 10) / 40) * 100}%)`
                        }}
                      />
                      <span className="text-light/30 font-mono text-xs">30</span>
                    </div>
                  </div>

                  {/* Avatar Roundness Selection */}
                  <div className="space-y-2 mt-4 sm:mt-0 sm:col-span-2">
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-light/70 ml-1 flex justify-between">
                      <span>Roundness</span>
                      <span className="text-primary">{avatarRoundness}%</span>
                    </label>
                    <div className="flex items-center gap-4 h-[52px] bg-light/5 border border-light/10 rounded-xl px-4">
                      <span className="text-light/30 font-mono text-xs">0%</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="50" 
                        step="1" 
                        value={avatarRoundness} 
                        onChange={(e) => setAvatarRoundness(Number(e.target.value))}
                        className="w-full h-1.5 bg-light/20 rounded-lg appearance-none cursor-pointer accent-primary"
                        style={{
                           background: `linear-gradient(to right, var(--primary) ${(avatarRoundness / 50) * 100}%, rgba(255,255,255,0.2) ${(avatarRoundness / 50) * 100}%)`
                        }}
                      />
                      <span className="text-light/30 font-mono text-xs">50%</span>
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

              <div className="pt-6 flex flex-col sm:flex-row gap-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-[2] w-full group relative overflow-hidden bg-primary text-light font-bold font-mono py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                  {loading ? (
                    <><Loader2 className="animate-spin w-5 h-5 relative z-10" /><span className="relative z-10">Compiling Matrix...</span></>
                  ) : (
                    <><QrCode className="w-5 h-5 relative z-10" /><span className="relative z-10">Execute Build</span></>
                  )}
                </button>
                <div className="flex flex-1 gap-2">
                  <button
                    type="button"
                    onClick={generateShareableLink}
                    disabled={!result}
                    title="Copy Shareable Link"
                    className="flex-1 flex items-center justify-center bg-light/5 border border-light/10 text-light rounded-xl hover:bg-light/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    title="Initialize Wipe Canvas"
                    className="flex-1 flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
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
                className="relative w-full max-w-sm mx-auto aspect-[1/1.586] lg:ml-auto cursor-pointer [perspective:2000px] group transition-transform duration-200 ease-out"
                onClick={() => setIsFlipped(!isFlipped)}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setTilt({ x: 0, y: 0 })}
                style={{
                  transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg) scale3d(1.02, 1.02, 1.02)`,
                }}
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

                    {/* Holographic Strip */}
                    <div className="absolute right-6 top-0 bottom-0 w-4 sm:w-6 z-[5] pointer-events-none overflow-hidden before:absolute before:inset-0 before:bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.8),transparent)] before:mix-blend-overlay after:absolute after:inset-0 after:bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] after:opacity-50 flex items-center justify-center">
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,#ff0000_0%,#ff7f00_15%,#ffff00_30%,#00ff00_50%,#0000ff_65%,#4b0082_85%,#9400d3_100%)] opacity-30 mix-blend-color-burn"></div>
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.6)_50%,transparent_75%)] bg-[length:200%_200%] animate-[shimmer_2s_infinite]"></div>
                      <div className="absolute inset-0 flex flex-col items-center justify-around py-8">
                        {[1, 2, 3, 4, 5].map(i => (
                          <span key={i} className="font-sans font-black text-black/80 text-[8px] sm:text-[10px] tracking-[0.4em] uppercase [writing-mode:vertical-rl] mix-blend-overlay">EDUCARD.</span>
                        ))}
                      </div>
                    </div>

                    {/* Card Content - Front */}
                    <div className={`relative z-10 p-6 sm:p-8 h-full flex flex-col items-center justify-between text-center ${themes[cardTheme].text}`}>
                      
                      {/* Logo at Top */}
                      <div className="flex justify-center pt-2">
                        <img src="/LOGO.png" alt="EduCard Logo" className={`w-12 h-12 drop-shadow-lg ${themes[cardTheme].text === 'text-dark' ? 'invert' : ''}`} />
                      </div>

                      {/* Profile Avatar */}
                      {avatarUrl && (
                        <div className="mt-8 mb-auto">
                          <div 
                             className="w-32 h-32 sm:w-40 sm:h-40 border-[4px] border-white/20 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md mx-auto relative group transition-all"
                             style={{ borderRadius: `${avatarRoundness}%` }}
                          >
                             <div className="absolute inset-0 bg-black/10"></div>
                             <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover relative z-10" />
                          </div>
                        </div>
                      )}

                      {/* Full Screen Name */}
                      <div className="w-full flex-1 flex flex-col justify-center pb-12">
                         <h2 
                            className={`leading-[1.1] uppercase break-words px-2 ${nameFont} ${formData.name ? '' : 'opacity-30'}`}
                            style={{ 
                              color: nameColor,
                              fontSize: `clamp(${2.5 * nameSize}rem, ${12 * nameSize}cqw, ${4.5 * nameSize}rem)`,
                              fontWeight: nameWeight,
                              letterSpacing: `${nameSpacing}px`,
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
                      
                      {/* Front Face QR Code (Only visible when exporting) */}
                      {result && isExporting && (
                        <div className="absolute bottom-6 right-6 w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/20 shadow-xl z-20">
                          <img src={result} alt="QR Code" className="w-full h-full object-contain" />
                        </div>
                      )}

{/* Organic Authentication Seal (Only visible when exporting) */}
                        {isExporting && (
                          <div className={`absolute bottom-6 left-6 w-16 h-16 sm:w-20 sm:h-20 rounded-full z-20 flex items-center justify-center border shadow-lg backdrop-blur-md ${themes[cardTheme].text === 'text-dark' ? 'border-black/20 bg-white/30' : 'border-white/20 bg-black/30'}`}>
                            <div className={`absolute inset-[3px] rounded-full border border-dashed ${themes[cardTheme].text === 'text-dark' ? 'border-black/30' : 'border-white/30'}`}></div>
                            <img src="/LOGO.png" alt="Authentic Seal" className={`w-6 h-6 sm:w-8 sm:h-8 relative z-10 opacity-90 ${themes[cardTheme].text === 'text-dark' ? 'invert' : ''}`} />
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
                  <div 
                    ref={backCardRef}
                    className="absolute inset-0 w-full h-full rounded-[2rem] overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)]"
                  >
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
              <div className={`mt-8 flex flex-col justify-center gap-4 transition-all duration-500 ${result ? 'opacity-100 translate-y-0 relative' : 'opacity-0 translate-y-4 pointer-events-none absolute'}`}>
                 <div className="flex flex-col sm:flex-row gap-4">
                   <button 
                    type="button"
                    onClick={downloadQR} 
                    className="flex-1 flex items-center justify-center gap-2 bg-light/10 text-light border border-light/20 font-mono text-xs font-bold px-6 py-4 rounded-xl hover:bg-light/20 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    QR Code
                  </button>
                   <button 
                    type="button"
                    onClick={exportFrontCard} 
                    disabled={isExporting}
                    className="flex-[2] flex items-center justify-center gap-2 bg-primary text-light font-mono text-xs font-bold px-8 py-4 rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Export Front
                  </button>
                 </div>
                 
                 <div className="flex flex-col sm:flex-row gap-4">
                   <button 
                    type="button"
                    onClick={exportBackCard} 
                    disabled={isExporting}
                    className="flex-1 flex items-center justify-center gap-2 bg-dark/50 border border-primary/30 text-primary font-mono text-xs font-bold px-8 py-4 rounded-xl hover:bg-primary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Export Details Back
                  </button>
                   <button 
                    type="button"
                    onClick={exportPDF} 
                    disabled={isExporting}
                    className="flex-1 flex items-center justify-center gap-2 bg-purple-500/20 border border-purple-500/50 text-purple-400 font-mono text-xs font-bold px-8 py-4 rounded-xl hover:bg-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                    Print as PDF
                  </button>
                 </div>
              </div>

            </div>
          </div>

        </main>
      </div>

    </div>
  );
};