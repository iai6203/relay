import Store from "electron-store";

import type { ChatSession } from "./ipc/chat/types";

export interface Project {
  path: string;
  name: string;
  lastOpened: number;
}

interface StoreSchema {
  projects: Project[];
  chats: Record<string, ChatSession[]>;
}

const schema = {
  projects: {
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
    default: [] as Project[],
  },
  chats: {
    type: "object" as const,
    additionalProperties: {
      type: "array" as const,
    },
    default: {} as Record<string, ChatSession[]>,
  },
};

export const store = new Store<StoreSchema>({ schema });
