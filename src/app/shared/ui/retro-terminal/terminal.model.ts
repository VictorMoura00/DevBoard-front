export type TerminalLineType =
  | 'stdout' | 'stderr' | 'warn' | 'success' | 'muted' | 'system' | 'input';

export interface TerminalOutputLine {
  type: TerminalLineType;
  text: string;
}

export interface TerminalLine extends TerminalOutputLine {
  readonly id: number;
}

export interface TerminalCommand {
  readonly name: string;
  readonly description: string;
  readonly usage?: string;
  run(args: string[]): TerminalOutputLine[] | Promise<TerminalOutputLine[]>;
}
