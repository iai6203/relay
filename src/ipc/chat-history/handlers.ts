import { os } from "@orpc/server";

import { store } from "@/store";
import type { ChatSession } from "./types";
import {
  getSessionsInputSchema,
  getSessionInputSchema,
  saveSessionInputSchema,
  deleteSessionInputSchema,
} from "./schemas";

export const getSessions = os
  .input(getSessionsInputSchema)
  .handler(({ input }) => {
    const all = store.get("chatHistories");
    const sessions = all[input.projectPath] ?? [];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return sessions.map(({ messages, ...meta }) => meta) as Omit<
      ChatSession,
      "messages"
    >[];
  });

export const getSession = os
  .input(getSessionInputSchema)
  .handler(({ input }) => {
    const all = store.get("chatHistories");
    const sessions = all[input.projectPath] ?? [];
    return sessions.find((s) => s.id === input.sessionId) ?? null;
  });

export const saveSession = os
  .input(saveSessionInputSchema)
  .handler(({ input }) => {
    const all = store.get("chatHistories");
    const sessions = all[input.projectPath] ?? [];
    const idx = sessions.findIndex((s) => s.id === input.session.id);

    if (idx >= 0) {
      sessions[idx] = input.session;
    } else {
      sessions.unshift(input.session);
    }

    store.set("chatHistories", { ...all, [input.projectPath]: sessions });
  });

export const deleteSession = os
  .input(deleteSessionInputSchema)
  .handler(({ input }) => {
    const all = store.get("chatHistories");
    const sessions = all[input.projectPath] ?? [];
    store.set("chatHistories", {
      ...all,
      [input.projectPath]: sessions.filter((s) => s.id !== input.sessionId),
    });
  });
