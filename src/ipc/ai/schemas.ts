import z from "zod";

export const chatInputSchema = z.object({
  cwd: z.string().optional(),
  sessionId: z.string().optional(),
  prompt: z.string().min(1),
});

export const chatEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("init"), sessionId: z.string() }),
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({
    type: z.literal("tool_call"),
    toolUseId: z.string(),
    toolName: z.string(),
    input: z.record(z.string(), z.unknown()),
  }),
  z.object({
    type: z.literal("tool_result"),
    toolUseId: z.string(),
    output: z.string(),
    isError: z.boolean(),
  }),
  z.object({
    type: z.literal("permission_request"),
    requestId: z.string(),
    toolUseId: z.string(),
    toolName: z.string(),
    input: z.record(z.string(), z.unknown()),
    decisionReason: z.string().optional(),
    blockedPath: z.string().optional(),
  }),
  z.object({ type: z.literal("result"), sessionId: z.string() }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);

export const permissionResponseSchema = z.object({
  requestId: z.string(),
  decision: z.enum(["allow", "deny"]),
  message: z.string().optional(),
});
