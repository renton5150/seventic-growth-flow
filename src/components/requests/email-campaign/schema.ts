
import { z } from "zod";

export const formSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  subject: z.string().min(1, "Le sujet est requis"),
  emailType: z.enum(["Mass email", "LinkedIn outreach", "Newsletter", "Follow-up"]).default("Mass email"),
  missionId: z.string().min(1, "La mission est requise"),
  dueDate: z.string().min(1, "La date d'échéance est requise"),
  templateContent: z.string().optional(),
  templateFileUrl: z.string().optional(),
  templateWebLink: z.string().optional(),
  databaseFileUrls: z.array(z.string()).default([]),
  databaseFileUrl: z.string().optional(),
  databaseWebLinks: z.array(z.string()).default([]),
  databaseNotes: z.string().optional(),
  blacklistAccountsFileUrls: z.array(z.string()).default([]), // Nouveau champ
  blacklistAccountsFileUrl: z.string().optional(), // Maintenu pour compatibilité
  blacklistAccountsNotes: z.string().optional(),
  blacklistEmailsFileUrls: z.array(z.string()).default([]), // Nouveau champ
  blacklistEmailsFileUrl: z.string().optional(), // Maintenu pour compatibilité
  blacklistEmailsNotes: z.string().optional(),
});

export type FormData = z.infer<typeof formSchema>;

export const defaultValues: FormData = {
  title: "",
  subject: "",
  emailType: "Mass email",
  missionId: "",
  dueDate: "",
  templateContent: "",
  templateFileUrl: "",
  templateWebLink: "",
  databaseFileUrls: [],
  databaseFileUrl: "",
  databaseWebLinks: ["", "", "", "", ""],
  databaseNotes: "",
  blacklistAccountsFileUrls: [], // Nouveau champ avec valeur par défaut
  blacklistAccountsFileUrl: "",
  blacklistAccountsNotes: "",
  blacklistEmailsFileUrls: [], // Nouveau champ avec valeur par défaut
  blacklistEmailsFileUrl: "",
  blacklistEmailsNotes: "",
};
