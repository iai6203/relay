import { execSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import type { ChatMessage, MessageBlock } from "@/ipc/chat/types";

export function findClaudeExecutable(): string {
  const shell = process.env.SHELL || "/bin/zsh";

  const response = execSync(`${shell} -lc "which claude" 2>/dev/null`, {
    encoding: "utf-8",
  });

  return response.trim();
}

export function getClaudeDataDirectory(): string {
  return join(homedir(), ".claude");
}

function getProjectDir(path: string): string {
  const projectDirName = path.replaceAll("/", "-");

  return join(getClaudeDataDirectory(), "projects", projectDirName);
}

export async function readSessions(path: string) {
  const projectDir = getProjectDir(path);
  const files = await readdir(projectDir);
  const jsonlFiles = files.filter((file) => file.endsWith(".jsonl"));

  return Promise.all(
    jsonlFiles.map(async (file) => {
      const content = await readFile(join(projectDir, file), "utf-8");
      const lines = content.trim().split("\n");

      let firstMessage: string | null = null;

      for (const line of lines) {
        const entry = JSON.parse(line);

        if (entry.type === "user" && entry.message?.role === "user") {
          const content = entry.message.content;

          firstMessage =
            typeof content === "string"
              ? content
              : Array.isArray(content)
                ? (content.find(
                    (block: { type?: string }) => block.type === "text",
                  )?.text ?? null)
                : null;
          break;
        }
      }

      return {
        sessionId: file.replace(".jsonl", ""),
        firstMessage,
      };
    }),
  );
}

export async function readSession(
  path: string,
  sessionId: string,
): Promise<ChatMessage[]> {
  const filePath = join(getProjectDir(path), `${sessionId}.jsonl`);
  const content = await readFile(filePath, "utf-8");
  const entries = content
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));

  return parseSessionEntries(entries);
}

function extractTextContent(content: unknown): string {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .filter((b: Record<string, unknown>) => b.type === "text")
      .map((b: Record<string, unknown>) => b.text)
      .join("");
  }

  return "";
}

function parseSessionEntries(
  entries: Record<string, unknown>[],
): ChatMessage[] {
  const messages: ChatMessage[] = [];

  for (const entry of entries) {
    const msg = entry.message as Record<string, unknown> | undefined;
    if (!msg) continue;

    if (entry.type === "user" && msg.role === "user") {
      const contentBlocks = msg.content;

      if (Array.isArray(contentBlocks)) {
        for (const block of contentBlocks as Record<string, unknown>[]) {
          if (block.type === "tool_result") {
            const toolUseId = block.tool_use_id as string;
            const output =
              typeof block.content === "string" ? block.content : "";
            const isError = block.is_error === true;

            for (let i = messages.length - 1; i >= 0; i--) {
              const target = messages[i].blocks.find(
                (b) => b.type === "tool_call" && b.toolUseId === toolUseId,
              );
              if (target && target.type === "tool_call") {
                target.output = output;
                target.isError = isError;
                break;
              }
            }
          }
        }
      }

      const text = extractTextContent(msg.content);
      if (!text) continue;

      messages.push({
        id: (entry.uuid as string) ?? crypto.randomUUID(),
        role: "user",
        content: text,
        blocks: [],
      });
    }

    if (entry.type === "assistant") {
      const contentBlocks = msg.content as Record<string, unknown>[];
      if (!Array.isArray(contentBlocks)) continue;

      const blocks: MessageBlock[] = [];
      let text = "";

      for (const block of contentBlocks) {
        if (block.type === "text" && typeof block.text === "string") {
          text += block.text;
          blocks.push({ type: "text", text: block.text });
        } else if (block.type === "tool_use") {
          blocks.push({
            type: "tool_call",
            toolUseId: block.id as string,
            toolName: block.name as string,
            input: (block.input ?? {}) as Record<string, unknown>,
            status: "completed",
          });
        }
      }

      if (blocks.length === 0) continue;

      const lastMsg =
        messages.length > 0 ? messages[messages.length - 1] : null;

      if (lastMsg?.role === "assistant") {
        lastMsg.content += text;
        lastMsg.blocks.push(...blocks);
      } else {
        messages.push({
          id: (entry.uuid as string) ?? crypto.randomUUID(),
          role: "assistant",
          content: text,
          blocks,
        });
      }
    }
  }

  return messages;
}
