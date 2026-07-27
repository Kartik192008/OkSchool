import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// For GitHub Pages, we'll use Supabase directly for all data operations
// No backend API needed

createRoot(document.getElementById("root")!).render(<App />);
