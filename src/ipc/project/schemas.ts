import z from "zod";

export const removeProjectInputSchema = z.object({
  path: z.string(),
});