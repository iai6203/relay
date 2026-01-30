import { query } from "@anthropic-ai/claude-agent-sdk";
import type { PermissionResult } from "@anthropic-ai/claude-agent-sdk";
import { os, eventIterator } from "@orpc/server";

import {
  findClaudeExecutable,
  readSession,
  readSessions,
} from "@/utils/claude";
import { permissionBus } from "./permission-bus";
import {
  chatInputSchema,
  chatEventSchema,
  getSessionInputSchema,
  getSessionsInputSchema,
  permissionResponseSchema,
} from "./schemas";
import type { ChatEvent, PermissionResponse } from "./types";

export const chat = os
  .input(chatInputSchema)
  .output(eventIterator(chatEventSchema))
  .handler(async function* ({ input }) {
    const eventQueue: ChatEvent[] = [];
    let resolveWaiting: (() => void) | null = null;
    let done = false;

    function enqueue(event: ChatEvent) {
      eventQueue.push(event);
      if (resolveWaiting) {
        const r = resolveWaiting;
        resolveWaiting = null;
        r();
      }
    }

    async function* drain(): AsyncGenerator<ChatEvent> {
      while (!done || eventQueue.length > 0) {
        if (eventQueue.length > 0) {
          yield eventQueue.shift()!;
        } else {
          await new Promise<void>((resolve) => {
            resolveWaiting = resolve;
          });
        }
      }
    }

    let requestCounter = 0;

    const canUseTool = async (
      toolName: string,
      toolInput: Record<string, unknown>,
      options: {
        signal: AbortSignal;
        suggestions?: unknown[];
        blockedPath?: string;
        decisionReason?: string;
        toolUseID: string;
        agentID?: string;
      },
    ): Promise<PermissionResult> => {
      const requestId = `perm_${Date.now()}_${++requestCounter}`;

      enqueue({
        type: "permission_request",
        requestId,
        toolUseId: options.toolUseID,
        toolName,
        input: toolInput,
        decisionReason: options.decisionReason,
        blockedPath: options.blockedPath,
      });

      return new Promise<PermissionResult>((resolve, reject) => {
        const unsubscribe = permissionBus.subscribe(
          requestId,
          (response: PermissionResponse) => {
            unsubscribe();
            if (response.decision === "allow") {
              resolve({
                behavior: "allow",
                updatedInput: toolInput,
              });
            } else {
              resolve({
                behavior: "deny",
                message: response.message || "User denied permission",
              });
            }
          },
        );

        options.signal.addEventListener(
          "abort",
          () => {
            unsubscribe();
            reject(new Error("Aborted"));
          },
          { once: true },
        );
      });
    };

    const sdkPromise = (async () => {
      try {
        const response = query({
          prompt: input.prompt,
          options: {
            model: "claude-sonnet-4-5",
            pathToClaudeCodeExecutable: findClaudeExecutable(),
            allowedTools: [
              "Read",
              ...(input.autoApprove ? ["Write", "Bash", "Edit"] : []),
            ],
            canUseTool,
            ...(input.cwd ? { cwd: input.cwd } : {}),
            ...(input.sessionId ? { resume: input.sessionId } : {}),
          },
        });

        let sessionId: string | undefined;

        for await (const message of response) {
          if (message.type === "system" && message.subtype === "init") {
            sessionId = message.session_id;
            enqueue({ type: "init", sessionId: message.session_id });
          } else if (message.type === "assistant") {
            for (const block of message.message.content) {
              if ("text" in block && typeof block.text === "string") {
                enqueue({ type: "text", text: block.text });
              } else if ("name" in block && "id" in block) {
                enqueue({
                  type: "tool_call",
                  toolUseId: block.id as string,
                  toolName: block.name as string,
                  input: (block.input ?? {}) as Record<string, unknown>,
                });
              }
            }
          } else if (
            message.type === "user" &&
            message.tool_use_result != null
          ) {
            const content = message.message.content;
            if (Array.isArray(content)) {
              for (const block of content) {
                if (
                  typeof block === "object" &&
                  block !== null &&
                  "type" in block &&
                  block.type === "tool_result" &&
                  "tool_use_id" in block
                ) {
                  const resultContent =
                    "content" in block && typeof block.content === "string"
                      ? block.content
                      : JSON.stringify(block.content ?? "");
                  enqueue({
                    type: "tool_result",
                    toolUseId: block.tool_use_id as string,
                    output: resultContent,
                    isError: "is_error" in block && block.is_error === true,
                  });
                }
              }
            }
          } else if (message.type === "result") {
            enqueue({
              type: "result",
              sessionId: sessionId ?? input.sessionId ?? "",
            });
          }
        }
      } catch (error) {
        enqueue({
          type: "error",
          message: error instanceof Error ? error.message : String(error),
        });
      } finally {
        done = true;
        (resolveWaiting as (() => void) | null)?.();
      }
    })();

    yield* drain();

    await sdkPromise;
  });

export const getSessions = os
  .input(getSessionsInputSchema)
  .handler(async ({ input }) => {
    return readSessions(input.path);
  });

export const getSession = os
  .input(getSessionInputSchema)
  .handler(async ({ input }) => {
    return readSession(input.path, input.sessionId);
  });

export const respondToPermission = os
  .input(permissionResponseSchema)
  .handler(({ input }) => {
    permissionBus.publish(input.requestId, {
      requestId: input.requestId,
      decision: input.decision,
      message: input.message,
    });
  });
