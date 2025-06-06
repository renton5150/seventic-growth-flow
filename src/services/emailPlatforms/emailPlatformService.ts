
import { supabase } from "@/integrations/supabase/client";
import { EmailPlatform, FrontOffice, EmailPlatformAccount, EmailPlatformAccountFormData, EmailPlatformAccountFilters } from "@/types/emailPlatforms.types";

// Service pour chiffrer/déchiffrer les mots de passe (implémentation basique)
const encryptPassword = (password: string): string => {
  // Pour la démo, on utilise btoa (base64). En production, utiliser une vraie encryption
  return btoa(password);
};

const decryptPassword = (encryptedPassword: string): string => {
  try {
    return atob(encryptedPassword);
  } catch {
    return '***';
  }
};

// Récupérer toutes les plateformes d'emailing
export const getEmailPlatforms = async (): Promise<EmailPlatform[]> => {
  const { data, error } = await supabase
    .from('email_platforms')
    .select('*')
    .order('name');

  if (error) {
    console.error('Erreur lors de la récupération des plateformes:', error);
    throw error;
  }

  return data || [];
};

// Récupérer tous les front offices
export const getFrontOffices = async (): Promise<FrontOffice[]> => {
  const { data, error } = await supabase
    .from('front_offices')
    .select('*')
    .order('name');

  if (error) {
    console.error('Erreur lors de la récupération des front offices:', error);
    throw error;
  }

  return data || [];
};

// Récupérer tous les comptes avec leurs relations
export const getEmailPlatformAccounts = async (filters?: EmailPlatformAccountFilters): Promise<EmailPlatformAccount[]> => {
  let query = supabase
    .from('email_platform_accounts')
    .select(`
      *,
      platform:email_platforms(*),
      mission:missions(id, name, client)
    `);

  // Appliquer les filtres
  if (filters?.platform_id) {
    query = query.eq('platform_id', filters.platform_id);
  }
  if (filters?.mission_id) {
    query = query.eq('mission_id', filters.mission_id);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.spf_dkim_status) {
    query = query.eq('spf_dkim_status', filters.spf_dkim_status);
  }
  if (filters?.dedicated_ip !== undefined) {
    query = query.eq('dedicated_ip', filters.dedicated_ip);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Erreur lors de la récupération des comptes:', error);
    throw error;
  }

  if (!data) return [];

  // Récupérer les front offices pour chaque compte
  const accountsWithFrontOffices = await Promise.all(
    data.map(async (account) => {
      const { data: frontOfficeData } = await supabase
        .from('email_platform_account_front_offices')
        .select('front_office:front_offices(*)')
        .eq('account_id', account.id);

      return {
        ...account,
        front_offices: frontOfficeData?.map(item => item.front_office).filter(Boolean) || []
      };
    })
  );

  return accountsWithFrontOffices;
};

// Créer un nouveau compte
export const createEmailPlatformAccount = async (data: EmailPlatformAccountFormData): Promise<EmailPlatformAccount> => {
  const { front_office_ids, password, ...accountData } = data;

  // Chiffrer le mot de passe
  const encryptedPassword = encryptPassword(password);

  const { data: newAccount, error } = await supabase
    .from('email_platform_accounts')
    .insert({
      ...accountData,
      password_encrypted: encryptedPassword
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la création du compte:', error);
    throw error;
  }

  // Associer les front offices si SMTP est sélectionné
  if (front_office_ids && front_office_ids.length > 0 && 
      (data.routing_interfaces.includes('SMTP') || data.routing_interfaces.includes('Les deux'))) {
    
    const frontOfficeRelations = front_office_ids.map(frontOfficeId => ({
      account_id: newAccount.id,
      front_office_id: frontOfficeId
    }));

    const { error: relationError } = await supabase
      .from('email_platform_account_front_offices')
      .insert(frontOfficeRelations);

    if (relationError) {
      console.error('Erreur lors de l\'association des front offices:', relationError);
      // Ne pas faire échouer la création pour ça
    }
  }

  return newAccount;
};

// Mettre à jour un compte
export const updateEmailPlatformAccount = async (id: string, data: Partial<EmailPlatformAccountFormData>): Promise<EmailPlatformAccount> => {
  const { front_office_ids, password, ...accountData } = data;

  let updateData = { ...accountData };

  // Chiffrer le nouveau mot de passe si fourni
  if (password) {
    updateData.password_encrypted = encryptPassword(password);
  }

  const { data: updatedAccount, error } = await supabase
    .from('email_platform_accounts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la mise à jour du compte:', error);
    throw error;
  }

  // Mettre à jour les associations front offices si nécessaire
  if (front_office_ids !== undefined) {
    // Supprimer les anciennes associations
    await supabase
      .from('email_platform_account_front_offices')
      .delete()
      .eq('account_id', id);

    // Créer les nouvelles associations
    if (front_office_ids.length > 0 && 
        (data.routing_interfaces?.includes('SMTP') || data.routing_interfaces?.includes('Les deux'))) {
      
      const frontOfficeRelations = front_office_ids.map(frontOfficeId => ({
        account_id: id,
        front_office_id: frontOfficeId
      }));

      await supabase
        .from('email_platform_account_front_offices')
        .insert(frontOfficeRelations);
    }
  }

  return updatedAccount;
};

// Supprimer un compte
export const deleteEmailPlatformAccount = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('email_platform_accounts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur lors de la suppression du compte:', error);
    throw error;
  }
};

// Fonction utilitaire pour obtenir le mot de passe déchiffré (pour les rôles autorisés)
export const getDecryptedPassword = (encryptedPassword: string): string => {
  return decryptPassword(encryptedPassword);
};
