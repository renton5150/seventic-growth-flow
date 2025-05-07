
/**
 * Formate une chaîne de date en format local français
 * @param dateString - La chaîne de date à formater
 * @returns La date formatée en format français
 */
export const formatDateString = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Non défini';
  
  try {
    const date = new Date(dateString);
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) return 'Date invalide';
    
    // Formater la date en format français: DD/MM/YYYY HH:MM
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('Erreur de formatage de date:', error);
    return 'Erreur de format';
  }
};
