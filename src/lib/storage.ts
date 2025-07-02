export interface User {
  email: string;
  password: string;
  role: 'admin' | 'user' | 'mitra';
}

export interface Profile {
  email: string;
  name: string;
  phone?: string;
  address?: string;
  role: 'admin' | 'user' | 'mitra';
  status: 'active' | 'verified' | 'blocked';
  saldo: number;
  expertise?: 'GetClean' | 'GetMassage' | 'GetBarber';
}

export interface MitraApplication {
  id: string;
  nama: string;
  phone: string;
  address: string;
  expertise: 'GetClean' | 'GetMassage' | 'GetBarber';
  reason: string;
  ktpPhoto?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  mitraId: string;
  service: 'GetClean' | 'GetMassage' | 'GetBarber';
  status: 'menunggu' | 'dikerjakan' | 'selesai' | 'dibatalkan';
  startTime?: string;
  endTime?: string;
  totalCost?: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userName?: string;
  type: 'topup' | 'payment';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  transferProof?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

// Import Supabase storage functions
import { supabaseStorage } from './supabase-storage';

// Wrapper to maintain backward compatibility
export const storage = {
  getUsers: () => {
    // For backward compatibility, return empty array since auth is handled by Supabase
    return [];
  },
  
  setUsers: (users: User[]) => {
    // No-op for backward compatibility
  },
  
  getProfiles: async (): Promise<Profile[]> => {
    return await supabaseStorage.getProfiles();
  },
  
  setProfiles: async (profiles: Profile[]) => {
    return await supabaseStorage.setProfiles(profiles);
  },
  
  getMitraApplications: async (): Promise<MitraApplication[]> => {
    return await supabaseStorage.getMitraApplications();
  },
  
  setMitraApplications: async (applications: MitraApplication[]) => {
    return await supabaseStorage.setMitraApplications(applications);
  },
  
  getOrders: async (): Promise<Order[]> => {
    return await supabaseStorage.getOrders();
  },
  
  setOrders: async (orders: Order[]) => {
    return await supabaseStorage.setOrders(orders);
  },
  
  getTransactions: async (): Promise<Transaction[]> => {
    return await supabaseStorage.getTransactions();
  },
  
  setTransactions: async (transactions: Transaction[]) => {
    return await supabaseStorage.setTransactions(transactions);
  },
  
  getBlockedAccounts: async (): Promise<string[]> => {
    return await supabaseStorage.getBlockedAccounts();
  },
  
  setBlockedAccounts: async (emails: string[]) => {
    return await supabaseStorage.setBlockedAccounts(emails);
  },
  
  getChatMessages: async (): Promise<ChatMessage[]> => {
    return await supabaseStorage.getChatMessages();
  },
  
  setChatMessages: async (messages: ChatMessage[]) => {
    return await supabaseStorage.setChatMessages(messages);
  },
  
  getCurrentUser: () => {
    return supabaseStorage.getCurrentUser();
  },
  
  setCurrentUser: (email: string) => {
    supabaseStorage.setCurrentUser(email);
  },
  
  clearCurrentUser: () => {
    supabaseStorage.clearCurrentUser();
  }
};

// Initialize default admin account
export const initializeDefaultAccounts = async () => {
  // This will be handled by Supabase auth system
  console.log('Default accounts initialized through Supabase');
};
