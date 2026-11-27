import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, UserRole } from '@/types/jastip';
import { api } from '@/services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  register: (nama: string, email: string, pass: string, role: UserRole) => Promise<User>;
  logout: () => Promise<void>;
  switchRole: (newRole: UserRole) => Promise<void>;
  updateSaldo: (amount: number) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('Penitip');
  const [isLoading, setIsLoading] = useState(true);

  // Auto-Login: Periksa SharedPreferences saat aplikasi dibuka
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const saved = await api.getSavedSession();
        if (saved && isMounted) {
          setUser(saved);
          setRole(saved.role);
        }
      } catch (e) {
        console.warn('Auto-login error:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    const loggedUser = await api.login(email, pass);
    setUser(loggedUser);
    setRole(loggedUser.role);
    return loggedUser;
  };

  const register = async (nama: string, email: string, pass: string, initialRole: UserRole): Promise<User> => {
    const newUser = await api.register(nama, email, pass, initialRole);
    setUser(newUser);
    setRole(newUser.role);
    return newUser;
  };

  const logout = async () => {
    await api.clearSession();
    setUser(null);
    setRole('Penitip');
  };

  const switchRole = async (newRole: UserRole) => {
    if (user) {
      const updated = await api.switchRole(user, newRole);
      setUser(updated);
      setRole(updated.role);
    } else {
      setRole(newRole);
    }
  };

  const updateSaldo = async (amount: number) => {
    if (user) {
      const newSaldo = await api.topupSaldo(user.id, amount);
      setUser({ ...user, saldo: newSaldo });
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      const updated = await api.getSavedSession();
      if (updated) {
        setUser((prev) => {
          if (
            !prev ||
            prev.id !== updated.id ||
            prev.saldo !== updated.saldo ||
            prev.role !== updated.role ||
            prev.nama !== updated.nama
          ) {
            return updated;
          }
          return prev;
        });
        setRole(updated.role);
      }
    } catch (e) {
      console.warn('refreshUser error:', e);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoggedIn: !!user,
        isLoading,
        login,
        register,
        logout,
        switchRole,
        updateSaldo,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
