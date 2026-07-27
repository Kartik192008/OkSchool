import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";

// Log environment variables for debugging
console.log('Environment variables:', {
  DEV: import.meta.env.DEV,
  MODE: import.meta.env.MODE,
  VITE_API_TARGET: import.meta.env.VITE_API_TARGET,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '***' : 'MISSING',
});

if (import.meta.env.DEV) {
  setBaseUrl("http://localhost:8080");
  console.log('Using development API: http://localhost:8080');
} else {
  // Hardcode production URL since Render env vars aren't being picked up by Vite build
  const apiTarget = "https://okschool-backend.onrender.com";
  console.log('Using production API:', apiTarget);
  setBaseUrl(apiTarget);
}

createRoot(document.getElementById("root")!).render(<App />);
