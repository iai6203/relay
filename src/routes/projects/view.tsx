import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { ChatStatus } from "ai";
import { z } from "zod";
import { MessageCircleIcon, PlusIcon, ShieldCheckIcon } from "lucide-react";

import type { ToolPart } from "@/components/ai-elements/tool";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import {
  Confirmation,
  ConfirmationTitle,
  ConfirmationRequest,
  ConfirmationAccepted,
  ConfirmationRejected,
  ConfirmationActions,
  ConfirmationAction,
} from "@/components/ai-elements/confirmation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ipc } from "@/ipc/manager";
import type {
  ToolCallStatus,
  ChatMessage,
  ChatSession,
} from "@/ipc/chat/types";

function mapStatusToToolState(status: ToolCallStatus): ToolPart["state"] {
  switch (status) {
    case "running":
      return "input-available";
    case "completed":
      return "output-available";
    case "error":
      return "output-error";
    case "approval-requested":
      return "approval-requested";
    case "denied":
      return "output-denied";
  }
}

const searchSchema = z.object({
  path: z.string(),
});

interface SessionMeta {
  id: string;
  sessionId?: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

function ProjectViewPage() {
  const { path } = Route.useSearch();

  const [sessionId, setSessionId] = useState<string>();
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [autoApprove, setAutoApprove] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>();
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;
  const currentSessionIdRef = useRef(currentSessionId);
  currentSessionIdRef.current = currentSessionId;

  useEffect(() => {
    ipc.client.chat
      .getSessions({ projectPath: path })
      .then((result) => setSessions(result as SessionMeta[]));
  }, [path]);

  const saveCurrentSession = useCallback(
    async (msgs: ChatMessage[], sdkSessionId?: string) => {
      const curId = currentSessionIdRef.current;
      if (msgs.length === 0) return;

      const firstUserMsg = msgs.find((m) => m.role === "user");
      const title = firstUserMsg
        ? firstUserMsg.content.slice(0, 50)
        : "New Chat";

      const now = Date.now();
      const session: ChatSession = {
        id: curId ?? crypto.randomUUID(),
        sessionId: sdkSessionId,
        title,
        createdAt: curId
          ? (sessions.find((s) => s.id === curId)?.createdAt ?? now)
          : now,
        updatedAt: now,
        messages: msgs,
      };

      if (!curId) {
        setCurrentSessionId(session.id);
      }

      await ipc.client.chat.saveSession({
        projectPath: path,
        session,
      });

      const updated = await ipc.client.chat.getSessions({
        projectPath: path,
      });
      setSessions(updated as SessionMeta[]);
    },
    [path, sessions],
  );

  const loadSession = useCallback(
    async (id: string) => {
      const session = await ipc.client.chat.getSession({
        projectPath: path,
        sessionId: id,
      });
      if (!session) return;

      setCurrentSessionId(session.id);
      setSessionId(session.sessionId ?? undefined);
      setMessages(session.messages as ChatMessage[]);
    },
    [path],
  );

  const startNewChat = useCallback(() => {
    setCurrentSessionId(undefined);
    setSessionId(undefined);
    setMessages([]);
  }, []);

  const handlePermissionResponse = useCallback(
    async (
      requestId: string,
      toolUseId: string,
      decision: "allow" | "deny",
      message?: string,
    ) => {
      await ipc.client.ai.respondToPermission({
        requestId,
        decision,
        message,
      });

      setMessages((prev) =>
        prev.map((msg) => ({
          ...msg,
          blocks: msg.blocks.map((b) => {
            if (b.type === "permission_request" && b.requestId === requestId) {
              return { ...b, decision };
            }
            if (b.type === "tool_call" && b.toolUseId === toolUseId) {
              return {
                ...b,
                status:
                  decision === "allow"
                    ? ("running" as const)
                    : ("denied" as const),
              };
            }
            return b;
          }),
        })),
      );
    },
    [],
  );

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      if (!message.text.trim()) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: message.text,
        blocks: [],
      };

      const assistantId = crypto.randomUUID();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        blocks: [],
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setStatus("submitted");

      try {
        const stream = await ipc.client.ai.chat({
          cwd: path,
          sessionId,
          prompt: message.text,
          autoApprove,
        });

        for await (const event of stream) {
          switch (event.type) {
            case "init":
              setSessionId(event.sessionId);
              break;

            case "text":
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId
                    ? {
                        ...msg,
                        content: msg.content + event.text,
                        blocks: [
                          ...msg.blocks,
                          { type: "text" as const, text: event.text },
                        ],
                      }
                    : msg,
                ),
              );
              break;

            case "tool_call":
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId
                    ? {
                        ...msg,
                        blocks: [
                          ...msg.blocks,
                          {
                            type: "tool_call" as const,
                            toolUseId: event.toolUseId,
                            toolName: event.toolName,
                            input: event.input,
                            status: "running" as const,
                          },
                        ],
                      }
                    : msg,
                ),
              );
              break;

            case "permission_request":
              setMessages((prev) =>
                prev.map((msg) => {
                  if (msg.id !== assistantId) return msg;
                  return {
                    ...msg,
                    blocks: msg.blocks
                      .map((b) =>
                        b.type === "tool_call" &&
                        b.toolUseId === event.toolUseId
                          ? {
                              ...b,
                              status: "approval-requested" as const,
                            }
                          : b,
                      )
                      .concat({
                        type: "permission_request" as const,
                        requestId: event.requestId,
                        toolUseId: event.toolUseId,
                        toolName: event.toolName,
                        input: event.input,
                        decisionReason: event.decisionReason,
                        blockedPath: event.blockedPath,
                      }),
                  };
                }),
              );
              break;

            case "tool_result":
              setMessages((prev) =>
                prev.map((msg) => {
                  if (msg.id !== assistantId) return msg;
                  return {
                    ...msg,
                    blocks: msg.blocks.map((b) =>
                      b.type === "tool_call" && b.toolUseId === event.toolUseId
                        ? {
                            ...b,
                            status: event.isError
                              ? ("error" as const)
                              : ("completed" as const),
                            output: event.output,
                            isError: event.isError,
                          }
                        : b,
                    ),
                  };
                }),
              );
              break;

            case "result":
              if (event.sessionId) {
                setSessionId(event.sessionId);
              }
              break;

            case "error":
              console.error("[chat stream] error:", event.message);
              break;
          }
        }
      } catch (error) {
        console.error("Chat error:", error);
      } finally {
        setStatus("ready");
        saveCurrentSession(messagesRef.current, sessionIdRef.current);
      }
    },
    [path, sessionId, autoApprove, saveCurrentSession],
  );

  return (
    <div className="flex h-full flex-col pb-4">
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <Select
          value={currentSessionId ?? "__new__"}
          onValueChange={(value) => {
            if (value === "__new__") {
              startNewChat();
            } else {
              loadSession(value);
            }
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="New Chat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__new__">New Chat</SelectItem>
            {sessions.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={startNewChat}>
          <PlusIcon className="size-4" />
        </Button>
      </div>

      <Conversation>
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<MessageCircleIcon className="size-8" />}
              title="No messages yet"
              description="Type a message below to start a conversation."
            />
          ) : (
            messages.map((msg) => (
              <Message key={msg.id} from={msg.role}>
                <MessageContent>
                  {msg.role === "user" ? (
                    msg.content
                  ) : (
                    <>
                      {msg.blocks.map((block, i) => {
                        if (block.type === "text") {
                          return (
                            <MessageResponse key={i}>
                              {block.text}
                            </MessageResponse>
                          );
                        }

                        if (block.type === "tool_call") {
                          return (
                            <Tool key={block.toolUseId}>
                              <ToolHeader
                                title={block.toolName}
                                type="dynamic-tool"
                                state={mapStatusToToolState(block.status)}
                                toolName={block.toolName}
                              />
                              <ToolContent>
                                <ToolInput input={block.input} />
                                {block.output != null && (
                                  <ToolOutput
                                    output={block.output}
                                    errorText={
                                      block.isError ? block.output : undefined
                                    }
                                  />
                                )}
                              </ToolContent>
                            </Tool>
                          );
                        }

                        if (block.type === "permission_request") {
                          const permState =
                            block.decision == null
                              ? "approval-requested"
                              : "approval-responded";

                          const approval =
                            block.decision == null
                              ? { id: block.requestId }
                              : {
                                  id: block.requestId,
                                  approved: block.decision === "allow",
                                };

                          return (
                            <Confirmation
                              key={block.requestId}
                              approval={approval}
                              state={permState as ToolPart["state"]}
                            >
                              <ConfirmationTitle>
                                <span className="font-semibold">
                                  {block.toolName}
                                </span>
                                {block.decisionReason &&
                                  ` — ${block.decisionReason}`}
                              </ConfirmationTitle>

                              <ConfirmationRequest>
                                <ToolInput input={block.input} />
                                <ConfirmationActions>
                                  <ConfirmationAction
                                    variant="outline"
                                    onClick={() =>
                                      handlePermissionResponse(
                                        block.requestId,
                                        block.toolUseId,
                                        "deny",
                                        "User denied permission",
                                      )
                                    }
                                  >
                                    Deny
                                  </ConfirmationAction>
                                  <ConfirmationAction
                                    onClick={() =>
                                      handlePermissionResponse(
                                        block.requestId,
                                        block.toolUseId,
                                        "allow",
                                      )
                                    }
                                  >
                                    Allow
                                  </ConfirmationAction>
                                </ConfirmationActions>
                              </ConfirmationRequest>

                              <ConfirmationAccepted>
                                <span className="text-green-600">Approved</span>
                              </ConfirmationAccepted>

                              <ConfirmationRejected>
                                <span className="text-red-600">Denied</span>
                              </ConfirmationRejected>
                            </Confirmation>
                          );
                        }

                        return null;
                      })}
                    </>
                  )}
                </MessageContent>
              </Message>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="mx-auto w-full">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea placeholder="Message" />
          <PromptInputFooter>
            <PromptInputTools>
              <div className="flex items-center gap-1.5">
                <Switch
                  id="auto-approve"
                  size="sm"
                  checked={autoApprove}
                  onCheckedChange={setAutoApprove}
                />
                <Label
                  htmlFor="auto-approve"
                  className="text-muted-foreground flex cursor-pointer items-center gap-1 text-xs"
                >
                  <ShieldCheckIcon className="size-3.5" />
                  Auto-approve
                </Label>
              </div>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
            </PromptInputTools>
            <PromptInputSubmit status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/projects/view")({
  validateSearch: searchSchema,
  component: ProjectViewPage,
});
