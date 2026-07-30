// ======================================
// Supabase Configuration
// ======================================

const SUPABASE_URL =
    "https://twraggzfzojuwrwrvhta.supabase.co";

const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3R3cmFnZ3pmem9qdXdyd3J2aHRhLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJyZWYiOiJ0d3JhZ2d6ZnpvanV3cndydmh0YSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc5ODU5ODM3LCJleHAiOjIwOTU0MzU4Mzd9.5I7eNPiF2pLCaOVZICU0KYGYpfitm5NuciC8EQ24ND8";

const _supabase = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
