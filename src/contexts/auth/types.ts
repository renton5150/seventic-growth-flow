
import { User as SupabaseUser } from "@supabase/supabase-js";
import { User, UserRole } from "@/types/types";

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSDR: boolean;
  isGrowth: boolean;
  loading: boolean;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
}
