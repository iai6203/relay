import z from "zod";

export const getFileTreeInputSchema = z.object({
  path: z.string().min(1),
});

export const readFileInputSchema = z.object({
  filePath: z.string().min(1),
});

export const readFileAsBase64InputSchema = z.object({
  filePath: z.string().min(1),
});
