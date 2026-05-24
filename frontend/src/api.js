// Central API base URL. Override with VITE_API_URL in frontend/.env for production.
// In development this defaults to http://localhost:3000.
// With nginx you'd typically set VITE_API_URL to your public domain.
export const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
