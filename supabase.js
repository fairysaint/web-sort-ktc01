// ===========================
// Supabase Configuration
// ===========================

const SUPABASE_URL = "https://twraggzfzojuwrwrvhta.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3cmFnZ3pmem9qdXdyd3J2aHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTk4MzcsImV4cCI6MjA5NTQzNTgzN30.5I7eNPiF2pLCaOVZICU0KYGYpfitm5NuciC8EQ24ND8";

// Tạo client dùng chung toàn bộ dự án
const _supabase = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
