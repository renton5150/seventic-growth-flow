
export interface EmailPlatform {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface FrontOffice {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface EmailPlatformAccount {
  id: string;
  mission_id: string;
  platform_id: string;
  login: string;
  password_encrypted: string;
  phone_number?: string | null;
  credit_card_name?: string | null;
  credit_card_last_four?: string | null;
  backup_email?: string | null;
  status: string; // Changed from strict union to allow Supabase string
  spf_dkim_status: string; // Changed from strict union to allow Supabase string
  dedicated_ip: boolean;
  dedicated_ip_address?: unknown | null; // Changed to match Supabase type
  routing_interfaces: string[];
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  
  // Nouveaux champs domaine
  domain_name?: string | null;
  domain_hosting_provider?: string | null;
  domain_login?: string | null;
  domain_password?: string | null;
  
  // Relations populées
  platform?: EmailPlatform;
  mission?: {
    id: string;
    name: string;
    client: string;
  };
  front_offices?: FrontOffice[];
}

export interface EmailPlatformAccountFormData {
  mission_id: string;
  platform_id: string;
  platform_name?: string; // Nouveau champ pour la plateforme manuelle
  login: string;
  password: string;
  phone_number?: string;
  credit_card_name?: string;
  credit_card_last_four?: string;
  backup_email?: string;
  status: 'Actif' | 'Suspendu';
  spf_dkim_status: 'Oui' | 'Non' | 'En cours';
  dedicated_ip: boolean;
  dedicated_ip_address?: string;
  routing_interfaces: string[];
  front_office_ids?: string[];
  
  // Nouveaux champs domaine
  domain_name?: string;
  domain_hosting_provider?: 'OVH' | 'Gandhi' | 'Ionos';
  domain_login?: string;
  domain_password?: string;
}

export interface EmailPlatformAccountFilters {
  platform_id?: string;
  mission_id?: string;
  status?: 'Actif' | 'Suspendu';
  spf_dkim_status?: 'Oui' | 'Non' | 'En cours';
  dedicated_ip?: boolean;
  search?: string;
}

export const ROUTING_INTERFACES = [
  'SMTP',
  'Plateforme native',
  'Les deux'
] as const;

export type RoutingInterface = typeof ROUTING_INTERFACES[number];
