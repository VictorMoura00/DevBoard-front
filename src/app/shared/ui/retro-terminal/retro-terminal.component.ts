import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { RetroWindowComponent } from '../retro-window/retro-window.component';
import type { TerminalCommand, TerminalLine, TerminalLineType, TerminalOutputLine } from './terminal.model';

let _seq = 0;

@Component({
  selector: 'app-retro-terminal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RetroWindowComponent],
  templateUrl: './retro-terminal.component.html',
  styleUrl: './retro-terminal.component.scss',
})
export class RetroTerminalComponent implements OnInit, AfterViewInit {
  private readonly _cdr = inject(ChangeDetectorRef);

  // ── Inputs ────────────────────────────────────────────────────────────────
  readonly prompt          = input('user@devboard:~$ ');
  readonly greeting        = input<string[]>(['DevBoard Terminal  v0.1.0', "Type 'help' for available commands."]);
  readonly commands        = input<TerminalCommand[]>([]);
  readonly maxLines        = input(500);
  readonly typewriterSpeed = input(16);
  readonly height          = input('400px');
  readonly windowTitle     = input('terminal');
  readonly autofocus       = input(true);

  // ── Outputs ───────────────────────────────────────────────────────────────
  readonly commandRun = output<{ cmd: string; args: string[] }>();

  // ── ViewChildren ──────────────────────────────────────────────────────────
  private readonly _inputEl  = viewChild<ElementRef<HTMLInputElement>>('inputEl');
  private readonly _outputEl = viewChild<ElementRef<HTMLDivElement>>('outputEl');

  // ── Internal state ────────────────────────────────────────────────────────
  protected readonly _lines      = signal<TerminalLine[]>([]);
  protected readonly _inputValue = signal('');
  protected readonly _cursorPos  = signal(0);
  protected readonly _busy       = signal(false);
  protected readonly _focused    = signal(false);

  private readonly _cmdHistory  = signal<string[]>([]);
  private readonly _historyIdx  = signal(-1);
  private _historyDraft         = '';

  // ── Computed ──────────────────────────────────────────────────────────────
  protected readonly _beforeCursor = computed(() =>
    this._inputValue().slice(0, this._cursorPos()),
  );
  protected readonly _cursorChar = computed(() =>
    this._inputValue()[this._cursorPos()] ?? ' ',
  );
  protected readonly _afterCursor = computed(() =>
    this._inputValue().slice(this._cursorPos() + 1),
  );
  protected readonly _windowSubtitle = computed(() =>
    this.prompt().split(':')[0]?.trim() ?? this.prompt(),
  );

  // ── Built-in commands ─────────────────────────────────────────────────────
  private get _all(): TerminalCommand[] {
    return [...this._builtins, ...this.commands()];
  }

  private readonly _builtins: TerminalCommand[] = [
    {
      name: 'help',
      description: 'list all available commands',
      run: () => {
        const cmds = this._all;
        const nameW = Math.max(...cmds.map(c => c.name.length), 4) + 2;
        const usageW = Math.max(...cmds.map(c => (c.usage?.length ?? 0) + 2), 8) + 2;
        return [
          { type: 'muted',   text: '  ' + '─'.repeat(nameW + usageW + 26) },
          { type: 'muted',   text: `  ${'CMD'.padEnd(nameW)}  ${'USAGE'.padEnd(usageW)}  DESCRIPTION` },
          { type: 'muted',   text: '  ' + '─'.repeat(nameW + usageW + 26) },
          ...cmds.map(c => ({
            type: 'stdout' as TerminalLineType,
            text: `  ${c.name.padEnd(nameW)}  ${(c.usage ? `[${c.usage}]` : '').padEnd(usageW)}  ${c.description}`,
          })),
          { type: 'muted', text: '  ' + '─'.repeat(nameW + usageW + 26) },
        ];
      },
    },
    {
      name: 'clear',
      description: 'clear terminal screen',
      run: () => { this._lines.set([]); return []; },
    },
    {
      name: 'cls',
      description: 'alias for clear',
      run: () => { this._lines.set([]); return []; },
    },
    {
      name: 'history',
      description: 'show command history',
      run: () => {
        const h = this._cmdHistory();
        if (!h.length) return [{ type: 'muted', text: '  (no history)' }];
        return h.map((cmd, i) => ({
          type: 'muted' as TerminalLineType,
          text: `  ${String(h.length - i).padStart(4)}  ${cmd}`,
        }));
      },
    },
    {
      name: 'echo',
      description: 'print arguments to output',
      usage: 'text...',
      run: (args) => [{ type: 'stdout', text: args.join(' ') }],
    },
    {
      name: 'whoami',
      description: 'display current user',
      run: () => {
        const user = this.prompt().split('@')[0]?.trim()
          ?? this.prompt().split('$')[0]?.trim()
          ?? 'user';
        return [{ type: 'stdout', text: user }];
      },
    },
    {
      name: 'date',
      description: 'print current date and time',
      run: () => [{ type: 'stdout', text: new Date().toString() }],
    },
  ];

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const greeting = untracked(this.greeting);
    if (greeting.length) {
      for (const text of greeting) {
        this._addLine({ type: 'system', text });
      }
      this._addLine({ type: 'muted', text: '─'.repeat(50) });
    }
  }

  ngAfterViewInit(): void {
    if (untracked(this.autofocus)) {
      queueMicrotask(() => this.focus());
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────
  focus(): void {
    this._inputEl()?.nativeElement.focus();
  }

  print(text: string, type: TerminalLineType = 'stdout'): void {
    this._addLine({ type, text });
    this._cdr.markForCheck();
  }

  clear(): void {
    this._lines.set([]);
    this._cdr.markForCheck();
  }

  // ── Template handlers ─────────────────────────────────────────────────────
  protected onTermClick(): void {
    this.focus();
  }

  protected onInput(event: Event): void {
    if (this._busy()) return;
    const el = event.target as HTMLInputElement;
    this._inputValue.set(el.value);
    this._cursorPos.set(el.selectionStart ?? el.value.length);
    this._historyIdx.set(-1);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this._busy()) { event.preventDefault(); return; }

    const { key, ctrlKey, metaKey } = event;
    const ctrl = ctrlKey || metaKey;
    const val  = this._inputValue();
    const pos  = this._cursorPos();

    if (ctrl) {
      switch (key.toLowerCase()) {
        case 'c': event.preventDefault(); this._cancelInput(val);          return;
        case 'l': event.preventDefault(); this._lines.set([]);             return;
        case 'a': event.preventDefault(); this._moveCursor(0);             return;
        case 'e': event.preventDefault(); this._moveCursor(val.length);    return;
        case 'u': event.preventDefault(); this._setInput(val.slice(pos), 0); return;
        case 'k': event.preventDefault(); this._setInput(val.slice(0, pos)); return;
      }
    }

    switch (key) {
      case 'Enter':     event.preventDefault(); this._execute(val.trim()); break;
      case 'Tab':       event.preventDefault(); this._autocomplete(val);   break;
      case 'ArrowUp':   event.preventDefault(); this._historyPrev();       break;
      case 'ArrowDown': event.preventDefault(); this._historyNext();       break;
      case 'ArrowLeft': event.preventDefault(); this._moveCursor(pos - 1); break;
      case 'ArrowRight':event.preventDefault(); this._moveCursor(pos + 1); break;
      case 'Home':      event.preventDefault(); this._moveCursor(0);       break;
      case 'End':       event.preventDefault(); this._moveCursor(val.length); break;
    }
  }

  // ── Command execution ─────────────────────────────────────────────────────
  private async _execute(raw: string): Promise<void> {
    this._addLine({ type: 'input', text: this.prompt() + raw });
    if (!raw) return;

    this._cmdHistory.update(h => [raw, ...h.filter(x => x !== raw)].slice(0, 100));
    this._historyIdx.set(-1);
    this._historyDraft = '';
    this._setInput('');

    const parts = raw.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];
    const [name, ...args] = parts.map(p => p.replace(/^["']|["']$/g, ''));

    this.commandRun.emit({ cmd: name, args });

    const command = this._all.find(c => c.name === name);
    if (!command) {
      this._addLine({ type: 'stderr', text: `${name}: command not found — type 'help' for a list` });
      return;
    }

    this._busy.set(true);
    try {
      const result = await command.run(args);
      await this._printLines(result);
    } catch (err) {
      this._addLine({
        type: 'stderr',
        text: `${name}: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      this._busy.set(false);
      this._cdr.markForCheck();
      queueMicrotask(() => this.focus());
    }
  }

  private _cancelInput(val: string): void {
    this._addLine({ type: 'muted', text: this.prompt() + val + ' ^C' });
    this._setInput('');
  }

  // ── Autocomplete ──────────────────────────────────────────────────────────
  private _autocomplete(val: string): void {
    if (!val.trim()) return;
    const [partial] = val.split(/\s+/);
    const matches = this._all.filter(c => c.name.startsWith(partial));

    if (!matches.length) return;
    if (matches.length === 1) {
      this._setInput(matches[0].name + ' ');
    } else {
      this._addLine({ type: 'input', text: this.prompt() + val });
      this._addLine({ type: 'muted', text: '  ' + matches.map(m => m.name).join('   ') });
    }
  }

  // ── History navigation ────────────────────────────────────────────────────
  private _historyPrev(): void {
    const h = this._cmdHistory();
    if (!h.length) return;
    const idx = this._historyIdx();
    if (idx === -1) this._historyDraft = this._inputValue();
    const next = Math.min(idx + 1, h.length - 1);
    this._historyIdx.set(next);
    this._setInput(h[next]);
  }

  private _historyNext(): void {
    const idx = this._historyIdx();
    if (idx === -1) return;
    const next = idx - 1;
    this._historyIdx.set(next);
    this._setInput(next === -1 ? this._historyDraft : this._cmdHistory()[next]);
  }

  // ── Output helpers ────────────────────────────────────────────────────────
  private _addLine(partial: TerminalOutputLine): void {
    this._lines.update(lines => {
      const next = [...lines, { ...partial, id: ++_seq }];
      const max  = this.maxLines();
      return next.length > max ? next.slice(-max) : next;
    });
    this._scrollToBottom();
  }

  private async _printLines(lines: TerminalOutputLine[]): Promise<void> {
    const speed = this.typewriterSpeed();
    for (const line of lines) {
      this._addLine(line);
      this._cdr.markForCheck();
      if (speed > 0 && lines.length > 1) {
        await new Promise<void>(r => setTimeout(r, speed));
      }
    }
    this._scrollToBottom();
  }

  // ── Input management ──────────────────────────────────────────────────────
  private _setInput(val: string, cursor?: number): void {
    const pos = cursor ?? val.length;
    this._inputValue.set(val);
    this._cursorPos.set(pos);
    const el = this._inputEl()?.nativeElement;
    if (el) {
      el.value = val;
      queueMicrotask(() => el.setSelectionRange(pos, pos));
    }
  }

  private _moveCursor(rawPos: number): void {
    const pos = Math.max(0, Math.min(this._inputValue().length, rawPos));
    this._cursorPos.set(pos);
    const el = this._inputEl()?.nativeElement;
    if (el) queueMicrotask(() => el.setSelectionRange(pos, pos));
  }

  private _scrollToBottom(): void {
    queueMicrotask(() => {
      const el = this._outputEl()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
