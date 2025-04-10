
import * as z from "zod";

export const missionSchema = z.object({
  name: z.string().min(2, {
    message: "Le nom de la mission doit avoir au moins 2 caractères.",
  }),
  client: z.string().min(2, {
    message: "Le nom du client doit avoir au moins 2 caractères.",
  }),
  description: z.string().optional(),
  sdrId: z.string({
    required_error: "Veuillez sélectionner un SDR."
  }),
});

export type MissionFormValues = z.infer<typeof missionSchema>;
