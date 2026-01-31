import z from "zod";

export const getFileTreeInputSchema = z.object({
  path: z.string().min(1),
});
