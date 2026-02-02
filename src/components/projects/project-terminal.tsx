import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { TerminalIcon } from "lucide-react";

import "@xterm/xterm/css/xterm.css";

import { ipc } from "@/ipc/manager";

interface ProjectTerminalProps {
  cwd: string;
}

export function ProjectTerminal({ cwd }: ProjectTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const terminalIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const terminal = new Terminal({
      fontFamily: "'Geist Mono Variable', monospace",
      fontSize: 13,
      theme: {
        background: "#ffffff",
        foreground: "#18181b",
        cursor: "#18181b",
        selectionBackground: "#e4e4e7",
        black: "#18181b",
        red: "#dc2626",
        green: "#16a34a",
        yellow: "#ca8a04",
        blue: "#2563eb",
        magenta: "#9333ea",
        cyan: "#0891b2",
        white: "#fafafa",
        brightBlack: "#71717a",
        brightRed: "#ef4444",
        brightGreen: "#22c55e",
        brightYellow: "#eab308",
        brightBlue: "#3b82f6",
        brightMagenta: "#a855f7",
        brightCyan: "#06b6d4",
        brightWhite: "#ffffff",
      },
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(container);
    fitAddon.fit();

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    (async () => {
      const { terminalId } = await ipc.client.terminal.create({ cwd });
      if (abortController.signal.aborted) {
        await ipc.client.terminal.kill({ terminalId });
        return;
      }

      terminalIdRef.current = terminalId;

      await ipc.client.terminal.resize({
        terminalId,
        cols: terminal.cols,
        rows: terminal.rows,
      });

      terminal.onData((data) => {
        ipc.client.terminal.write({ terminalId, data });
      });

      const stream = await ipc.client.terminal.onData({ terminalId });
      for await (const event of stream) {
        if (abortController.signal.aborted) break;
        if (event.type === "data") {
          terminal.write(event.data);
        }
      }
    })();

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
      const id = terminalIdRef.current;
      if (id) {
        ipc.client.terminal.resize({
          terminalId: id,
          cols: terminal.cols,
          rows: terminal.rows,
        });
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      abortController.abort();
      const id = terminalIdRef.current;
      if (id) {
        ipc.client.terminal.kill({ terminalId: id });
      }
      terminal.dispose();
    };
  }, [cwd]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <TerminalIcon className="size-4" />
          Terminal
        </div>
      </div>
      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-hidden py-1 pl-4"
      />
    </div>
  );
}
