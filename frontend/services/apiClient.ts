import axios from "axios";

const getBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // Default to Production Backend URL if no env variable is provided
  return "https://samidha-e-guru.onrender.com/api/v1";
};

export const apiClient = axios.create({
  headers: {
    "Content-Type": "application/json"
  }
});

// Interceptor to attach dynamic baseURL and Authorization Bearer token
apiClient.interceptors.request.use((config) => {
  if (!config.baseURL) {
    config.baseURL = getBaseUrl();
  }
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("samidha_access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
