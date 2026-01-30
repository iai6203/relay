export type ToolCallStatus =
  | "running"
  | "completed"
  | "error"
  | "approval-requested"
  | "denied";

export type MessageBlock =
  | { type: "text"; text: string }
  | {
      type: "tool_call";
      toolUseId: string;
      toolName: string;
      input: Record<string, unknown>;
      status: ToolCallStatus;
      output?: string;
      isError?: boolean;
    }
  | {
      type: "permission_request";
      requestId: string;
      toolUseId: string;
      toolName: string;
      input: Record<string, unknown>;
      decisionReason?: string;
      blockedPath?: string;
      decision?: "allow" | "deny";
    };

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  blocks: MessageBlock[];
}
