
import { supabase } from "@/integrations/supabase/client";
import { supabaseStorage } from './supabase-storage';

export const supabaseAuth = {
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return { success: false, message: error.message };
    }
    
    if (!data.user) {
      return { success: false, message: 'Login gagal' };
    }
    
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single();
    
    if (!profile) {
      return { success: false, message: 'Profil pengguna tidak ditemukan' };
    }
    
    // Check if account is blocked (for mitra)
    if (profile.role === 'mitra') {
      const { data: blockedAccount } = await supabase
        .from('blocked_accounts')
        .select('*')
        .eq('user_id', data.user.id)
        .maybeSingle();
      
      if (blockedAccount) {
        return { success: false, message: 'Akun Anda diblokir. Hubungi admin.' };
      }
      
      // Check if mitra is verified
      if (profile.status !== 'verified') {
        return { success: false, message: 'Akun mitra belum diverifikasi' };
      }
    }
    
    supabaseStorage.setCurrentUser(email);
    return { 
      success: true, 
      user: {
        email: data.user.email || email,
        password: '', // Don't return password
        role: profile.role
      }
    };
  },
  
  logout: async () => {
    await supabase.auth.signOut();
    supabaseStorage.clearCurrentUser();
  },
  
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (!profile) return null;
    
    return {
      email: user.email || '',
      password: '', // Don't return password
      role: profile.role,
      name: profile.full_name,
      phone: profile.phone || '',
      address: profile.address || '',
      status: profile.status,
      saldo: profile.balance || 0,
      expertise: profile.expertise
    };
  },
  
  register: async (email: string, password: string, name: string, role: 'user' | 'mitra') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: role
        }
      }
    });
    
    if (error) {
      return { success: false, message: error.message };
    }
    
    return { success: true };
  }
};

// Initialize on import
export const initializeDefaultAccounts = async () => {
  console.log('Default accounts initialized through Supabase');
};
