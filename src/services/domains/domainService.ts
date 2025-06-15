
import { supabase } from "@/integrations/supabase/client";
import { Domain, DomainFormData, DomainFilters } from "@/types/domains.types";

// Fonction simple pour chiffrer/déchiffrer (à améliorer en production)
const encryptPassword = (password: string): string => {
  return btoa(password); // Base64 encoding (simple, à remplacer par du vrai chiffrement)
};

const decryptPassword = (encryptedPassword: string): string => {
  try {
    return atob(encryptedPassword);
  } catch {
    return encryptedPassword;
  }
};

export const getDomains = async (filters?: DomainFilters): Promise<Domain[]> => {
  let query = supabase
    .from('domains')
    .select(`
      *,
      mission:missions(id, name, client)
    `)
    .order('created_at', { ascending: false });

  if (filters?.mission_id) {
    query = query.eq('mission_id', filters.mission_id);
  }
  
  if (filters?.hosting_provider) {
    query = query.eq('hosting_provider', filters.hosting_provider);
  }
  
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters?.search) {
    query = query.ilike('domain_name', `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching domains:', error);
    throw new Error(`Erreur lors de la récupération des domaines: ${error.message}`);
  }

  return (data || []) as Domain[];
};

export const createDomain = async (domainData: DomainFormData): Promise<Domain> => {
  const encryptedData = {
    ...domainData,
    password_encrypted: encryptPassword(domainData.password),
  };

  // Enlever le champ password non chiffré
  const { password, ...dataToInsert } = encryptedData;

  const { data, error } = await supabase
    .from('domains')
    .insert(dataToInsert)
    .select(`
      *,
      mission:missions(id, name, client)
    `)
    .single();

  if (error) {
    console.error('Error creating domain:', error);
    throw new Error(`Erreur lors de la création du domaine: ${error.message}`);
  }

  return data as Domain;
};

export const updateDomain = async (id: string, updates: Partial<DomainFormData>): Promise<Domain> => {
  const updateData: any = { ...updates };
  
  // Si le mot de passe est fourni, le chiffrer
  if (updates.password) {
    updateData.password_encrypted = encryptPassword(updates.password);
    delete updateData.password;
  }

  const { data, error } = await supabase
    .from('domains')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      mission:missions(id, name, client)
    `)
    .single();

  if (error) {
    console.error('Error updating domain:', error);
    throw new Error(`Erreur lors de la mise à jour du domaine: ${error.message}`);
  }

  return data as Domain;
};

export const deleteDomain = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('domains')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting domain:', error);
    throw new Error(`Erreur lors de la suppression du domaine: ${error.message}`);
  }
};

export const getDecryptedDomainPassword = (encryptedPassword: string): string => {
  return decryptPassword(encryptedPassword);
};
