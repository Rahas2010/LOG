import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { isSupabaseConfigured } from './db/config';
import { fetchCloudUsers, saveCloudPassword } from './db/sync';

export type UserRole = 'admin' | 'user';

export interface User {
  username: string;
  role: UserRole;
  key: string;
}

interface AuthContextValue {
  user: User | null;
  login: (username: string, password: string, confirm: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
  verifyPassword: (password: string) => boolean;
  changePassword: (userKey: string, newPassword: string) => Promise<boolean>;
  getUserDisplay: (userKey: string) => string;
  getAllUsers: () => Array<{ key: string; display: string; role: UserRole }>;
}

const DEFAULT_USERS: Record<string, { password: string; role: UserRole; display: string }> = {
  admin: { password: 'Rahas@2010', role: 'admin', display: 'Rahas' },
  rahas: { password: 'Rahas@2010', role: 'user', display: 'Rahas Sharma' },
};

const PASSWORDS_KEY = 'screentime_passwords';

function loadPasswords(): Record<string, { password: string; role: UserRole; display: string }> {
  try {
    const saved = localStorage.getItem(PASSWORDS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_USERS, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_USERS };
}

function savePasswords(passwords: Record<string, { password: string; role: UserRole; display: string }>): void {
  try {
    localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
  } catch {}
}

export function verifyAdminPassword(password: string): boolean {
  const passwords = loadPasswords();
  return passwords.admin?.password === password;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: async () => ({ success: false }),
  logout: () => {},
  isAdmin: false,
  verifyPassword: () => false,
  changePassword: async () => false,
  getUserDisplay: () => '',
  getAllUsers: () => [],
});

function loadUser(): User | null {
  try {
    const saved = localStorage.getItem('screentime_user');
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

function saveUser(user: User | null) {
  try {
    if (user) localStorage.setItem('screentime_user', JSON.stringify(user));
    else localStorage.removeItem('screentime_user');
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadUser);

  const login = useCallback(async (username: string, password: string, confirm: string): Promise<{ success: boolean; error?: string }> => {
    if (!password.trim() || !confirm.trim()) {
      return { success: false, error: 'Please fill in all fields' };
    }
    if (password !== confirm) {
      return { success: false, error: 'Passwords do not match' };
    }

    const key = username.toLowerCase().trim();
    let passwords = loadPasswords();

    // If cloud is configured, prefer cloud user list so login/passwords sync across devices
    if (isSupabaseConfigured()) {
      const cloudUsers = await fetchCloudUsers();
      if (cloudUsers && Object.keys(cloudUsers).length > 0) {
        passwords = { ...passwords, ...cloudUsers };
        savePasswords(passwords);
      }
    }

    const entry = passwords[key];
    if (!entry) return { success: false, error: 'User not found' };
    if (entry.password !== password) return { success: false, error: 'Incorrect password' };

    const u: User = { username: entry.display, role: entry.role, key };
    setUser(u);
    saveUser(u);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    saveUser(null);
  }, []);

  const verifyPassword = useCallback((password: string): boolean => {
    if (!user) return false;
    const passwords = loadPasswords();
    const entry = passwords[user.key];
    return !!entry && entry.password === password;
  }, [user]);

  const changePassword = useCallback(async (userKey: string, newPassword: string): Promise<boolean> => {
    const passwords = loadPasswords();
    if (!passwords[userKey]) return false;

    if (isSupabaseConfigured()) {
      const cloudOk = await saveCloudPassword(userKey, newPassword);
      if (!cloudOk) return false;
    }

    passwords[userKey] = { ...passwords[userKey], password: newPassword };
    savePasswords(passwords);
    return true;
  }, []);

  const getUserDisplay = useCallback((userKey: string): string => {
    const passwords = loadPasswords();
    return passwords[userKey]?.display || userKey;
  }, []);

  const getAllUsers = useCallback((): Array<{ key: string; display: string; role: UserRole }> => {
    const passwords = loadPasswords();
    return Object.entries(passwords).map(([key, val]) => ({
      key, display: val.display, role: val.role,
    }));
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, verifyPassword, changePassword, getUserDisplay, getAllUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
