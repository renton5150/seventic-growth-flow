
import { z } from "zod";

export const formSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  missionId: z.string().min(1, "Veuillez sélectionner une mission"),
  dueDate: z.date({ required_error: "Veuillez sélectionner une date" }),
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

export const defaultValues: FormData = {
  title: "",
  missionId: "",
  dueDate: new Date(),
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
