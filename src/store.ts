import Store from "electron-store";

export interface Project {
  path: string;
  name: string;
  lastOpened: number;
}

interface StoreSchema {
  projects: Project[];
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
};

export const store = new Store<StoreSchema>({ schema });
