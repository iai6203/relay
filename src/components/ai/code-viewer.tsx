import type { BundledLanguage } from "shiki";
import { FileIcon } from "lucide-react";

import {
  CodeBlock,
  CodeBlockFilename,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/components/ai-elements/code-block";

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

interface CodeViewerProps {
  filePath: string;
  content: string;
}

export function CodeViewer({ filePath, content }: CodeViewerProps) {
  const language = getLanguageFromPath(filePath);
  const fileName = filePath.split("/").pop() ?? filePath;

  return (
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
  );
}
