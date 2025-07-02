import { supabase } from "@/integrations/supabase/client";

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

// Supabase storage utilities
export const supabaseStorage = {
  getProfiles: async (): Promise<Profile[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    
    if (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }
    
    return data.map(profile => ({
      email: profile.user_id, // Using user_id as email identifier
      name: profile.full_name,
      phone: profile.phone || '',
      address: profile.address || '',
      role: profile.role as 'admin' | 'user' | 'mitra',
      status: profile.status as 'active' | 'verified' | 'blocked',
      saldo: profile.balance || 0,
      expertise: profile.expertise as 'GetClean' | 'GetMassage' | 'GetBarber' | undefined
    }));
  },
  
  setProfiles: async (profiles: Profile[]) => {
    // This function would be handled by individual profile updates
    console.log('Profiles will be updated individually through auth system');
  },
  
  getMitraApplications: async (): Promise<MitraApplication[]> => {
    const { data, error } = await supabase
      .from('mitra_applications')
      .select('*');
    
    if (error) {
      console.error('Error fetching mitra applications:', error);
      return [];
    }
    
    return data.map(app => ({
      id: app.id,
      nama: app.full_name,
      phone: app.phone,
      address: app.address,
      expertise: app.expertise as 'GetClean' | 'GetMassage' | 'GetBarber',
      reason: app.reason,
      ktpPhoto: app.ktp_url || undefined,
      status: app.status as 'pending' | 'approved' | 'rejected',
      createdAt: app.created_at
    }));
  },
  
  setMitraApplications: async (applications: MitraApplication[]) => {
    // Individual applications would be created through the registration process
    console.log('Mitra applications will be created individually');
  },
  
  getOrders: async (): Promise<Order[]> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*');
    
    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
    
    return data.map(order => ({
      id: order.id,
      userId: order.user_id,
      mitraId: order.mitra_id || '',
      service: order.service_type as 'GetClean' | 'GetMassage' | 'GetBarber',
      status: order.status as 'menunggu' | 'dikerjakan' | 'selesai' | 'dibatalkan',
      startTime: order.start_time || undefined,
      endTime: order.end_time || undefined,
      totalCost: order.total_amount || undefined,
      createdAt: order.created_at
    }));
  },
  
  setOrders: async (orders: Order[]) => {
    // Orders would be created individually
    console.log('Orders will be created individually');
  },
  
  createOrder: async (order: Omit<Order, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: order.userId,
        mitra_id: order.mitraId,
        service_type: order.service,
        status: order.status,
        start_time: order.startTime,
        end_time: order.endTime,
        total_amount: order.totalCost,
        user_address: '' // This should be filled from user profile
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating order:', error);
      return null;
    }
    
    return {
      id: data.id,
      userId: data.user_id,
      mitraId: data.mitra_id || '',
      service: data.service_type as 'GetClean' | 'GetMassage' | 'GetBarber',
      status: data.status as 'menunggu' | 'dikerjakan' | 'selesai' | 'dibatalkan',
      startTime: data.start_time || undefined,
      endTime: data.end_time || undefined,
      totalCost: data.total_amount || undefined,
      createdAt: data.created_at
    };
  },
  
  getTransactions: async (): Promise<Transaction[]> => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*');
    
    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
    
    return data.map(transaction => ({
      id: transaction.id,
      userId: transaction.user_id,
      userName: transaction.description || undefined,
      type: transaction.type as 'topup' | 'payment',
      amount: transaction.amount,
      status: transaction.status as 'pending' | 'approved' | 'rejected',
      transferProof: transaction.transfer_proof || undefined,
      createdAt: transaction.created_at
    }));
  },
  
  setTransactions: async (transactions: Transaction[]) => {
    // Transactions would be created individually
    console.log('Transactions will be created individually');
  },
  
  createTransaction: async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: transaction.userId,
        type: transaction.type,
        amount: transaction.amount,
        status: transaction.status,
        transfer_proof: transaction.transferProof,
        description: transaction.userName
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating transaction:', error);
      return null;
    }
    
    return {
      id: data.id,
      userId: data.user_id,
      userName: data.description || undefined,
      type: data.type as 'topup' | 'payment',
      amount: data.amount,
      status: data.status as 'pending' | 'approved' | 'rejected',
      transferProof: data.transfer_proof || undefined,
      createdAt: data.created_at
    };
  },
  
  getBlockedAccounts: async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from('blocked_accounts')
      .select('user_id');
    
    if (error) {
      console.error('Error fetching blocked accounts:', error);
      return [];
    }
    
    return data.map(account => account.user_id);
  },
  
  setBlockedAccounts: async (emails: string[]) => {
    // Individual accounts would be blocked/unblocked through admin actions
    console.log('Blocked accounts will be managed individually');
  },
  
  getChatMessages: async (): Promise<ChatMessage[]> => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching chat messages:', error);
      return [];
    }
    
    return data.map(message => ({
      id: message.id,
      senderId: message.sender_id,
      receiverId: message.receiver_id,
      senderName: message.sender_name,
      message: message.message,
      timestamp: message.created_at
    }));
  },
  
  setChatMessages: async (messages: ChatMessage[]) => {
    // Messages would be created individually
    console.log('Chat messages will be created individually');
  },
  
  createChatMessage: async (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        sender_id: message.senderId,
        receiver_id: message.receiverId,
        sender_name: message.senderName,
        message: message.message
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating chat message:', error);
      return null;
    }
    
    return {
      id: data.id,
      senderId: data.sender_id,
      receiverId: data.receiver_id,
      senderName: data.sender_name,
      message: data.message,
      timestamp: data.created_at
    };
  },
  
  getCurrentUser: (): string | null => {
    // This will be handled by Supabase auth
    return localStorage.getItem('currentUser');
  },
  
  setCurrentUser: (email: string) => {
    localStorage.setItem('currentUser', email);
  },
  
  clearCurrentUser: () => {
    localStorage.removeItem('currentUser');
  }
};

// Initialize default admin account (keeping this for backward compatibility)
export const initializeDefaultAccounts = async () => {
  // This would be handled through Supabase auth registration
  console.log('Default accounts will be handled through Supabase auth');
};
