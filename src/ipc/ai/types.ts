export type ChatEvent =
  | ChatEventInit
  | ChatEventText
  | ChatEventToolCall
  | ChatEventToolResult
  | ChatEventPermissionRequest
  | ChatEventResult
  | ChatEventError;

export interface ChatEventInit {
  type: "init";
  sessionId: string;
}

export interface ChatEventText {
  type: "text";
  text: string;
}

export interface ChatEventToolCall {
  type: "tool_call";
  toolUseId: string;
  toolName: string;
  input: Record<string, unknown>;
}

export interface ChatEventToolResult {
  type: "tool_result";
  toolUseId: string;
  output: string;
  isError: boolean;
}

export interface ChatEventPermissionRequest {
  type: "permission_request";
  requestId: string;
  toolUseId: string;
  toolName: string;
  input: Record<string, unknown>;
  decisionReason?: string;
  blockedPath?: string;
}

export interface ChatEventResult {
  type: "result";
  sessionId: string;
}

export interface ChatEventError {
  type: "error";
  message: string;
}

export interface PermissionResponse {
  requestId: string;
  decision: "allow" | "deny";
  message?: string;
}
