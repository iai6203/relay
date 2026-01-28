import path from "node:path";

import { os } from "@orpc/server";
import { dialog } from "electron";

import { ipcContext } from "../context";
import { store } from "@/store";
import { removeRecentProjectInputSchema } from "./schemas";

export const openProject = os
  .use(ipcContext.mainWindowContext)
  .handler(async ({ context }) => {
    const { canceled, filePaths } = await dialog.showOpenDialog(
      context.window,
      {
        properties: ["openDirectory"],
      },
    );

    if (canceled || filePaths.length === 0) {
      return null;
    }

    const projectPath = filePaths[0];
    const name = path.basename(projectPath);
    const recentProjects = store.get("recentProjects");

    const filtered = recentProjects.filter((p) => p.path !== projectPath);
    filtered.unshift({ path: projectPath, name, lastOpened: Date.now() });

    store.set("recentProjects", filtered);

    return { path: projectPath, name };
  });

export const getRecentProjects = os.handler(() => {
  return store.get("recentProjects");
});

export const removeRecentProject = os
  .input(removeRecentProjectInputSchema)
  .handler(({ input }) => {
    const recentProjects = store.get("recentProjects");
    store.set(
      "recentProjects",
      recentProjects.filter((p) => p.path !== input.path),
    );
  });
