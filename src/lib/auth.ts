
import { supabaseAuth, initializeDefaultAccounts } from './supabase-auth';

export const auth = {
  login: async (email: string, password: string) => {
    return await supabaseAuth.login(email, password);
  },
  
  logout: async () => {
    return await supabaseAuth.logout();
  },
  
  getCurrentUser: async () => {
    return await supabaseAuth.getCurrentUser();
  },
  
  register: async (email: string, password: string, name: string, role: 'user' | 'mitra') => {
    return await supabaseAuth.register(email, password, name, role);
  }
};

// Initialize on import
initializeDefaultAccounts();
