"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, Plus, Trash2, ArrowRight, ArrowLeft, 
  CheckCircle2, Loader2, Sparkles, DollarSign, 
  Link as LinkIcon, Image as ImageIcon, FileText, 
  Code, Tag, Briefcase, AlertCircle
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { mockAuth, mockProjects } from '@/lib/store';
import { GoogleGenAI, Type } from "@google/genai";

const categories = [
  "AI Models & Chatbots",
  "SaaS Templates",
  "UI/UX Kits",
  "Web Applications",
  "Mobile Apps",
  "E-commerce Solutions",
  "Data Visualization",
  "Blockchain & Web3",
  "Automation Tools",
  "API Integrations"
];

export default function ProjectUpload() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isFirstProject, setIsFirstProject] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    demoUrl: '',
    thumbnail: '',
    images: [] as string[],
    fileUrl: '',
    category: categories[0],
    subcategory: '',
    tags: [] as string[],
    techStack: [] as string[]
  });

  const [newTag, setNewTag] = useState('');
  const [newTech, setNewTech] = useState('');

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const currentUser = mockAuth.getCurrentUser();
        if (!currentUser) {
          router.push('/auth/signin');
          return;
        }
        
        const user = currentUser.user;
        setIsAdmin(user.role === 'admin');
        
        const projects = await mockProjects.getAll();
        const userProjects = (projects || []).filter((p: any) => p.sellerId === user.id || p.authorUsername === user.username);
        setIsFirstProject(userProjects.length === 0);
      } catch (err) {
        console.error('Error checking user status:', err);
      }
    };
    checkUserStatus();
  }, [router]);

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] });
      setNewTag('');
    }
  };

  const handleAddTech = () => {
    if (newTech && !formData.techStack.includes(newTech)) {
      setFormData({ ...formData, techStack: [...formData.techStack, newTech] });
      setNewTech('');
    }
  };

  const handleSubmit = async () => {
    if (!isFirstProject && !isAdmin && !paymentScreenshot) {
      setError('Please upload payment proof screenshot to continue.');
      return;
    }

    setLoading(true);
    setError('');
    
    if (!isFirstProject && !isAdmin) {
      setIsVerifying(true);
      setError('');
      
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });
        const model = "gemini-3-flash-preview";
        
        // Remove base64 prefix
        const base64Data = paymentScreenshot.split(',')[1];
        
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              parts: [
                {
                  text: `Analyze this screenshot. It must be a successful EasyPaisa or JazzCash transaction receipt for Rs. 280 (or $1) sent to +92 3052332590. 
                  Check if:
                  1. It shows "Transaction Successful" or "Payment Sent" or similar success message.
                  2. The amount is Rs. 280 or more.
                  3. The recipient number is +92 3052332590.
                  4. It is a real receipt, not a fake or edited image.
                  
                  Answer strictly in JSON format: { "isValid": boolean, "reason": string }. 
                  If isValid is false, provide a clear reason in "reason" (e.g., "Incorrect amount", "Wrong recipient", "Not a success screen").`
                },
                {
                  inlineData: {
                    mimeType: "image/png",
                    data: base64Data
                  }
                }
              ]
            }
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isValid: { type: Type.BOOLEAN },
                reason: { type: Type.STRING }
              },
              required: ["isValid", "reason"]
            }
          }
        });

        const result = JSON.parse(response.text || '{}');
        
        if (!result.isValid) {
          setError(`Payment Verification Failed: ${result.reason || 'Please provide a correct screenshot of the transaction.'}`);
          setIsVerifying(false);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Gemini Verification Error:', err);
        // Fallback or error message if AI fails
        setError('Could not verify screenshot at this moment. Please try again or contact support.');
        setIsVerifying(false);
        setLoading(false);
        return;
      }
      
      setIsVerifying(false);
    }

    try {
      const currentUser = mockAuth.getCurrentUser();
      if (!currentUser) throw new Error('Not authenticated');
      const user = currentUser.user;

      const projectData = {
        ...formData,
        sellerId: user.id,
        authorUsername: user.username,
        authorName: user.fullName || user.username,
        status: (isFirstProject || isAdmin) ? 'active' : 'pending_approval',
        reviews: 0,
        paymentProof: paymentScreenshot ? {
          transactionId: 'TID-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          screenshotUrl: paymentScreenshot,
          submittedAt: new Date().toISOString()
        } : undefined
      };

      await mockProjects.create(projectData, user.id);

      setSuccess('Project published successfully!');
      setTimeout(() => {
        router.push('/dashboard/seller');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div suppressHydrationWarning className="min-h-screen pt-24 pb-20 px-4 relative overflow-hidden bg-black">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-neon-blue/5 blur-[150px] rounded-full -z-10 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-neon-purple/5 blur-[150px] rounded-full -z-10 animate-pulse"></div>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-neon-blue mb-6"
          >
            <Sparkles size={14} suppressHydrationWarning /> Seller Studio
          </motion.div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tighter mb-4">Upload Your Creation</h1>
          <p className="text-white/40 max-w-xl mx-auto text-sm sm:text-base px-4">Share your digital assets with the world. {isFirstProject ? <span className="text-emerald-400 font-bold">Your first project is FREE and auto-approved!</span> : "A small $1 fee applies to all subsequent uploads."}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 sm:mb-12 relative px-4">
          <div className="h-1 bg-white/5 rounded-full w-full absolute top-1/2 -translate-y-1/2 left-0"></div>
          <div 
            className="h-1 bg-neon-blue rounded-full absolute top-1/2 -translate-y-1/2 left-0 transition-all duration-500"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          ></div>
          <div className="relative flex justify-between">
            {[1, 2, 3].map((s) => (
              <div 
                key={s}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-sm sm:text-base font-bold transition-all duration-300 ${step >= s ? 'bg-neon-blue text-black neon-glow-blue' : 'bg-dark-card border border-white/10 text-white/20'}`}
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 sm:p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-blue animate-gradient-x"></div>

          {error && (
            <div className="mb-6 sm:mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium flex items-center gap-3">
              <AlertCircle size={18} suppressHydrationWarning /> {error}
            </div>
          )}

          {success && (
            <div className="mb-6 sm:mb-8 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-center">
              <CheckCircle2 className="mx-auto mb-4" size={48} suppressHydrationWarning />
              <h3 className="text-xl font-bold mb-2">Upload Successful!</h3>
              <p className="text-sm opacity-80">{success}</p>
              <p className="text-xs mt-4 opacity-50 italic">Redirecting to dashboard...</p>
            </div>
          )}

          {!success && (
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 sm:space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Project Title</label>
                      <div className="relative group">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-neon-blue transition-colors" size={18} suppressHydrationWarning />
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 sm:py-4 pl-12 pr-6 focus:outline-none focus:border-neon-blue transition-all text-sm sm:text-base"
                          placeholder="e.g. AI SaaS Dashboard"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Price (USD)</label>
                      <div className="relative group">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-neon-blue transition-colors" size={18} suppressHydrationWarning />
                        <input
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 sm:py-4 pl-12 pr-6 focus:outline-none focus:border-neon-blue transition-all text-sm sm:text-base"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Description</label>
                    <textarea
                      rows={5}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 sm:py-4 px-6 focus:outline-none focus:border-neon-blue transition-all resize-none text-sm sm:text-base"
                      placeholder="Describe your project in detail..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 sm:py-4 px-6 focus:outline-none focus:border-neon-blue transition-all appearance-none text-sm sm:text-base"
                      >
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Subcategory</label>
                      <input
                        type="text"
                        value={formData.subcategory}
                        onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 sm:py-4 px-6 focus:outline-none focus:border-neon-blue transition-all text-sm sm:text-base"
                        placeholder="e.g. React Components"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button 
                      onClick={nextStep}
                      className="w-full sm:w-auto px-10 py-4 bg-neon-blue text-black font-bold rounded-xl neon-glow-blue hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                      Next Step <ArrowRight size={20} suppressHydrationWarning />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 sm:space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Live Demo URL</label>
                      <div className="relative group">
                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-neon-blue transition-colors" size={18} suppressHydrationWarning />
                        <input
                          type="url"
                          value={formData.demoUrl}
                          onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 sm:py-4 pl-12 pr-6 focus:outline-none focus:border-neon-blue transition-all text-sm sm:text-base"
                          placeholder="https://demo.example.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/40 ml-1">ZIP File / GitHub Link</label>
                      <div className="relative group">
                        <Code className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-neon-blue transition-colors" size={18} suppressHydrationWarning />
                        <input
                          type="text"
                          value={formData.fileUrl}
                          onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 sm:py-4 pl-12 pr-6 focus:outline-none focus:border-neon-blue transition-all text-sm sm:text-base"
                          placeholder="https://github.com/user/repo"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Thumbnail URL</label>
                    <div className="relative group">
                      <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-neon-blue transition-colors" size={18} suppressHydrationWarning />
                      <input
                        type="url"
                        value={formData.thumbnail}
                        onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 sm:py-4 pl-12 pr-6 focus:outline-none focus:border-neon-blue transition-all text-sm sm:text-base"
                        placeholder="https://example.com/thumbnail.jpg"
                      />
                    </div>
                  </div>

                  <div className="p-6 sm:p-8 border-2 border-dashed border-white/10 rounded-2xl sm:rounded-3xl bg-white/5 text-center group hover:border-neon-blue/50 transition-all cursor-pointer">
                    <Upload className="mx-auto mb-4 text-white/20 group-hover:text-neon-blue transition-colors" size={32} suppressHydrationWarning />
                    <h3 className="text-base sm:text-lg font-bold mb-1">Upload Additional Images</h3>
                    <p className="text-xs sm:text-sm text-white/40">Drag and drop or click to browse (Max 5 images)</p>
                    <p className="text-[8px] sm:text-[10px] mt-4 text-white/20 uppercase tracking-widest font-bold">Currently using URL input for demo purposes</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-between pt-4">
                    <button 
                      onClick={prevStep}
                      className="w-full sm:w-auto px-10 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 order-2 sm:order-1"
                    >
                      <ArrowLeft size={20} suppressHydrationWarning /> Previous
                    </button>
                    <button 
                      onClick={nextStep}
                      className="w-full sm:w-auto px-10 py-4 bg-neon-blue text-black font-bold rounded-xl neon-glow-blue hover:scale-105 transition-all flex items-center justify-center gap-2 order-1 sm:order-2"
                    >
                      Next Step <ArrowRight size={20} suppressHydrationWarning />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 sm:space-y-8"
                >
                  <div className="space-y-4">
                    <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Tech Stack</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1 group">
                        <Code className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-neon-blue transition-colors" size={18} suppressHydrationWarning />
                        <input
                          type="text"
                          value={newTech}
                          onChange={(e) => setNewTech(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddTech()}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 sm:py-4 pl-12 pr-6 focus:outline-none focus:border-neon-blue transition-all text-sm sm:text-base"
                          placeholder="e.g. Next.js, Tailwind CSS"
                        />
                      </div>
                      <button 
                        onClick={handleAddTech}
                        className="px-4 sm:px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                      >
                        <Plus size={20} suppressHydrationWarning />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.techStack.map(tech => (
                        <span key={tech} className="px-3 py-1 bg-neon-blue/10 border border-neon-blue/30 rounded-lg text-[10px] sm:text-xs font-bold text-neon-blue flex items-center gap-2">
                          {tech}
                          <button onClick={() => setFormData({ ...formData, techStack: formData.techStack.filter(t => t !== tech) })}>
                            <Trash2 size={12} suppressHydrationWarning />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Tags</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1 group">
                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-neon-blue transition-colors" size={18} suppressHydrationWarning />
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 sm:py-4 pl-12 pr-6 focus:outline-none focus:border-neon-blue transition-all text-sm sm:text-base"
                          placeholder="e.g. dashboard, ai, saas"
                        />
                      </div>
                      <button 
                        onClick={handleAddTag}
                        className="px-4 sm:px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                      >
                        <Plus size={20} suppressHydrationWarning />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-neon-purple/10 border border-neon-purple/30 rounded-lg text-[10px] sm:text-xs font-bold text-neon-purple flex items-center gap-2">
                          #{tag}
                          <button onClick={() => setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })}>
                            <Trash2 size={12} suppressHydrationWarning />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-neon-blue/20 flex items-center justify-center text-neon-blue">
                        <DollarSign size={20} suppressHydrationWarning />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-bold">Upload Summary</h4>
                        <p className="text-[10px] sm:text-xs text-white/40">Review your project details before publishing.</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/40">Upload Fee</span>
                        <span className={(isFirstProject || isAdmin) ? "text-emerald-400 font-bold" : "text-white"}>
                          {(isFirstProject || isAdmin) ? "FREE" : "$1.00 USD (Rs. 280)"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">Approval Status</span>
                        <span className="text-white">{(isFirstProject || isAdmin) ? "Auto-Approved" : "Pending Review"}</span>
                      </div>
                    </div>
                  </div>

                  {(!isFirstProject && !isAdmin) && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 sm:p-8 bg-neon-blue/5 rounded-3xl border border-neon-blue/20 space-y-6 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/10 blur-3xl rounded-full -z-10"></div>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-neon-blue/20 flex items-center justify-center text-neon-blue">
                          <CheckCircle2 size={24} suppressHydrationWarning />
                        </div>
                        <div>
                          <h4 className="text-lg font-black uppercase tracking-tight">Payment Required</h4>
                          <p className="text-xs text-white/40">Please pay $1 (Rs. 280) to the following number.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5 group hover:border-neon-blue/30 transition-colors">
                          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Account Number</p>
                          <p className="text-lg font-black text-neon-blue">+92 3052332590</p>
                        </div>
                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5 group hover:border-neon-blue/30 transition-colors">
                          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Payment Methods</p>
                          <p className="text-sm font-bold text-white">EasyPaisa / JazzCash</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Upload Payment Screenshot</label>
                          <span className="text-[8px] font-black text-neon-blue uppercase tracking-widest bg-neon-blue/10 px-2 py-1 rounded">Required</span>
                        </div>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleScreenshotUpload}
                            className="hidden"
                            id="payment-upload"
                          />
                          <label 
                            htmlFor="payment-upload"
                            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/10 rounded-3xl bg-black/20 hover:border-neon-blue/50 transition-all cursor-pointer group"
                          >
                            {paymentScreenshot ? (
                              <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                                <Image src={paymentScreenshot} alt="Payment Proof" fill className="object-cover" />
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <p className="text-xs font-bold text-white">Click to change screenshot</p>
                                </div>
                              </div>
                            ) : (
                              <>
                                <Upload className="mb-4 text-white/20 group-hover:text-neon-blue transition-colors" size={32} suppressHydrationWarning />
                                <p className="text-sm font-bold mb-1">Click to upload screenshot</p>
                                <p className="text-[10px] text-white/40">Must be a clear EasyPaisa/JazzCash success screen</p>
                              </>
                            )}
                          </label>
                        </div>
                        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-2">
                          <div className="flex items-center gap-2 text-amber-500">
                            <AlertCircle size={14} suppressHydrationWarning />
                            <span className="text-[10px] font-black uppercase tracking-widest">Verification Rules</span>
                          </div>
                          <p className="text-[10px] text-amber-200/60 leading-relaxed">
                            The screenshot must be a <strong>&quot;Transaction Successful&quot;</strong> screen exactly like the official EasyPaisa or JazzCash receipt. It must show:
                          </p>
                          <ul className="text-[9px] text-amber-200/40 space-y-1 list-disc pl-4">
                            <li>Transaction ID (TID)</li>
                            <li>Amount of Rs. 280 (Equivalent to $1)</li>
                            <li>Recipient Number: +92 3052332590</li>
                            <li>Current Date & Time</li>
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4 justify-between pt-4">
                    <button 
                      onClick={prevStep}
                      className="w-full sm:w-auto px-10 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 order-2 sm:order-1"
                    >
                      <ArrowLeft size={20} suppressHydrationWarning /> Previous
                    </button>
                    <button 
                      onClick={handleSubmit}
                      disabled={loading || isVerifying}
                      className="w-full sm:w-auto px-12 py-4 bg-neon-blue text-black font-bold rounded-xl neon-glow-blue hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50 order-1 sm:order-2"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="animate-spin" size={20} suppressHydrationWarning />
                          <span>{isVerifying ? "Verifying Payment..." : "Publishing..."}</span>
                        </div>
                      ) : "Publish Project"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
