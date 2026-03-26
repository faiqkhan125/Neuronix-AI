"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Mail, Calendar, Briefcase, ShoppingBag, Heart, 
  CreditCard, ExternalLink, ShieldCheck, Star, 
  Edit3, Camera, Plus, Trash2, CheckCircle2, 
  Globe, Wallet, Landmark, DollarSign, Smartphone,
  X, Save, Loader2
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { mockAuth, getStore, saveStore, mockProjects } from '@/lib/store';

export default function PublicProfile() {
  const params = useParams();
  const router = useRouter();
  const usernameParam = params.username as string;
  const cleanUsername = usernameParam.startsWith('%40') || usernameParam.startsWith('@') 
    ? decodeURIComponent(usernameParam).replace('@', '') 
    : usernameParam;

  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editedBio, setEditedBio] = useState('');
  const [editedAvatarUrl, setEditedAvatarUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const fetchData = async () => {
      try {
        const store = getStore();
        const foundProfile = store.profiles.find((p: any) => p.username === cleanUsername);
        if (!foundProfile) throw new Error('Profile not found');
        
        setProfile(foundProfile);
        setEditedBio(foundProfile.bio || '');
        setEditedAvatarUrl(foundProfile.avatarUrl || foundProfile.avatar_url || null);
        
        const allProjects = await mockProjects.getAll();
        const userProjects = allProjects.filter((p: any) => p.authorUsername === cleanUsername);
        setProjects(userProjects);

        const current = mockAuth.getCurrentUser();
        setCurrentUser(current?.user || null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [cleanUsername]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePhoto = () => {
    setEditedAvatarUrl(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const store = getStore();
      const profileIndex = store.profiles.findIndex((p: any) => p.userId === profile.userId);
      
      if (profileIndex !== -1) {
        const updatedProfile = {
          ...store.profiles[profileIndex],
          bio: editedBio,
          avatarUrl: editedAvatarUrl,
          avatar_url: editedAvatarUrl // Keep both for compatibility
        };
        
        store.profiles[profileIndex] = updatedProfile;
        
        // If this is the current user, update their session too
        const current = mockAuth.getCurrentUser();
        if (current && current.user.id === profile.userId) {
          saveStore({ 
            profiles: store.profiles,
            currentUser: { ...current, profile: updatedProfile }
          });
        } else {
          saveStore({ profiles: store.profiles });
        }
        
        setProfile(updatedProfile);
        setIsEditing(false);
        
        // Dispatch event to update navbar etc
        window.dispatchEvent(new Event('auth-change'));
      }
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <User className="text-red-400" size={40} suppressHydrationWarning />
        </div>
        <h1 className="text-3xl font-black tracking-tighter mb-2">Profile Not Found</h1>
        <p className="text-white/40 mb-8 text-center max-w-md">The user you are looking for does not exist or has been removed from our system.</p>
        <Link href="/" className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-all">Back to Home</Link>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.userId;
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div suppressHydrationWarning className="min-h-screen pt-20 sm:pt-24 pb-20 px-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-neon-blue/5 blur-[80px] sm:blur-[120px] rounded-full -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-neon-purple/5 blur-[80px] sm:blur-[120px] rounded-full -z-10"></div>

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="glass-card p-6 sm:p-8 md:p-12 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-blue animate-gradient-x"></div>
          
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="relative group shrink-0">
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-3xl bg-white/5 border border-white/10 overflow-hidden relative neon-glow-blue/10">
                {isEditing ? (
                  <div className="w-full h-full relative">
                    {editedAvatarUrl ? (
                      <Image 
                        src={editedAvatarUrl} 
                        alt="Preview" 
                        fill 
                        className="object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/5">
                        <User size={48} className="text-white/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 sm:p-3 bg-neon-blue text-black rounded-full hover:scale-110 transition-all"
                      >
                        <Camera size={20} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <Image 
                    src={profile.avatarUrl || profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} 
                    alt={profile.fullName} 
                    fill 
                    className="object-cover" 
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
              
              {isEditing && (
                <div className="absolute -bottom-2 -right-2 flex gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-neon-blue text-black rounded-lg shadow-lg hover:scale-110 transition-all"
                    title="Change Photo"
                  >
                    <Camera size={14} />
                  </button>
                  {editedAvatarUrl && (
                    <button 
                      onClick={handleDeletePhoto}
                      className="p-2 bg-red-500 text-white rounded-lg shadow-lg hover:scale-110 transition-all"
                      title="Delete Photo"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )}
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                className="hidden" 
                accept="image/*" 
              />
            </div>

            <div className="flex-1 text-center md:text-left min-w-0">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter truncate">{profile.fullName}</h1>
                <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/60">@{profile.username}</span>
                  {profile.role === 'admin' && (
                    <span className="px-3 py-1 bg-neon-blue/20 border border-neon-blue/30 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-neon-blue">Admin</span>
                  )}
                  {profile.role === 'seller' && (
                    <span className="px-3 py-1 bg-neon-purple/20 border border-neon-purple/30 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-neon-purple">Freelancer</span>
                  )}
                  {profile.role === 'buyer' && (
                    <span className="px-3 py-1 bg-neon-blue/20 border border-neon-blue/30 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-neon-blue">Client</span>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-2 mb-6">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Edit Bio</label>
                  <textarea
                    value={editedBio}
                    onChange={(e) => setEditedBio(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-neon-blue transition-all text-white/80 resize-none h-32 text-sm sm:text-base"
                    placeholder="Tell the world about yourself..."
                  />
                </div>
              ) : (
                <p className="text-white/60 text-base sm:text-lg mb-6 max-w-2xl leading-relaxed">
                  {profile.bio || "This user hasn't added a bio yet. They're probably busy building something awesome!"}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6 text-[10px] sm:text-sm text-white/40">
                <div className="flex items-center gap-2">
                  <Calendar size={14} suppressHydrationWarning />
                  Joined {new Date(profile.joinedAt || profile.joined_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={14} suppressHydrationWarning />
                  {profile.email}
                </div>
                {profile.role === 'seller' && (
                  <div className="flex items-center gap-2">
                    <Briefcase size={14} suppressHydrationWarning />
                    {projects.length} Projects
                  </div>
                )}
              </div>
            </div>

            {isOwnProfile && (
              <div className="flex flex-col gap-3 w-full md:w-auto">
                {isEditing ? (
                  <>
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="w-full px-8 py-4 bg-neon-blue text-black font-bold rounded-xl neon-glow-blue hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                      {isSaving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={18} /> Save Changes</>}
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditing(false);
                        setEditedBio(profile.bio || '');
                        setEditedAvatarUrl(profile.avatarUrl || profile.avatar_url || null);
                      }}
                      className="w-full px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <X size={18} /> Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/dashboard" className="w-full px-8 py-4 bg-neon-blue text-black font-bold rounded-xl neon-glow-blue hover:scale-105 transition-all text-center">
                      Dashboard
                    </Link>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="w-full px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Edit3 size={18} suppressHydrationWarning /> Edit Profile
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Stats/Info */}
          <div className="space-y-6 sm:space-y-8">
            {/* Seller Payment Methods (Publicly visible if seller wants?) */}
            {profile.role === 'seller' && profile.paymentMethods?.length > 0 && (
              <div className="glass-card p-6 sm:p-8">
                <h3 className="text-lg sm:text-xl font-bold mb-6 flex items-center gap-3">
                  <CreditCard className="text-neon-blue" size={20} suppressHydrationWarning />
                  Payment Methods
                </h3>
                <div className="space-y-4">
                  {profile.paymentMethods.map((method: any) => (
                    <div key={method.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-neon-blue shrink-0">
                        {method.type === 'paypal' && <Globe size={20} suppressHydrationWarning />}
                        {method.type === 'jazzcash' && <Smartphone size={20} suppressHydrationWarning />}
                        {method.type === 'easypaisa' && <Smartphone size={20} suppressHydrationWarning />}
                        {method.type === 'stripe' && <ExternalLink size={20} suppressHydrationWarning />}
                        {method.type === 'crypto' && <Wallet size={20} suppressHydrationWarning />}
                        {method.type === 'bank' && <Landmark size={20} suppressHydrationWarning />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">{method.label}</div>
                        <div className="text-sm font-medium truncate">{method.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats Card */}
            <div className="glass-card p-6 sm:p-8">
              <h3 className="text-lg sm:text-xl font-bold mb-6">Activity</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                  <div className="text-xl sm:text-2xl font-black text-neon-blue">128</div>
                  <div className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-white/40">Sales</div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                  <div className="text-xl sm:text-2xl font-black text-neon-purple">4.9</div>
                  <div className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-white/40">Rating</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Projects/Purchases */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Freelancer Projects */}
            {(profile.role === 'seller' || profile.role === 'admin') && (
              <div className="glass-card p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                  <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                    <Briefcase className="text-neon-blue" size={24} suppressHydrationWarning />
                    Projects
                  </h3>
                  <Link href="/marketplace" className="text-xs sm:text-sm font-bold text-neon-blue hover:underline">View All</Link>
                </div>

                {projects.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {projects.map((project: any) => (
                      <Link key={project.id} href={`/product/${project.id}`} className="group">
                        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-neon-blue/50 transition-all">
                          <div className="aspect-video relative">
                            <Image 
                              src={project.thumbnail} 
                              alt={project.title} 
                              fill 
                              className="object-cover group-hover:scale-105 transition-transform duration-500" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] sm:text-xs font-bold text-neon-blue border border-neon-blue/30">
                              ${project.price}
                            </div>
                          </div>
                          <div className="p-4">
                            <h4 className="font-bold mb-1 group-hover:text-neon-blue transition-colors text-sm sm:text-base truncate">{project.title}</h4>
                            <div className="flex items-center gap-2 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-white/40">
                              {project.category}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <p className="text-xs sm:text-sm text-white/40">No projects uploaded yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Client Purchased Projects (Only visible to owner or admin) */}
            {(isOwnProfile || isAdmin) && profile.role === 'buyer' && (
              <div className="glass-card p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold mb-8 flex items-center gap-3">
                  <ShoppingBag className="text-neon-purple" size={24} suppressHydrationWarning />
                  Purchased Projects
                </h3>
                <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <p className="text-xs sm:text-sm text-white/40">No purchases yet. Start exploring the marketplace!</p>
                  <Link href="/marketplace" className="inline-block mt-4 text-neon-blue font-bold hover:underline text-sm sm:text-base">Explore Marketplace</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
