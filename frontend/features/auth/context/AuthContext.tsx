"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, UserRole } from "@/types/api";
import { apiClient } from "@/services/apiClient";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  loginWithGoogle: (role: UserRole) => Promise<void>;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("samidha_access_token");
    if (savedToken) {
      setToken(savedToken);
      fetchCurrentUser(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (authToken: string) => {
    try {
      const res = await apiClient.get("/auth/me", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.data?.data) {
        setUser(res.data.data);
      }
    } catch {
      localStorage.removeItem("samidha_access_token");
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (role: UserRole) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post("/auth/google", {
        id_token: "mock_google_id_token_xyz",
        role_name: role
      });
      const newToken = res.data?.data?.access_token;
      if (newToken) {
        localStorage.setItem("samidha_access_token", newToken);
        setToken(newToken);
        await fetchCurrentUser(newToken);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post("/auth/login", data);
      const newToken = res.data?.data?.access_token;
      if (newToken) {
        localStorage.setItem("samidha_access_token", newToken);
        setToken(newToken);
        await fetchCurrentUser(newToken);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post("/auth/register", data);
      const newToken = res.data?.data?.access_token;
      if (newToken) {
        localStorage.setItem("samidha_access_token", newToken);
        setToken(newToken);
        await fetchCurrentUser(newToken);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await apiClient.put("/auth/me", data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.data) {
        setUser(res.data.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("samidha_access_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, loginWithGoogle, login, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
