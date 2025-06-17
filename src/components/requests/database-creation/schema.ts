
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

export const formSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  missionId: z.string().min(1, "Veuillez sélectionner une mission"),
  dueDate: z.union([z.string(), z.date()]).transform((val) => {
    if (typeof val === 'string') return val;
    return val.toISOString().split('T')[0];
  }),
  tool: z.enum(["Hubspot", "Apollo"]),
  jobTitles: z.string().optional(),
  industries: z.string().optional(),
  companySize: z.string().optional(),
  locations: z.string().optional(),
  otherCriteria: z.string().optional(),
  blacklistAccountsFileUrl: z.string().optional(),
  blacklistAccountsNotes: z.string().optional(),
  blacklistContactsFileUrl: z.string().optional(),
  blacklistContactsNotes: z.string().optional(),
}).refine(data => {
  // Au moins un des critères de ciblage doit être rempli
  return !!data.jobTitles || !!data.industries || !!data.companySize || !!data.locations || !!data.otherCriteria;
}, {
  message: "Veuillez fournir au moins un critère de ciblage",
  path: ["jobTitles"],
});

export type FormData = z.infer<typeof formSchema>;

// Permettre de sélectionner le jour même
const today = new Date().toISOString().split('T')[0];

export const defaultValues: FormData = {
  title: "",
  missionId: "",
  dueDate: today, // Utiliser la date du jour par défaut
  tool: "Hubspot" as const,
  jobTitles: "",
  industries: "",
  locations: "",
  companySize: "",
  otherCriteria: "",
  blacklistAccountsFileUrl: "",
  blacklistAccountsNotes: "",
  blacklistContactsFileUrl: "",
  blacklistContactsNotes: "",
};
