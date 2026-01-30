import path from "node:path";

import { os } from "@orpc/server";
import { dialog } from "electron";

import { ipcContext } from "../context";
import { store } from "@/store";
import { removeProjectInputSchema } from "./schemas";

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
    const projects = store.get("projects");

    const filtered = projects.filter((project) => project.path !== projectPath);
    filtered.unshift({ path: projectPath, name, lastOpened: Date.now() });

    store.set("projects", filtered);

    return { path: projectPath, name };
  });

export const getProjects = os.handler(() => {
  return store.get("projects");
});

export const removeProject = os
  .input(removeProjectInputSchema)
  .handler(({ input }) => {
    const projects = store.get("projects");
    store.set(
      "projects",
      projects.filter((p) => p.path !== input.path),
    );
  });
