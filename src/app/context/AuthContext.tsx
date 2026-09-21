import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'site_admin' | 'course_creator';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId?: string; // Only for course creators
  tenantName?: string; // Only for course creators
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole, tenantId?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users database
const MOCK_USERS = {
  site_admin: {
    email: 'admin@lms.com',
    password: 'admin123',
    user: {
      id: 'admin-1',
      email: 'admin@lms.com',
      name: 'Site Administrator',
      role: 'site_admin' as UserRole,
    },
  },
  course_creator: [
    {
      email: 'creator@acme.com',
      password: 'creator123',
      user: {
        id: 'creator-1',
        email: 'creator@acme.com',
        name: 'John Doe',
        role: 'course_creator' as UserRole,
        tenantId: 'tenant-1',
        tenantName: 'Acme Corporation',
      },
    },
    {
      email: 'creator@techco.com',
      password: 'creator123',
      user: {
        id: 'creator-2',
        email: 'creator@techco.com',
        name: 'Jane Smith',
        role: 'course_creator' as UserRole,
        tenantId: 'tenant-2',
        tenantName: 'TechCo Industries',
      },
    },
  ],
};

const DEFAULT_USER: User = {
  id: 'creator-1',
  email: 'creator@axlekorp.com',
  name: 'John Doe',
  role: 'course_creator',
  tenantId: 'tenant-1',
  tenantName: 'Axle Korp',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(DEFAULT_USER);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {}, []);

  const login = async (
    email: string,
    password: string,
    role: UserRole,
    tenantId?: string
  ): Promise<boolean> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (role === 'site_admin') {
      const admin = MOCK_USERS.site_admin;
      if (email === admin.email && password === admin.password) {
        setUser(admin.user);
        localStorage.setItem('lms_user', JSON.stringify(admin.user));
        return true;
      }
    } else if (role === 'course_creator') {
      const creator = MOCK_USERS.course_creator.find(
        (c) => c.email === email && c.password === password
      );
      if (creator) {
        setUser(creator.user);
        localStorage.setItem('lms_user', JSON.stringify(creator.user));
        return true;
      }
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lms_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
