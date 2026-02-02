import z from "zod";

export const createTerminalInputSchema = z.object({
  cwd: z.string().min(1),
  shell: z.string().optional(),
});

export const createTerminalOutputSchema = z.object({
  terminalId: z.string(),
});

export const terminalIdInputSchema = z.object({
  terminalId: z.string().min(1),
});

export const writeTerminalInputSchema = z.object({
  terminalId: z.string().min(1),
  data: z.string(),
});

export const resizeTerminalInputSchema = z.object({
  terminalId: z.string().min(1),
  cols: z.number().int().positive(),
  rows: z.number().int().positive(),
});

export const terminalDataEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("data"), data: z.string() }),
  z.object({
    type: z.literal("exit"),
    exitCode: z.number().nullable(),
  }),
]);
