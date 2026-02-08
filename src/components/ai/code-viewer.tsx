import type { BundledLanguage } from "shiki";
import { FileIcon, SparklesIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import {
  CodeBlock,
  CodeBlockFilename,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/components/ai-elements/code-block";
import { Button } from "@/components/ui/button";

const EXT_TO_LANGUAGE: Record<string, BundledLanguage> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  md: "markdown",
  mdx: "mdx",
  css: "css",
  scss: "scss",
  html: "html",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",
  py: "python",
  rs: "rust",
  go: "go",
  java: "java",
  kt: "kotlin",
  swift: "swift",
  rb: "ruby",
  php: "php",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  sql: "sql",
  graphql: "graphql",
  vue: "vue",
  svelte: "svelte",
  dockerfile: "dockerfile",
  prisma: "prisma",
};

function getLanguageFromPath(filePath: string): BundledLanguage {
  const fileName = filePath.split("/").pop() ?? "";
  const lower = fileName.toLowerCase();

  if (lower === "dockerfile") return "dockerfile";
  if (lower === "makefile") return "makefile";

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_LANGUAGE[ext] ?? "text";
}

export interface CodeSelection {
  filePath: string;
  startLine: number;
  endLine: number;
  selectedText: string;
}

interface PendingSelection extends CodeSelection {
  top: number;
  left: number;
}

interface CodeViewerProps {
  filePath: string;
  content: string;
  onSelectionChange?: (selection: CodeSelection | null) => void;
}

export function CodeViewer({
  filePath,
  content,
  onSelectionChange,
}: CodeViewerProps) {
  const language = getLanguageFromPath(filePath);
  const fileName = filePath.split("/").pop() ?? filePath;
  const containerRef = useRef<HTMLDivElement>(null);
  const [pendingSelection, setPendingSelection] =
    useState<PendingSelection | null>(null);

  const handleMouseUp = useCallback(() => {
    if (!onSelectionChange) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      setPendingSelection(null);
      return;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText) {
      setPendingSelection(null);
      return;
    }

    // Find the line numbers from the selection
    const range = selection.getRangeAt(0);
    const container = containerRef.current;
    if (!container || !container.contains(range.commonAncestorContainer)) {
      return;
    }

    // Get all line spans (they have CSS counter for line numbers)
    const codeElement = container.querySelector("code");
    if (!codeElement) return;

    const lineSpans = Array.from(codeElement.children) as HTMLElement[];
    let startLine = 1;
    let endLine = 1;

    for (let i = 0; i < lineSpans.length; i++) {
      const span = lineSpans[i];
      if (
        span.contains(range.startContainer) ||
        span === range.startContainer
      ) {
        startLine = i + 1;
      }
      if (span.contains(range.endContainer) || span === range.endContainer) {
        endLine = i + 1;
        break;
      }
    }

    // Calculate position for floating button (use first rect for start point)
    const startRect = range.getClientRects()[0];
    if (!startRect) return;
    const containerRect = container.getBoundingClientRect();

    setPendingSelection({
      filePath,
      startLine,
      endLine,
      selectedText,
      top: startRect.top - containerRect.top - 32,
      left: startRect.left - containerRect.left,
    });
  }, [filePath, onSelectionChange]);

  const handleConfirm = useCallback(() => {
    if (pendingSelection && onSelectionChange) {
      onSelectionChange(pendingSelection);
      setPendingSelection(null);
      window.getSelection()?.removeAllRanges();
    }
  }, [pendingSelection, onSelectionChange]);

  return (
    <div
      ref={containerRef}
      onMouseUp={handleMouseUp}
      className="relative h-full"
    >
      <CodeBlock
        code={content}
        language={language}
        showLineNumbers
        className="flex h-full flex-col rounded-none border-0"
      >
        <CodeBlockHeader>
          <CodeBlockTitle>
            <FileIcon size={14} />
            <CodeBlockFilename>{fileName}</CodeBlockFilename>
            <span className="text-muted-foreground/60">{filePath}</span>
          </CodeBlockTitle>
        </CodeBlockHeader>
      </CodeBlock>

      {/* Floating confirmation button */}
      {pendingSelection && (
        <div
          className="absolute z-50"
          style={{
            top: pendingSelection.top,
            left: pendingSelection.left,
          }}
        >
          <Button
            size="sm"
            variant="default"
            className="hover:bg-primary"
            onClick={handleConfirm}
          >
            <SparklesIcon size={12} />
            <span>
              {pendingSelection.startLine === pendingSelection.endLine
                ? `Line ${pendingSelection.startLine}`
                : `Lines ${pendingSelection.startLine}-${pendingSelection.endLine}`}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
