import Store from "electron-store";

export interface RecentProject {
  path: string;
  name: string;
  lastOpened: number;
}

interface StoreSchema {
  recentProjects: RecentProject[];
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
};

export const store = new Store<StoreSchema>({ schema });
