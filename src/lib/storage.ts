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

// Storage utilities
export const storage = {
  getUsers: (): User[] => {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
  },
  
  setUsers: (users: User[]) => {
    localStorage.setItem('users', JSON.stringify(users));
  },
  
  getProfiles: (): Profile[] => {
    const profiles = localStorage.getItem('profiles');
    return profiles ? JSON.parse(profiles) : [];
  },
  
  setProfiles: (profiles: Profile[]) => {
    localStorage.setItem('profiles', JSON.stringify(profiles));
  },
  
  getMitraApplications: (): MitraApplication[] => {
    const apps = localStorage.getItem('mitra_applications');
    return apps ? JSON.parse(apps) : [];
  },
  
  setMitraApplications: (applications: MitraApplication[]) => {
    localStorage.setItem('mitra_applications', JSON.stringify(applications));
  },
  
  getOrders: (): Order[] => {
    const orders = localStorage.getItem('orders');
    return orders ? JSON.parse(orders) : [];
  },
  
  setOrders: (orders: Order[]) => {
    localStorage.setItem('orders', JSON.stringify(orders));
  },
  
  getTransactions: (): Transaction[] => {
    const transactions = localStorage.getItem('transactions');
    return transactions ? JSON.parse(transactions) : [];
  },
  
  setTransactions: (transactions: Transaction[]) => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  },
  
  getBlockedAccounts: (): string[] => {
    const blocked = localStorage.getItem('blocked_accounts');
    return blocked ? JSON.parse(blocked) : [];
  },
  
  setBlockedAccounts: (emails: string[]) => {
    localStorage.setItem('blocked_accounts', JSON.stringify(emails));
  },
  
  getChatMessages: (): ChatMessage[] => {
    const messages = localStorage.getItem('chat_messages');
    return messages ? JSON.parse(messages) : [];
  },
  
  setChatMessages: (messages: ChatMessage[]) => {
    localStorage.setItem('chat_messages', JSON.stringify(messages));
  },
  
  getCurrentUser: (): string | null => {
    return localStorage.getItem('currentUser');
  },
  
  setCurrentUser: (email: string) => {
    localStorage.setItem('currentUser', email);
  },
  
  clearCurrentUser: () => {
    localStorage.removeItem('currentUser');
  }
};

// Initialize default admin account
export const initializeDefaultAccounts = () => {
  const users = storage.getUsers();
  const profiles = storage.getProfiles();
  
  // Create admin account if it doesn't exist
  const adminExists = users.find(u => u.email === 'id.getlife@gmail.com');
  if (!adminExists) {
    const newUsers = [...users, {
      email: 'id.getlife@gmail.com',
      password: 'Bandung123',
      role: 'admin' as const
    }];
    storage.setUsers(newUsers);
    
    const newProfiles = [...profiles, {
      email: 'id.getlife@gmail.com',
      name: 'Admin GetLife',
      role: 'admin' as const,
      status: 'active' as const,
      saldo: 0
    }];
    storage.setProfiles(newProfiles);
  }
};
