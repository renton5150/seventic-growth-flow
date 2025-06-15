
export interface Domain {
  id: string;
  domain_name: string;
  mission_id: string;
  hosting_provider: 'OVH' | 'Gandhi' | 'Ionos';
  login: string;
  password_encrypted: string;
  creation_date: string;
  expiration_date: string;
  status: 'Actif' | 'Suspendu';
  created_at: string;
  updated_at: string;
  
  // Relations populées
  mission?: {
    id: string;
    name: string;
    client: string;
  };
}

export interface DomainFormData {
  domain_name: string;
  mission_id: string;
  hosting_provider: 'OVH' | 'Gandhi' | 'Ionos';
  login: string;
  password: string;
  creation_date: string;
  expiration_date: string;
  status: 'Actif' | 'Suspendu';
}

export interface DomainFilters {
  mission_id?: string;
  hosting_provider?: 'OVH' | 'Gandhi' | 'Ionos';
  status?: 'Actif' | 'Suspendu';
  search?: string;
}
