
import * as z from "zod";

export const formSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  missionId: z.string().min(1, "La mission est requise"),
  dueDate: z.string().min(1, "La date de livraison est requise"),
  jobTitles: z.string().min(1, "Les intitulés de postes sont requis"),
  industries: z.string().min(1, "Les industries sont requises"),
  locations: z.string().optional(),
  companySize: z.string().optional(),
  otherCriteria: z.string().optional()
});

export type FormData = z.infer<typeof formSchema>;

export const defaultValues: FormData = {
  title: "",
  missionId: "",
  dueDate: "",
  jobTitles: "",
  industries: "",
  locations: "",
  companySize: "",
  otherCriteria: ""
};
