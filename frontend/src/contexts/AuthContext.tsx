import React, { createContext, useContext, useState, useEffect } from "react";
import type { User } from "../types";
import { mockUsers, MOCK_PASSWORD } from "../lib/mockData";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (data: RegisterData) => Promise<boolean>;
  isLoading: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  profilePicture?: string;
  cvUrl?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check credentials
    if (password !== MOCK_PASSWORD) {
      return false;
    }

    const foundUser = mockUsers.find((u) => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem("currentUser", JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check if email already exists
    const existingUser = mockUsers.find((u) => u.email === data.email);
    if (existingUser) {
      return false;
    }

    // Create new user
    const newUser: User = {
      id: `candidate-${Date.now()}`,
      email: data.email,
      role: "candidate",
      name: data.name,
      phone: data.phone,
      profilePicture: data.profilePicture,
      cvUrl: data.cvUrl,
    };

    mockUsers.push(newUser);
    setUser(newUser);
    localStorage.setItem("currentUser", JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
