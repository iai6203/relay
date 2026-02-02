import { useCallback, useState } from "react";

import type { CodeSelection } from "@/components/ai/code-viewer";

export function useCodeSelections() {
  const [codeSelections, setCodeSelections] = useState<CodeSelection[]>([]);

  const addSelection = useCallback((selection: CodeSelection) => {
    setCodeSelections((prev) => [...prev, selection]);
  }, []);

  const removeSelection = useCallback((index: number) => {
    setCodeSelections((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const buildPrompt = useCallback(
    (text: string): string => {
      if (codeSelections.length === 0) return text;

      const references = codeSelections
        .map((sel) => {
          const lineInfo =
            sel.startLine === sel.endLine
              ? `${sel.startLine}`
              : `${sel.startLine}-${sel.endLine}`;
          return `- @${sel.filePath}#L${lineInfo}`;
        })
        .join("\n");

      setCodeSelections([]);
      return `${references}\n\n${text}`;
    },
    [codeSelections],
  );

  return {
    codeSelections,
    addSelection,
    removeSelection,
    buildPrompt,
  };
}
