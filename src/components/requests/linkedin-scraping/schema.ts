
import { z } from "zod";

export const formSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  missionId: z.string().min(1, "Veuillez sélectionner une mission"),
  dueDate: z.union([z.string(), z.date()]).transform((val) => {
    if (typeof val === 'string') return val;
    return val.toISOString().split('T')[0];
  }),
  jobTitles: z.string().optional(),
  locations: z.string().optional(),
  industries: z.string().optional(),
  companySize: z.string().optional(),
  otherCriteria: z.string().optional(),
}).refine(data => {
  // Au moins un des critères de ciblage doit être rempli
  return !!data.jobTitles || !!data.locations || !!data.industries || !!data.companySize || !!data.otherCriteria;
}, {
  message: "Veuillez fournir au moins un critère de ciblage",
  path: ["jobTitles"],
});

export type FormData = z.infer<typeof formSchema>;

export const defaultValues = {
  title: "",
  missionId: "",
  dueDate: "",
  jobTitles: "",
  locations: "",
  industries: "",
  companySize: "",
  otherCriteria: "",
};
