import z from "zod";

export const removeRecentProjectInputSchema = z.object({
  path: z.string(),
});
