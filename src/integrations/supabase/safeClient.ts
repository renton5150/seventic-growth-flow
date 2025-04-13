
import { supabase } from './client';

type TableName = 'missions' | 'profiles' | 'database_files' | 'requests';
type FunctionName = 'create_user_profile' | 'user_has_growth_role' | 'user_is_admin';

/**
 * Wrapper sécurisé autour de Supabase pour éviter les erreurs TypeScript
 * tout en gardant les suggestions d'autocomplétion pour les tables et fonctions connues
 */
class SafeSupabase {
  /**
   * Wrapper pour supabase.from() qui accepte des noms de tables typés ou dynamiques
   */
  from(table: TableName | string) {
    // Cast de type pour permettre des noms de tables dynamiques
    return supabase.from(table as any);
  }

  /**
   * Wrapper pour supabase.rpc() qui accepte des noms de fonctions typés ou dynamiques
   */
  rpc(functionName: FunctionName | string, params: Record<string, any> = {}) {
    // Cast de type pour permettre des noms de fonctions dynamiques
    return supabase.rpc(functionName as any, params);
  }

  /**
   * Accès aux autres fonctionnalités de Supabase
   */
  get auth() {
    return supabase.auth;
  }

  get storage() {
    return supabase.storage;
  }
}

export const safeSupabase = new SafeSupabase();
