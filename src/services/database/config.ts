
// Configuration for database service

const isSupabaseConfigured = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

// Stockage local pour les bases de données en mode démo
const demoDatabases: DatabaseFile[] = [];

export { isSupabaseConfigured, demoDatabases };

import { DatabaseFile } from "@/types/database.types";
