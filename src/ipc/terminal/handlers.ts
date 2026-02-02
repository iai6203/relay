import { os as orpc, eventIterator } from "@orpc/server";
import { type IPty, spawn } from "node-pty";
import { nanoid } from "nanoid";

import {
  createTerminalInputSchema,
  createTerminalOutputSchema,
  terminalIdInputSchema,
  writeTerminalInputSchema,
  resizeTerminalInputSchema,
  terminalDataEventSchema,
} from "./schemas";
import type { TerminalDataEvent } from "./types";

const terminals = new Map<string, IPty>();

function getDefaultShell(): string {
  if (process.platform === "win32") {
    return "powershell.exe";
  }
  return process.env.SHELL || "/bin/zsh";
}

export const create = orpc
  .input(createTerminalInputSchema)
  .output(createTerminalOutputSchema)
  .handler(({ input }) => {
    const terminalId = nanoid();
    const shell = input.shell || getDefaultShell();

    const pty = spawn(shell, [], {
      name: "xterm-256color",
      cols: 80,
      rows: 24,
      cwd: input.cwd,
      env: {
        ...process.env,
        TERM: "xterm-256color",
        COLORTERM: "truecolor",
      } as Record<string, string>,
      useConpty: process.platform === "win32",
    });

    terminals.set(terminalId, pty);

    pty.onExit(() => {
      terminals.delete(terminalId);
    });

    return { terminalId };
  });

export const write = orpc
  .input(writeTerminalInputSchema)
  .handler(({ input }) => {
    const pty = terminals.get(input.terminalId);
    if (!pty) {
      throw new Error(`Terminal not found: ${input.terminalId}`);
    }
    pty.write(input.data);
  });

export const resize = orpc
  .input(resizeTerminalInputSchema)
  .handler(({ input }) => {
    const pty = terminals.get(input.terminalId);
    if (!pty) {
      throw new Error(`Terminal not found: ${input.terminalId}`);
    }
    pty.resize(input.cols, input.rows);
  });

export const kill = orpc.input(terminalIdInputSchema).handler(({ input }) => {
  const pty = terminals.get(input.terminalId);
  if (!pty) {
    return;
  }
  pty.kill();
  terminals.delete(input.terminalId);
});

export const onData = orpc
  .input(terminalIdInputSchema)
  .output(eventIterator(terminalDataEventSchema))
  .handler(async function* ({ input, signal }) {
    const pty = terminals.get(input.terminalId);
    if (!pty) {
      throw new Error(`Terminal not found: ${input.terminalId}`);
    }

    const eventQueue: TerminalDataEvent[] = [];
    let resolveWaiting: (() => void) | null = null;
    let done = false;

    function enqueue(event: TerminalDataEvent) {
      eventQueue.push(event);
      if (resolveWaiting) {
        const r = resolveWaiting;
        resolveWaiting = null;
        r();
      }
    }

    const dataDisposable = pty.onData((data) => {
      enqueue({ type: "data", data });
    });

    const exitDisposable = pty.onExit(({ exitCode }) => {
      enqueue({ type: "exit", exitCode: exitCode ?? null });
      done = true;
      resolveWaiting?.();
    });

    signal?.addEventListener(
      "abort",
      () => {
        done = true;
        resolveWaiting?.();
      },
      { once: true },
    );

    try {
      while (!done || eventQueue.length > 0) {
        if (eventQueue.length > 0) {
          yield eventQueue.shift()!;
        } else {
          await new Promise<void>((resolve) => {
            resolveWaiting = resolve;
          });
        }
      }
    } finally {
      dataDisposable.dispose();
      exitDisposable.dispose();
    }
  });
