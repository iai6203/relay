import React from "react";
import DragWindowRegion from "@/components/drag-window-region";
import { Navigation } from "@/components/navigation";

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <DragWindowRegion title="electron-shadcn" />
      <Navigation />
      <main className="mx-auto min-h-0 w-full max-w-7xl flex-1 px-5 py-4 lg:px-8">
        {children}
      </main>
    </div>
  );
}
