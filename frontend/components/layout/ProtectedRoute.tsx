"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
        return;
      }

      if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role.name)) {
        // Redirect user to their own role's home page if unauthorized for this specific portal
        if (user.role.name === "student") {
          router.push("/dashboard");
        } else if (user.role.name === "volunteer") {
          router.push("/volunteer");
        } else if (user.role.name === "alumni") {
          router.push("/alumni");
        } else if (user.role.name === "admin") {
          router.push("/admin");
        } else if (user.role.name === "super_admin") {
          router.push("/super-admin");
        } else {
          router.push("/");
        }
      }
    }
  }, [user, isLoading, allowedRoles, router]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role.name)) {
    return null;
  }

  return <>{children}</>;
}
