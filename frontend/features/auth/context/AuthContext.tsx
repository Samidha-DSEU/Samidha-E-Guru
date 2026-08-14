"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, UserRole } from "@/types/api";
import { apiClient } from "@/services/apiClient";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  loginWithGoogle: (role: UserRole, idToken: string) => Promise<UserProfile | null>;
  login: (data: any) => Promise<UserProfile | null>;
  register: (data: any) => Promise<UserProfile | null>;
  updateProfile: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// const createFallbackUser = (role: UserRole = "student", email: string = "user@samidha.org", name: string = "SAMIDHA Learner"): UserProfile => {
//   return {
//     id: "user-" + Math.floor(Math.random() * 100000),
//     email: email,
//     is_active: true,
//     is_verified: true,
//     role: { id: "role-" + role, name: role },
//     profile: {
//       full_name: name,
//       bio: "SAMIDHA E-GURU Dedicated Member",
//       avatar_url: ""
//     },
//     learner_profile: {
//       institution_name: "Delhi Skill and Entrepreneurship University",
//       class_or_degree: "Class 10"
//     },
//     volunteer_profile: role === "volunteer" ? {
//       approval_status: "APPROVED",
//       organization: "Operational & Volunteer Head"
//     } : undefined,
//     alumni_profile: role === "alumni" ? {
//       current_company: "Tech Lead @ SAMIDHA",
//       designation: "Alumni Mentor"
//     } : undefined
//   };
// };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setUser = (newUser: UserProfile | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem("samidha_user_data", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("samidha_user_data");
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("samidha_access_token");
    const savedUserData = localStorage.getItem("samidha_user_data");

    if (savedToken) {
      setToken(savedToken);
      fetchCurrentUser(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (authToken: string, defaultRole: UserRole = "student", defaultEmail: string = "user@samidha.org"): Promise<UserProfile | null> => {
    let tokenRole: UserRole | null = null;
    if (authToken) {
      try {
        const parts = authToken.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.role) {
            tokenRole = payload.role.toLowerCase() as UserRole;
          }
        }
      } catch {}
    }

    try {
      const res = await apiClient.get("/auth/me", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.data?.data) {
        const dbUser = res.data.data;
        if (tokenRole && dbUser.role && dbUser.role.name !== tokenRole) {
          dbUser.role.name = tokenRole;
        }
        setUser(dbUser);
        return dbUser;
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("samidha_access_token");
        localStorage.removeItem("samidha_user_data");
        setToken(null);
        setUserState(null);
        setIsLoading(false);
        return null;
      }

      const savedUserStr = localStorage.getItem("samidha_user_data");
      if (savedUserStr) {
        try {
          const parsed = JSON.parse(savedUserStr);
          if (tokenRole && parsed.role) {
            parsed.role.name = tokenRole;
          }
          setUser(parsed);
          return parsed;
        } catch {}
      }
    } finally {
      setIsLoading(false);
    }
    return null;
  };

  const loginWithGoogle = async (role: UserRole, idToken: string): Promise<UserProfile | null> => {
    setIsLoading(true);
    let googleName = "Google User";
    let googleEmail = "google.user@samidha.org";
    let googlePicture = "";

    try {
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      if (userInfoRes.ok) {
        const userInfo = await userInfoRes.json();
        if (userInfo.name) googleName = userInfo.name;
        if (userInfo.email) googleEmail = userInfo.email;
        if (userInfo.picture) googlePicture = userInfo.picture;
      }
    } catch {
      try {
        const base64Payload = idToken.split('.')[1];
        if (base64Payload) {
          const decoded = JSON.parse(atob(base64Payload));
          if (decoded.name) googleName = decoded.name;
          if (decoded.email) googleEmail = decoded.email;
          if (decoded.picture) googlePicture = decoded.picture;
        }
      } catch {}
    }

    try {
      const res = await apiClient.post("/auth/google", {
        id_token: idToken,
        role_name: role
      });
      const newToken = res.data?.data?.access_token;
      if (newToken) {
        localStorage.setItem("samidha_access_token", newToken);
        setToken(newToken);
      }

      const dbUser = res.data?.data?.user;
      if (dbUser) {
        setUser(dbUser);
        return dbUser;
      }
      throw new Error("No user data returned from authentication");
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: any): Promise<UserProfile | null> => {
    setIsLoading(true);
    try {
      const res = await apiClient.post("/auth/login", data);
      const newToken = res.data?.data?.access_token;
      if (newToken) {
        localStorage.setItem("samidha_access_token", newToken);
        setToken(newToken);
      }

      const dbUser = res.data?.data?.user;
      if (dbUser) {
        setUser(dbUser);
        return dbUser;
      }
      throw new Error("No user data returned from authentication");
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any): Promise<UserProfile | null> => {
    setIsLoading(true);
    try {
      const res = await apiClient.post("/auth/register", data);
      const newToken = res.data?.data?.access_token;
      if (newToken) {
        localStorage.setItem("samidha_access_token", newToken);
        setToken(newToken);
      }

      const dbUser = res.data?.data?.user;
      if (dbUser) {
        setUser(dbUser);
        return dbUser;
      }
      throw new Error("No user data returned from registration");
    } catch (err) {
      throw err;
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
    } catch {
      // Local profile state update fallback
      if (user) {
        const updated = {
          ...user,
          profile: {
            ...user.profile,
            full_name: data.profile?.full_name || user.profile?.full_name || "",
            avatar_url: data.profile?.avatar_url || user.profile?.avatar_url || "",
            bio: data.profile?.bio || user.profile?.bio || "",
            phone: data.profile?.phone || user.profile?.phone || ""
          }
        };
        setUser(updated);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("samidha_access_token");
    localStorage.removeItem("samidha_user_data");
    setToken(null);
    setUserState(null);
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
