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
    status: z.enum(["running", "completed", "error", "approval-requested", "denied"]),
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

const chatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  blocks: z.array(messageBlockSchema),
});

const chatSessionSchema = z.object({
  id: z.string(),
  sessionId: z.string().optional(),
  title: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  messages: z.array(chatMessageSchema),
});

export const getSessionsInputSchema = z.object({
  projectPath: z.string(),
});

export const getSessionInputSchema = z.object({
  projectPath: z.string(),
  sessionId: z.string(),
});

export const saveSessionInputSchema = z.object({
  projectPath: z.string(),
  session: chatSessionSchema,
});

export const deleteSessionInputSchema = z.object({
  projectPath: z.string(),
  sessionId: z.string(),
});
