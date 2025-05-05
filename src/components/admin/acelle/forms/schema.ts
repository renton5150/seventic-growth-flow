
import * as z from "zod";

// Schéma de validation
export const formSchema = z.object({
  name: z.string().min(2, {
    message: "Le nom du compte doit comporter au moins 2 caractères.",
  }),
  api_endpoint: z.string().url({
    message: "L'URL de l'API doit être valide.",
  }),
  api_token: z.string().min(10, {
    message: "Le token API doit comporter au moins 10 caractères.",
  }),
  cache_priority: z.number().int().default(0),
  status: z.enum(["active", "inactive", "error"]).default("inactive"),
});

export type AcelleFormValues = z.infer<typeof formSchema>;
