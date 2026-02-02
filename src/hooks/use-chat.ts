import { useCallback, useState } from "react";
import type { ChatStatus } from "ai";

import { ipc } from "@/ipc/manager";
import type { ChatMessage } from "@/ipc/chat/types";

interface UseChatOptions {
  path: string;
  onToolResult?: () => void;
}

export function useChat({ path, onToolResult }: UseChatOptions) {
  const [sessionId, setSessionId] = useState<string>();
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [autoApprove, setAutoApprove] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

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

  const resetSession = useCallback(() => {
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

  const submit = useCallback(
    async (prompt: string) => {
      if (!prompt.trim()) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: prompt,
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
          prompt,
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
              onToolResult?.();
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
    [path, sessionId, autoApprove, onToolResult],
  );

  return {
    sessionId,
    status,
    messages,
    autoApprove,
    setAutoApprove,
    loadSession,
    resetSession,
    handlePermissionResponse,
    submit,
  };
}
