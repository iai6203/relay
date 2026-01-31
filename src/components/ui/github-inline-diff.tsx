"use client";

import { useMemo, useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/tailwind";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { MessageSquarePlus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, X } from "lucide-react";

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

type Line =
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

  // Tracks which line index currently has an open thread
  const [openThreadAt, setOpenThreadAt] = useState<number | null>(null);
  // Tracks thread status per line
  const [resolvedMap, setResolvedMap] = useState<Record<number, boolean>>({});

  function toggleResolve(idx: number) {
    setResolvedMap((m) => ({ ...m, [idx]: !m[idx] }));
  }

  return (
    <TooltipProvider delayDuration={150}>
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
            const isOpen = openThreadAt === idx;
            const isResolved = !!resolvedMap[idx];

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
                <div className="absolute top-1/2 -left-4 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  {line.kind !== "hunk" && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="secondary"
                          aria-label="Add inline comment"
                          className="h-5 w-5 rounded-full shadow-sm"
                          onClick={() => setOpenThreadAt(isOpen ? null : idx)}
                        >
                          <MessageSquarePlus className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">Add comment</TooltipContent>
                    </Tooltip>
                  )}
                </div>

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

                  {openThreadAt === idx && line.kind !== "hunk" && (
                    <div className="bg-background border-t px-2 py-1.5 dark:border-white/10">
                      <InlineThread
                        resolved={isResolved}
                        onToggleResolve={() => toggleResolve(idx)}
                        onClose={() => setOpenThreadAt(null)}
                      />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </TooltipProvider>
  );
}

type Comment = {
  id: string;
  author: string;
  initials: string;
  body: string;
  createdAt: string;
};

export function InlineThread({
  resolved,
  onToggleResolve,
  onClose,
}: {
  resolved: boolean;
  onToggleResolve: () => void;
  onClose: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "c1",
      author: "Reviewer",
      initials: "RV",
      body: "Consider handling the undefined case explicitly.",
      createdAt: "just now",
    },
  ]);
  const [draft, setDraft] = useState("");
  const textRef = useRef<HTMLTextAreaElement | null>(null);

  function addComment() {
    const text = draft.trim();
    if (!text) return;
    setComments((c) => [
      ...c,
      {
        id: crypto.randomUUID(),
        author: "You",
        initials: "YO",
        body: text,
        createdAt: "now",
      },
    ]);
    setDraft("");
    // focus back for fast sequences
    requestAnimationFrame(() => textRef.current?.focus());
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="bg-card rounded-md border dark:border-white/10">
      {/* Header with status chip */}
      <div className="flex items-center justify-between gap-2 px-2 py-1">
        <div className="flex items-center gap-2">
          <Badge
            className={cn(
              "h-5 gap-1 px-1.5 text-[11px]",
              resolved
                ? "bg-emerald-600 text-white hover:bg-emerald-600/90 dark:bg-emerald-500 dark:hover:bg-emerald-500/90"
                : "bg-secondary text-foreground dark:bg-neutral-800 dark:text-neutral-100",
            )}
          >
            {resolved ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
            {resolved ? "Resolved" : "Open"}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant={resolved ? "secondary" : "default"}
            size="sm"
            onClick={onToggleResolve}
            aria-pressed={resolved}
            className="h-7 px-2 text-[12px]"
          >
            {resolved ? "Reopen" : "Resolve"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close thread"
            onClick={onClose}
            className="h-7 w-7"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Comments list */}
      <ul className="space-y-1 px-2 py-1.5">
        {comments.map((c) => (
          <li key={c.id} className="flex items-start gap-2">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[9px]">
                {c.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[12px] font-medium">{c.author}</p>
                <span className="text-muted-foreground ml-2 shrink-0 text-[10px]">
                  {c.createdAt}
                </span>
              </div>
              <p className="mt-0.5 text-[13px] leading-5">{c.body}</p>
            </div>
          </li>
        ))}
      </ul>

      <Separator />

      {/* Editor */}
      <div className="flex flex-col gap-2 px-2 py-1.5">
        <label htmlFor="inline-comment" className="sr-only">
          Add a comment
        </label>
        <Textarea
          id="inline-comment"
          ref={textRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Comment"
          rows={2}
          className="min-h-[40px] py-1.5 text-[13px]"
        />
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 px-2 text-[12px]"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={addComment}
            disabled={!draft.trim()}
            className="h-7 px-2 text-[12px]"
          >
            Comment
          </Button>
        </div>
      </div>
    </div>
  );
}

