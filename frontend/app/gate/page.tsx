"use client";

import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { FcGoogle } from "react-icons/fc";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";

export default function AdminGate() {
  const [secretKey, setSecretKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        // We bypass the AuthContext login here to pass the custom admin_secret payload
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/google`, {
          id_token: tokenResponse.access_token, // backend currently accepts access_token from frontend in place of id_token for generic google login
          role_name: "student", // backend will override this if secret is valid
          admin_secret: secretKey
        });

        // Store tokens
        localStorage.setItem("accessToken", res.data.data.access_token);
        localStorage.setItem("refreshToken", res.data.data.refresh_token);
        
        // Force context reload or hard reload
        toast.success("Security Clearance Granted");
        window.location.href = "/super-admin";
        
      } catch (err: any) {
        toast.error(err.response?.data?.detail || "Authentication Failed. Invalid Clearance.");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      toast.error("Google authentication failed.");
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100">
      <div className="w-full max-w-sm p-8 space-y-6 border border-zinc-800 rounded-xl bg-zinc-900/50 backdrop-blur-xl shadow-2xl">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">System Access</h1>
          <p className="text-zinc-400 text-sm">Provide security clearance key</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Clearance Key</label>
            <Input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="••••••••••••"
              className="bg-zinc-950 border-zinc-800 text-zinc-100"
            />
          </div>

          <Button
            onClick={() => {
              if (!secretKey) {
                toast.error("Security key required");
                return;
              }
              handleGoogleLogin();
            }}
            disabled={isLoading}
            className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 transition-all font-semibold"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FcGoogle className="mr-2 h-5 w-5" />
            )}
            Authenticate with Google
          </Button>
        </div>
      </div>
    </div>
  );
}
