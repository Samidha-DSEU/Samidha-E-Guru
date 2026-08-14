import axios from "axios";

const BACKEND_URLS = [
  "https://samidha-e-guru.onrender.com/api/v1",
  "https://samidha-e-guru-4px4.onrender.com/api/v1"
];

const getBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // Client-Side Load Balancing (Random Robin Selection)
  const randomIndex = Math.floor(Math.random() * BACKEND_URLS.length);
  return BACKEND_URLS[randomIndex];
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
