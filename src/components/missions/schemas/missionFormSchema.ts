
import * as z from "zod";

// Définir le schéma de validation pour les formulaires de mission
export const missionFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Le nom de la mission est requis"),
  sdrId: z.string().min(1, "Vous devez sélectionner un SDR"),
  description: z.string().optional(),
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
  type: z.enum(["Full", "Part"]),
  status: z.enum(["En cours", "Terminé"]),
}).refine((data) => {
  // Si les deux dates sont définies, vérifier que la date de fin est après la date de début
  if (data.startDate && data.endDate) {
    return data.endDate >= data.startDate;
  }
  return true;
}, {
  message: "La date de fin doit être après la date de début",
  path: ["endDate"],
});

export type MissionFormValues = z.infer<typeof missionFormSchema>;

