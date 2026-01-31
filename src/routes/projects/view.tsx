import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { ChatStatus } from "ai";
import { z } from "zod";
import {
  HistoryIcon,
  MessageCircleIcon,
  PlusIcon,
  ShieldCheckIcon,
} from "lucide-react";

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
import { FileTree, type TreeItem } from "@/components/ai/file-tree";
import { SessionList } from "@/components/ai/session-list";
import { BashTool } from "@/components/ai/bash-tool";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ipc } from "@/ipc/manager";
import type { ToolCallStatus, ChatMessage } from "@/ipc/chat/types";

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

function ProjectViewPage() {
  const { path } = Route.useSearch();

  const [tree, setTree] = useState<TreeItem[]>([]);
  const [sessionId, setSessionId] = useState<string>();
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [autoApprove, setAutoApprove] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    ipc.client.fs.getFileTree({ path }).then(setTree).catch(console.error);
  }, [path]);

  const loadSession = useCallback(
    async (id: string) => {
      setSessionId(id);
      try {
        const data = await ipc.client.ai.getSession({ path, sessionId: id });
        setMessages(data);
      } catch (error) {
        console.error(error);
      }
    },
    [path],
  );

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
      }
    },
    [path, sessionId, autoApprove],
  );

  return (
    <SidebarProvider className="relative h-full min-h-0 gap-4 overflow-hidden">
      <Sidebar className="absolute h-full [&_[data-slot=sidebar-inner]]:bg-transparent">
        <FileTree tree={tree} />
      </Sidebar>
      <SidebarInset>
        <div className="flex h-full flex-1 flex-col py-2 pr-4">
          {/* Header */}
          <div className="flex justify-end gap-2 py-2">
            <Button
              variant="outline"
              size="sm"
              disabled={status !== "ready"}
              onClick={() => {
                setSessionId(undefined);
                setMessages([]);
              }}
            >
              <PlusIcon />
              New Chat
            </Button>
            <SessionList
              path={path}
              variant="outline"
              size="sm"
              disabled={status !== "ready"}
              onSelectSession={loadSession}
            >
              <HistoryIcon />
              Sessions
            </SessionList>
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
                              if (block.toolName === "Bash") {
                                return (
                                  <BashTool
                                    key={block.toolUseId}
                                    toolName={block.toolName}
                                    state={mapStatusToToolState(block.status)}
                                    input={block.input}
                                    output={block.output}
                                    isError={block.isError}
                                  />
                                );
                              }

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
                                          block.isError
                                            ? block.output
                                            : undefined
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
                                    <span className="text-green-600">
                                      Approved
                                    </span>
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
      </SidebarInset>
    </SidebarProvider>
  );
}

export const Route = createFileRoute("/projects/view")({
  validateSearch: searchSchema,
  component: ProjectViewPage,
});
