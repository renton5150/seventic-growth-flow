
import { z } from "zod";

export const databaseCreationSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  missionId: z.string().min(1, "Veuillez sélectionner une mission"),
  tool: z.enum(["Hubspot", "Apollo"]),
  jobTitles: z.array(z.string()).default([]),
  industries: z.array(z.string()).default([]),
  companySize: z.array(z.string()).default([]),
  locations: z.array(z.string()).default([]),
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
  tool: "Hubspot" as const,
  jobTitles: [],
  industries: [],
  locations: [],
  companySize: [],
  otherCriteria: "",
  blacklistAccountsNotes: "",
  blacklistEmailsNotes: "",
  blacklistAccountsFileUrls: [],
  blacklistEmailsFileUrls: [],
};
