
import { z } from "zod";

export const formSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  missionId: z.string().min(1, "Veuillez sélectionner une mission"),
  dueDate: z.string().min(1, "Veuillez sélectionner une date"),
  templateContent: z.string().optional(),
  templateFileUrl: z.string().optional(),
  templateWebLink: z.string().optional(),
  databaseFileUrl: z.string().optional(),
  databaseWebLinks: z.array(z.string().url("URL invalide").optional()).max(5),
  databaseNotes: z.string().optional(),
  blacklistAccountsFileUrl: z.string().optional(),
  blacklistAccountsNotes: z.string().optional(),
  blacklistEmailsFileUrl: z.string().optional(),
  blacklistEmailsNotes: z.string().optional(),
}).refine(data => {
  // Au moins un champ template doit être rempli
  return !!data.templateContent || !!data.templateFileUrl || !!data.templateWebLink;
}, {
  message: "Veuillez fournir un template via le contenu, un fichier ou un lien web",
  path: ["templateContent"],
}).refine(data => {
  // Au moins un champ database doit être rempli
  return !!data.databaseFileUrl || data.databaseWebLinks.some(link => !!link) || !!data.databaseNotes;
}, {
  message: "Veuillez fournir une base de données via un fichier, un lien ou des notes explicatives",
  path: ["databaseFileUrl"],
});

export type FormData = z.infer<typeof formSchema>;

export const defaultValues = {
  title: "",
  missionId: "",
  dueDate: "",
  templateContent: "",
  templateFileUrl: "",
  templateWebLink: "",
  databaseFileUrl: "",
  databaseWebLinks: ["", "", "", "", ""],
  databaseNotes: "",
  blacklistAccountsFileUrl: "",
  blacklistAccountsNotes: "",
  blacklistEmailsFileUrl: "",
  blacklistEmailsNotes: "",
};
