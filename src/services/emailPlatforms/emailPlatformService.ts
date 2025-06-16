
import { supabase } from "@/integrations/supabase/client";
import { EmailPlatformAccount, EmailPlatformAccountFormData, EmailPlatformAccountFilters } from "@/types/emailPlatforms.types";

// Fonction simple de chiffrement (pour démonstration - en production, utiliser une méthode plus robuste)
export const encryptPassword = (password: string): string => {
  return btoa(password); // Simple base64 encoding
};

// Fonction de déchiffrement
export const getDecryptedPassword = (encryptedPassword: string): string => {
  try {
    return atob(encryptedPassword);
  } catch {
    return encryptedPassword; // Si le déchiffrement échoue, retourner tel quel
  }
};

export const getEmailPlatforms = async () => {
  const { data, error } = await supabase
    .from('email_platforms')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data;
};

export const getFrontOffices = async () => {
  const { data, error } = await supabase
    .from('front_offices')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data;
};

// Nouvelle fonction pour créer une plateforme
export const createEmailPlatform = async (name: string) => {
  const { data, error } = await supabase
    .from('email_platforms')
    .insert({ name: name.trim() })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getEmailPlatformAccounts = async (filters?: EmailPlatformAccountFilters) => {
  let query = supabase
    .from('email_platform_accounts')
    .select(`
      *,
      platform:email_platforms(*),
      mission:missions(id, name, client),
      front_offices:email_platform_account_front_offices(
        front_office:front_offices(*)
      )
    `)
    .order('created_at', { ascending: false });

  // Appliquer les filtres si fournis
  if (filters) {
    if (filters.platform_id) {
      query = query.eq('platform_id', filters.platform_id);
    }
    if (filters.mission_id) {
      query = query.eq('mission_id', filters.mission_id);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.spf_dkim_status) {
      query = query.eq('spf_dkim_status', filters.spf_dkim_status);
    }
    if (filters.dedicated_ip !== undefined) {
      query = query.eq('dedicated_ip', filters.dedicated_ip);
    }
    if (filters.search) {
      query = query.or(`login.ilike.%${filters.search}%,backup_email.ilike.%${filters.search}%`);
    }
  }

  const { data, error } = await query;
  
  if (error) throw error;

  // Transformer les données pour la structure attendue
  return data?.map(account => ({
    ...account,
    front_offices: account.front_offices?.map(fo => fo.front_office) || []
  })) || [];
};

export const createEmailPlatformAccount = async (formData: EmailPlatformAccountFormData) => {
  console.log('Creating email platform account with data:', formData);
  
  let platformId = formData.platform_id;
  
  // Si "manual" est sélectionné, créer d'abord la nouvelle plateforme
  if (formData.platform_id === "manual" && formData.platform_name) {
    console.log('Creating new platform:', formData.platform_name);
    
    // Vérifier si la plateforme existe déjà
    const { data: existingPlatform } = await supabase
      .from('email_platforms')
      .select('id')
      .eq('name', formData.platform_name.trim())
      .single();
    
    if (existingPlatform) {
      // La plateforme existe déjà, utiliser son ID
      platformId = existingPlatform.id;
    } else {
      // Créer la nouvelle plateforme
      const newPlatform = await createEmailPlatform(formData.platform_name);
      platformId = newPlatform.id;
    }
  }
  
  // Chiffrer le mot de passe
  const encryptedPassword = encryptPassword(formData.password);
  
  // Préparer les données pour l'insertion
  const accountData = {
    mission_id: formData.mission_id,
    platform_id: platformId, // Utiliser le nouvel ID si une plateforme a été créée
    login: formData.login,
    password_encrypted: encryptedPassword,
    phone_number: formData.phone_number || null,
    credit_card_name: formData.credit_card_name || null,
    credit_card_last_four: formData.credit_card_last_four || null,
    backup_email: formData.backup_email || null,
    status: formData.status,
    spf_dkim_status: formData.spf_dkim_status,
    dedicated_ip: formData.dedicated_ip,
    dedicated_ip_address: formData.dedicated_ip_address || null,
    routing_interfaces: formData.routing_interfaces,
    // Nouveaux champs domaine
    domain_name: formData.domain_name || null,
    domain_hosting_provider: formData.domain_hosting_provider || null,
    domain_login: formData.domain_login || null,
    domain_password: formData.domain_password || null,
  };

  console.log('Account data to insert:', accountData);

  // Insérer le compte
  const { data: account, error: accountError } = await supabase
    .from('email_platform_accounts')
    .insert(accountData)
    .select()
    .single();

  if (accountError) {
    console.error('Error creating account:', accountError);
    throw accountError;
  }

  console.log('Account created successfully:', account);

  // Gérer les associations front offices si nécessaire
  if (formData.front_office_ids && formData.front_office_ids.length > 0) {
    const frontOfficeAssociations = formData.front_office_ids.map(frontOfficeId => ({
      account_id: account.id,
      front_office_id: frontOfficeId
    }));

    const { error: foError } = await supabase
      .from('email_platform_account_front_offices')
      .insert(frontOfficeAssociations);

    if (foError) {
      console.error('Error creating front office associations:', foError);
      // Ne pas faire échouer la création du compte pour ça
    }
  }

  return account;
};

export const updateEmailPlatformAccount = async (
  id: string, 
  formData: Partial<EmailPlatformAccountFormData>
) => {
  console.log('Updating email platform account:', id, formData);
  
  // Préparer les données pour la mise à jour
  const updateData: any = { ...formData };
  
  // Chiffrer le mot de passe si fourni
  if (formData.password) {
    updateData.password_encrypted = encryptPassword(formData.password);
    delete updateData.password;
  }

  // Gérer les nouveaux champs domaine
  if (formData.domain_name !== undefined) {
    updateData.domain_name = formData.domain_name || null;
  }
  if (formData.domain_hosting_provider !== undefined) {
    updateData.domain_hosting_provider = formData.domain_hosting_provider || null;
  }
  if (formData.domain_login !== undefined) {
    updateData.domain_login = formData.domain_login || null;
  }
  if (formData.domain_password !== undefined) {
    updateData.domain_password = formData.domain_password || null;
  }

  // Nettoyer les champs qui ne vont pas dans la table principale
  delete updateData.front_office_ids;

  console.log('Update data prepared:', updateData);

  // Mettre à jour le compte
  const { data: account, error: accountError } = await supabase
    .from('email_platform_accounts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (accountError) {
    console.error('Error updating account:', accountError);
    throw accountError;
  }

  // Gérer les associations front offices si nécessaire
  if (formData.front_office_ids !== undefined) {
    // Supprimer les anciennes associations
    await supabase
      .from('email_platform_account_front_offices')
      .delete()
      .eq('account_id', id);

    // Créer les nouvelles associations
    if (formData.front_office_ids.length > 0) {
      const frontOfficeAssociations = formData.front_office_ids.map(frontOfficeId => ({
        account_id: id,
        front_office_id: frontOfficeId
      }));

      const { error: foError } = await supabase
        .from('email_platform_account_front_offices')
        .insert(frontOfficeAssociations);

      if (foError) {
        console.error('Error updating front office associations:', foError);
        // Ne pas faire échouer la mise à jour du compte pour ça
      }
    }
  }

  return account;
};

export const deleteEmailPlatformAccount = async (id: string) => {
  console.log('Starting deletion for account ID:', id);
  
  try {
    // Supprimer d'abord les associations front offices
    console.log('Deleting front office associations...');
    const { error: frontOfficeError } = await supabase
      .from('email_platform_account_front_offices')
      .delete()
      .eq('account_id', id);

    if (frontOfficeError) {
      console.warn('Warning deleting front office associations:', frontOfficeError);
      // Continuer même si cette étape échoue
    }

    // Supprimer le compte principal
    console.log('Deleting main account...');
    const { error: deleteError } = await supabase
      .from('email_platform_accounts')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting account:', deleteError);
      throw new Error(`Erreur lors de la suppression: ${deleteError.message}`);
    }

    console.log('Account deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('Deletion failed:', error);
    throw error;
  }
};
