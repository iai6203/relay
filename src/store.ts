import Store from "electron-store";

import type { ChatSession } from "./ipc/chat-history/types";

export interface RecentProject {
  path: string;
  name: string;
  lastOpened: number;
}

interface StoreSchema {
  recentProjects: RecentProject[];
  chatHistories: Record<string, ChatSession[]>;
}

const schema = {
  recentProjects: {
    type: "array" as const,
    items: {
      type: "object" as const,
      properties: {
        path: { type: "string" as const },
        name: { type: "string" as const },
        lastOpened: { type: "number" as const },
      },
      required: ["path", "name", "lastOpened"] as const,
    },
    default: [] as RecentProject[],
  },
  chatHistories: {
    type: "object" as const,
    additionalProperties: {
      type: "array" as const,
    },
    default: {} as Record<string, ChatSession[]>,
  },
};

export const store = new Store<StoreSchema>({ schema });
