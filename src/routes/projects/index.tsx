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

  const handleDeleteProject = async (project: Project) => {
    await ipc.client.project.removeProject({
      path: project.path,
    });
    setProjects((prev) => prev.filter((p) => p.path !== project.path));
  };

  return (
    <>
      <div className="flex h-full flex-col p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">프로젝트</h1>
          <Button onClick={handleOpenProject}>프로젝트 열기</Button>
        </div>
        <ul className="mt-4 space-y-2">
          {projects.map((project) => (
            <li
              key={project.path}
              className="flex items-center gap-2 rounded-md border p-2"
            >
              <Link
                to="/projects/view"
                search={{ path: project.path }}
                className="hover:bg-accent flex-1 rounded-md px-2 py-1"
              >
                <p className="font-medium">{project.name}</p>
                <p className="text-muted-foreground text-sm">{project.path}</p>
              </Link>
              <Button
                variant="destructive"
                size="lg"
                onClick={() => handleDeleteProject(project)}
              >
                삭제
              </Button>
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
