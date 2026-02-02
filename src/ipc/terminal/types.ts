export type TerminalDataEvent = TerminalDataOutput | TerminalDataExit;

export interface TerminalDataOutput {
  type: "data";
  data: string;
}

export interface TerminalDataExit {
  type: "exit";
  exitCode: number | null;
}
