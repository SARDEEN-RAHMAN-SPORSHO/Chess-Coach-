import { create } from 'zustand';
import type { AuthStore, User } from '../types';
import { getAuthService } from '../services/authService';

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user: User | null) => {
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    });

    // Store user ID in localStorage for database operations
    if (user) {
      localStorage.setItem('userId', user.uid);
    } else {
      localStorage.removeItem('userId');
      localStorage.removeItem('currentGameId');
    }
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  logout: async () => {
    try {
      const authService = getAuthService();
      await authService.signOut();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      localStorage.removeItem('userId');
      localStorage.removeItem('currentGameId');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },
}));
