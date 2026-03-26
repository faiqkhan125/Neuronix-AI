import { JSONFilePreset } from 'lowdb/node';

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  password?: string;
  role: 'buyer' | 'seller' | 'admin';
  isVerified: boolean;
  verificationToken?: string;
  resetToken?: string;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  type: 'paypal' | 'jazzcash' | 'easypaisa' | 'stripe' | 'crypto' | 'bank';
  label: string;
  value: string;
  isDefault: boolean;
}

export interface Profile {
  userId: string;
  username: string;
  fullName: string;
  bio?: string;
  avatarUrl?: string;
  role: 'buyer' | 'seller' | 'admin';
  paymentMethods: PaymentMethod[];
  wishlist: string[]; // project IDs
  purchasedProjects: string[]; // project IDs
  joinedAt: string;
  updatedAt?: string;
  isSuspended?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success';
  isActive: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'system' | 'review';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  sellerId: string;
  authorUsername: string;
  authorName: string;
  title: string;
  description: string;
  price: number;
  demoUrl?: string;
  images: string[];
  thumbnail: string;
  fileUrl?: string; // ZIP or GitHub link
  category: string;
  subcategory: string;
  tags: string[];
  techStack: string[];
  status: 'live' | 'pending_payment' | 'pending_approval' | 'rejected' | 'active';
  paymentProof?: {
    transactionId: string;
    screenshotUrl: string;
    submittedAt: string;
  };
  createdAt: string;
  updatedAt: string;
  sales: number;
  rating: number;
}

export interface Order {
  id: string;
  projectId: string;
  buyerId: string;
  sellerId: string;
  price: number;
  status: 'pending_payment' | 'payment_done' | 'confirmed' | 'completed' | 'cancelled';
  buyerPaymentProof?: {
    transactionId: string;
    screenshotUrl: string;
    submittedAt: string;
  };
  sellerCommissionProof?: {
    transactionId: string;
    screenshotUrl: string;
    submittedAt: string;
  };
  downloadLink?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  projectId: string;
  userId: string;
  username: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface DatabaseSchema {
  users: User[];
  profiles: Profile[];
  projects: Project[];
  orders: Order[];
  reviews: Review[];
  categories: Category[];
  announcements: Announcement[];
  notifications: Notification[];
}

const defaultData: DatabaseSchema = { 
  users: [], 
  profiles: [],
  projects: [],
  orders: [],
  reviews: [],
  categories: [
    { id: 'cat-1', name: 'Chatbots', slug: 'chatbots' },
    { id: 'cat-2', name: 'Image Generation', slug: 'image-generation' },
    { id: 'cat-3', name: 'Automation', slug: 'automation' },
    { id: 'cat-4', name: 'Data Science', slug: 'data-science' }
  ],
  announcements: [],
  notifications: []
};

// Initialize the database
export async function getDb() {
  const db = await JSONFilePreset<DatabaseSchema>('db.json', defaultData);
  return db;
}
