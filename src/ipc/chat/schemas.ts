import z from "zod";

const messageBlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    text: z.string(),
  }),
  z.object({
    type: z.literal("tool_call"),
    toolUseId: z.string(),
    toolName: z.string(),
    input: z.record(z.string(), z.unknown()),
    status: z.enum([
      "running",
      "completed",
      "error",
      "approval-requested",
      "denied",
    ]),
    output: z.string().optional(),
    isError: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("permission_request"),
    requestId: z.string(),
    toolUseId: z.string(),
    toolName: z.string(),
    input: z.record(z.string(), z.unknown()),
    decisionReason: z.string().optional(),
    blockedPath: z.string().optional(),
    decision: z.enum(["allow", "deny"]).optional(),
  }),
]);

export const chatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  blocks: z.array(messageBlockSchema),
});
