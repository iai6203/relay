import fs from "node:fs/promises";
import path from "node:path";

import { os } from "@orpc/server";
import ignore, { type Ignore } from "ignore";

import type { TreeItem } from "@/components/ai/file-tree";

import { getFileTreeInputSchema } from "./schemas";

async function addGitignore(ig: Ignore, dirPath: string): Promise<Ignore> {
  try {
    const content = await fs.readFile(
      path.join(dirPath, ".gitignore"),
      "utf-8",
    );
    return ignore().add(ig).add(content);
  } catch {
    return ig;
  }
}

async function getTreeItems(
  dirPath: string,
  rootPath: string,
  parentIg: Ignore,
): Promise<TreeItem[]> {
  const ig = await addGitignore(parentIg, dirPath);
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  const items: TreeItem[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;

    const relativePath = path.relative(
      rootPath,
      path.join(dirPath, entry.name),
    );

    const checkPath = entry.isDirectory() ? `${relativePath}/` : relativePath;
    if (ig.ignores(checkPath)) continue;

    if (entry.isDirectory()) {
      const children = await getTreeItems(
        path.join(dirPath, entry.name),
        rootPath,
        ig,
      );
      items.push([entry.name, ...children]);
    } else {
      items.push(entry.name);
    }
  }

  return items;
}

export const getFileTree = os
  .input(getFileTreeInputSchema)
  .handler(async ({ input }) => {
    return getTreeItems(input.path, input.path, ignore());
  });
