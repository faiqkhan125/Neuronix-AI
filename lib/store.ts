"use client";

// Mock Data & Local Storage Store
// This replaces the backend for now as requested.

export const MOCK_PROJECTS = [];

let cachedStore: any = null;

export const getStore = () => {
  if (typeof window === 'undefined') return { users: [], profiles: [], projects: MOCK_PROJECTS, currentUser: null, orders: [], notifications: [] };
  
  if (cachedStore) return cachedStore;

  const users = JSON.parse(localStorage.getItem('neuronix_users') || '[]');
  const profiles = JSON.parse(localStorage.getItem('neuronix_profiles') || '[]');
  const projects = JSON.parse(localStorage.getItem('neuronix_projects') || JSON.stringify(MOCK_PROJECTS));
  const currentUser = JSON.parse(localStorage.getItem('neuronix_current_user') || 'null');
  const announcements = JSON.parse(localStorage.getItem('neuronix_announcements') || '[]');
  const orders = JSON.parse(localStorage.getItem('neuronix_orders') || '[]');
  const notifications = JSON.parse(localStorage.getItem('neuronix_notifications') || '[]');
  const saasPlatforms = JSON.parse(localStorage.getItem('neuronix_saas_platforms') || '[]');
  
  cachedStore = { users, profiles, projects, currentUser, announcements, orders, notifications, saasPlatforms };
  return cachedStore;
};

export const saveStore = (data: { users?: any[], profiles?: any[], projects?: any[], currentUser?: any, announcements?: any[], orders?: any[], notifications?: any[], saasPlatforms?: any[] }) => {
  if (typeof window === 'undefined') return;
  
  if (data.users) localStorage.setItem('neuronix_users', JSON.stringify(data.users));
  if (data.profiles) localStorage.setItem('neuronix_profiles', JSON.stringify(data.profiles));
  if (data.projects) localStorage.setItem('neuronix_projects', JSON.stringify(data.projects));
  if (data.currentUser !== undefined) localStorage.setItem('neuronix_current_user', JSON.stringify(data.currentUser));
  if (data.announcements) localStorage.setItem('neuronix_announcements', JSON.stringify(data.announcements));
  if (data.orders) localStorage.setItem('neuronix_orders', JSON.stringify(data.orders));
  if (data.notifications) localStorage.setItem('neuronix_notifications', JSON.stringify(data.notifications));
  if (data.saasPlatforms) localStorage.setItem('neuronix_saas_platforms', JSON.stringify(data.saasPlatforms));
  
  // Clear cache to force re-parse on next getStore
  cachedStore = null;
};

export const mockAuth = {
  signup: (email: string, password: string, username: string, fullName: string, role: 'buyer' | 'seller') => {
    const { users, profiles } = getStore();
    if (users.find((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('This email is already registered. Please sign in or use a different email.');
    }
    
    const newUser = { 
      id: 'user-' + Date.now(), 
      email: email.toLowerCase(), 
      password, 
      username, 
      fullName,
      role,
      created_at: new Date().toISOString() 
    };
    
    const newProfile = { 
      id: newUser.id, 
      userId: newUser.id,
      username, 
      fullName,
      email: email.toLowerCase(), 
      role,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      onboarding_complete: false,
      wishlist: [],
      purchasedProjects: []
    };
    
    saveStore({ 
      users: [...users, newUser], 
      profiles: [...profiles, newProfile]
    });
    
    // Do NOT dispatch auth-change here as we want them to sign in manually
    // window.dispatchEvent(new Event('auth-change'));
    
    return { user: newUser, profile: newProfile };
  },
  
  signin: (email: string, password: string) => {
    const { users, profiles } = getStore();
    const adminEmail = 'neuronixaicareers@gmail.com';
    
    const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    
    if (!user && email.toLowerCase() === adminEmail && password === 'admin123') {
      // Auto-create admin if it doesn't exist
      const adminUser = { 
        id: 'admin-neuronix', 
        email: adminEmail, 
        password: 'admin123', 
        username: 'NeuronixAI', 
        fullName: 'Neuronix AI',
        role: 'admin',
        isAdmin: true,
        created_at: new Date().toISOString() 
      };
      
      const adminProfile = { 
        id: adminUser.id, 
        userId: adminUser.id,
        username: 'NeuronixAI', 
        fullName: 'Neuronix AI',
        email: adminEmail, 
        role: 'admin',
        isAdmin: true,
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=NeuronixAI',
        onboarding_complete: true,
        wishlist: [],
        purchasedProjects: []
      };
      
      saveStore({ 
        users: [...users, adminUser], 
        profiles: [...profiles, adminProfile],
        currentUser: { user: adminUser, profile: adminProfile }
      });
      window.dispatchEvent(new Event('auth-change'));
      return { user: adminUser, profile: adminProfile };
    }

    if (!user) throw new Error('Invalid credentials');
    
    let profile = profiles.find((p: any) => p.userId === user.id);
    if (!profile) {
      profile = { 
        id: user.id, 
        userId: user.id,
        username: user.username, 
        email: user.email, 
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
        onboarding_complete: true 
      };
      saveStore({ profiles: [...profiles, profile] });
    }
    
    saveStore({ currentUser: { user, profile } });
    window.dispatchEvent(new Event('auth-change'));
    return { user, profile };
  },
  
  logout: () => {
    saveStore({ currentUser: null });
    window.dispatchEvent(new Event('auth-change'));
  },
  
  getCurrentUser: () => {
    return getStore().currentUser;
  }
};

export const mockProjects = {
  getAll: async () => {
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return await res.json();
    } catch (err) {
      console.error(err);
      return [];
    }
  },
  getById: async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error('Failed to fetch project');
      return await res.json();
    } catch (err) {
      console.error(err);
      return null;
    }
  },
  create: async (projectData: any, userId?: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userId) headers['x-user-id'] = userId;
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify(projectData),
      });
      if (!res.ok) throw new Error('Failed to create project');
      return await res.json();
    } catch (err) {
      console.error(err);
      throw err;
    }
  },
  delete: async (id: string, userId?: string) => {
    try {
      const headers: Record<string, string> = {};
      if (userId) headers['x-user-id'] = userId;
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) throw new Error('Failed to delete project');
      return await res.json();
    } catch (err) {
      console.error(err);
      throw err;
    }
  },
  update: async (id: string, updates: any, userId?: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userId) headers['x-user-id'] = userId;
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update project');
      return await res.json();
    } catch (err) {
      console.error(err);
      throw err;
    }
  },
};

export const mockAnnouncements = {
  getAll: () => getStore().announcements,
  create: (content: string) => {
    const { announcements, currentUser } = getStore();
    if (currentUser?.user?.email !== 'neuronixaicareers@gmail.com') {
      throw new Error('Only Neuronix AI Admin can make announcements');
    }
    const newAnnouncement = {
      id: 'ann-' + Date.now(),
      content,
      created_at: new Date().toISOString()
    };
    saveStore({ announcements: [newAnnouncement, ...announcements] });
    return newAnnouncement;
  }
};

export const mockSaasPlatforms = {
  getAll: () => getStore().saasPlatforms,
  create: (platformData: any) => {
    const { saasPlatforms, currentUser } = getStore();
    if (currentUser?.user?.email !== 'neuronixaicareers@gmail.com') {
      throw new Error('Only Neuronix AI Admin can launch SaaS platforms');
    }
    const newPlatform = {
      ...platformData,
      id: 'saas-' + Date.now(),
      created_at: new Date().toISOString()
    };
    saveStore({ saasPlatforms: [newPlatform, ...saasPlatforms] });
    return newPlatform;
  }
};
