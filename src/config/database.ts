export const databaseConfig = {
  // Supabase config (keep existing)
  supabase: {
    url: "https://jnovnrisewzgtxmvorwm.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impub3ZucmlzZXd6Z3R4bXZvcndtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5ODg2MTcsImV4cCI6MjA2NTU2NDYxN30.kPMV0fsLFv2_O0_SNqhK0m9CXkkhS4GnwZso9kyelnE"
  },
  // Hostinger API config
  hostinger: {
    apiUrl: process.env.VITE_HOSTINGER_API_URL || 'https://your-hostinger-api.com/api',
    apiKey: process.env.VITE_HOSTINGER_API_KEY || ''
  }
};
