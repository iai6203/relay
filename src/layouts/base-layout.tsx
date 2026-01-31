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
      <main className="min-h-0 w-full flex-1">{children}</main>
    </div>
  );
}
