import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ipc } from "@/ipc/manager";
import type { Project } from "@/store";

function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    ipc.client.project.getProjects().then(setProjects);
  }, []);

  const handleOpenProject = async () => {
    const result = await ipc.client.project.openProject();
    if (result) {
      ipc.client.project.getProjects().then(setProjects);
    }
  };

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">프로젝트</h1>
          <Button onClick={handleOpenProject}>프로젝트 열기</Button>
        </div>
        <ul className="mt-4 space-y-2">
          {projects.map((project) => (
            <li key={project.path}>
              <Link
                to="/projects/view"
                search={{ path: project.path }}
                className="hover:bg-accent block rounded-md border px-4 py-3"
              >
                <p className="font-medium">{project.name}</p>
                <p className="text-muted-foreground text-sm">{project.path}</p>
              </Link>
            </li>
          ))}
        </ul>
        {projects.length === 0 && (
          <p className="text-muted-foreground mt-4">
            최근 프로젝트가 없습니다.
          </p>
        )}
      </div>
    </>
  );
}

export const Route = createFileRoute("/projects/")({
  component: ProjectsPage,
});
