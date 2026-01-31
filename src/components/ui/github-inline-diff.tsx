"use client";

import { useMemo } from "react";
import { cn } from "@/utils/tailwind";
import { Badge } from "@/components/ui/badge";

export default function Page() {
  const diff = useMemo(
    () =>
      [
        { kind: "hunk", content: "@@ -12,7 +12,9 @@" },
        {
          kind: "context",
          old: 12,
          new: 12,
          content: "export function getUserName(id: string) {",
        },
        {
          kind: "del",
          old: 13,
          new: null,
          content: "  const name = cache.get(id)",
        },
        {
          kind: "add",
          old: null,
          new: 13,
          content: "  const name = cache.get(id) ?? '(unknown)'",
        },
        { kind: "context", old: 14, new: 14, content: "  return name?.trim()" },
        { kind: "context", old: 15, new: 15, content: "}" },
        { kind: "hunk", content: "@@ -32,4 +34,6 @@" },
        {
          kind: "context",
          old: 32,
          new: 34,
          content: "const PORT = process.env.PORT || 3000",
        },
        { kind: "del", old: 33, new: null, content: "server.listen(PORT)" },
        {
          kind: "add",
          old: null,
          new: 35,
          content: "server.listen(PORT, () => {",
        },
        {
          kind: "add",
          old: null,
          new: 36,
          content: "  console.log('Server running on', PORT)",
        },
        { kind: "add", old: null, new: 37, content: "})" },
      ] as const,
    [],
  );

  return (
    <main className="mx-auto max-w-4xl p-4">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-pretty">
            Inline Diff Comments (GitHub-style)
          </h1>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Hover a line to reveal “Add comment”. Click to open a compact inline
            thread.
          </p>
        </div>
      </header>

      <section aria-label="Diff with inline comments">
        <DiffList diff={diff} fileName="src/server.ts" />
      </section>
    </main>
  );
}

export type Line =
  | { kind: "hunk"; content: string }
  | { kind: "context"; old: number | null; new: number | null; content: string }
  | { kind: "add"; old: number | null; new: number | null; content: string }
  | { kind: "del"; old: number | null; new: number | null; content: string };

export function DiffList({
  diff,
  fileName,
}: {
  diff: readonly Line[];
  fileName: string;
}) {
  const rows = Array.isArray(diff) ? diff : ([] as readonly Line[]);

  return (
    <div
      role="table"
      aria-label={`Diff of ${fileName}`}
      className="bg-card rounded-md border dark:border-white/10"
    >
      <div className="flex items-center justify-between border-b px-2 py-1 dark:border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium">{fileName}</span>
          <Badge
            variant="secondary"
            aria-label="File status"
            className="h-5 px-1.5 text-[11px]"
          >
            modified
          </Badge>
        </div>
      </div>

      <ol role="rowgroup" className="divide-y dark:divide-white/10">
        {rows.map((line, idx) => {
          const isChange = line.kind === "add" || line.kind === "del";

          return (
            <li
              key={idx}
              role="row"
              className={cn(
                "group relative flex items-stretch text-[13px]",
                line.kind === "hunk" && "bg-muted/50 text-muted-foreground",
                line.kind === "add" &&
                  "bg-emerald-50/60 dark:bg-emerald-950/20",
                line.kind === "del" && "bg-rose-50/60 dark:bg-rose-950/20",
              )}
            >
              <div
                role="cell"
                className={cn(
                  "text-muted-foreground grid w-16 shrink-0 grid-cols-2 border-r text-[11px] dark:border-white/10",
                )}
              >
                <span className="px-2 py-1 text-right tabular-nums">
                  {line.kind === "add"
                    ? ""
                    : line.kind === "hunk"
                      ? ""
                      : (line.old ?? "")}
                </span>
                <span className="px-2 py-1 text-right tabular-nums">
                  {line.kind === "del"
                    ? ""
                    : line.kind === "hunk"
                      ? ""
                      : (line.new ?? "")}
                </span>
              </div>

              <div role="cell" className="flex-1">
                <pre
                  className={cn(
                    "px-2 py-1 font-mono text-[12px] leading-5 whitespace-pre-wrap",
                    isChange && "pl-5",
                  )}
                  aria-label={`${line.kind} line`}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mr-1 inline-block w-2 text-center font-semibold",
                      line.kind === "add" && "text-emerald-600",
                      line.kind === "del" && "text-rose-600",
                    )}
                  >
                    {line.kind === "add"
                      ? "+"
                      : line.kind === "del"
                        ? "-"
                        : " "}
                  </span>
                  {line.content}
                </pre>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
