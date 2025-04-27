
import { format as dateFnsFormat } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Format a date with a standard format (dd/MM/yyyy)
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return "Non défini";
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateFnsFormat(dateObj, "dd/MM/yyyy", { locale: fr });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Format invalide";
  }
};

/**
 * Format a date with time (dd/MM/yyyy HH:mm)
 */
export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return "Non défini";
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateFnsFormat(dateObj, "dd/MM/yyyy HH:mm", { locale: fr });
  } catch (error) {
    console.error("Error formatting date time:", error);
    return "Format invalide";
  }
};

/**
 * Check if two dates are the same day
 */
export const isSameDay = (first: Date, second: Date): boolean => {
  return first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate();
};
