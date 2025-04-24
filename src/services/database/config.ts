
// Configuration pour la gestion des bases de données

import { DatabaseFile } from "@/types/database.types";
import { supabase } from "@/integrations/supabase/client";

// Vérifier si la configuration Supabase est disponible
export const isSupabaseConfigured = !!(supabase && supabase.storage);

// Tableau pour stocker temporairement les bases de données en mode démo
export const demoDatabases: DatabaseFile[] = [];
