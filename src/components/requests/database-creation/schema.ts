
import { z } from "zod";

export const databaseCreationSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  missionId: z.string().min(1, "Veuillez sélectionner une mission"),
  dueDate: z.string().min(1, "Veuillez sélectionner une date et heure").refine((val) => {
    const date = new Date(val);
    return date > new Date();
  }, "La date de livraison doit être dans le futur"),
  tool: z.enum(["Hubspot", "Apollo"]),
  // Utiliser des strings pour la saisie en textarea, conversion en arrays lors de la soumission
  jobTitles: z.string().default(""),
  industries: z.string().default(""),
  companySize: z.string().default(""),
  locations: z.string().default(""),
  otherCriteria: z.string().default(""),
  blacklistAccountsNotes: z.string().default(""),
  blacklistEmailsNotes: z.string().default(""),
  blacklistAccountsFileUrls: z.array(z.string()).default([]),
  blacklistEmailsFileUrls: z.array(z.string()).default([]),
});

export type DatabaseCreationFormData = z.infer<typeof databaseCreationSchema>;

export const defaultValues: DatabaseCreationFormData = {
  title: "",
  missionId: "",
  dueDate: "",
  tool: "Hubspot" as const,
  jobTitles: "",
  industries: "",
  locations: "",
  companySize: "",
  otherCriteria: "",
  blacklistAccountsNotes: "",
  blacklistEmailsNotes: "",
  blacklistAccountsFileUrls: [],
  blacklistEmailsFileUrls: [],
};
