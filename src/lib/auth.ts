import { storage, initializeDefaultAccounts } from './storage';

export const auth = {
  login: (email: string, password: string) => {
    const users = storage.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return { success: false, message: 'Email atau password salah' };
    }
    
    // Check if account is blocked (for mitra)
    if (user.role === 'mitra') {
      const blocked = storage.getBlockedAccounts();
      if (blocked.includes(email)) {
        return { success: false, message: 'Akun Anda diblokir. Hubungi admin.' };
      }
      
      // Check if mitra is verified
      const profiles = storage.getProfiles();
      const profile = profiles.find(p => p.email === email);
      if (profile && profile.status !== 'verified') {
        return { success: false, message: 'Akun mitra belum diverifikasi' };
      }
    }
    
    storage.setCurrentUser(email);
    return { success: true, user };
  },
  
  logout: () => {
    storage.clearCurrentUser();
  },
  
  getCurrentUser: () => {
    const email = storage.getCurrentUser();
    if (!email) return null;
    
    const users = storage.getUsers();
    const profiles = storage.getProfiles();
    const user = users.find(u => u.email === email);
    const profile = profiles.find(p => p.email === email);
    
    return user && profile ? { ...user, ...profile } : null;
  },
  
  register: (email: string, password: string, name: string, role: 'user' | 'mitra') => {
    const users = storage.getUsers();
    const profiles = storage.getProfiles();
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return { success: false, message: 'Email sudah terdaftar' };
    }
    
    const newUser = { email, password, role };
    const newProfile = {
      email,
      name,
      role,
      status: 'active' as const,
      saldo: 0
    };
    
    storage.setUsers([...users, newUser]);
    storage.setProfiles([...profiles, newProfile]);
    
    return { success: true };
  }
};

// Initialize on import
initializeDefaultAccounts();