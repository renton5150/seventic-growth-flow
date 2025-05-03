
/**
 * Formate une date en format lisible
 */
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return "—";
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    console.error(`Erreur de formatage de date: ${dateString}`, e);
    return dateString;
  }
};
