import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'highlightCode', standalone: true, pure: true })
export class HighlightCodePipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(code: string, language: string): SafeHtml {
    const html = language ? highlight(code, language) : escapeHtml(code);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}

// ── Utilities ───────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function tok(text: string, cls?: string): string {
  const e = escapeHtml(text);
  return cls ? `<span class="${cls}">${e}</span>` : e;
}

function highlight(code: string, lang: string): string {
  switch (lang.toLowerCase()) {
    case 'json':             return highlightJson(code);
    case 'bash': case 'sh': return highlightBash(code);
    default:                 return highlightTs(code);
  }
}

// ── TypeScript / Angular ────────────────────────────────────────────────────

const TS_KEYWORDS = new Set([
  'const','let','var','function','class','interface','type','enum',
  'extends','implements','import','export','from','as','return',
  'if','else','for','of','in','while','do','switch','case','default',
  'break','continue','new','this','super','async','await','yield',
  'readonly','protected','private','public','static','abstract',
  'declare','namespace','get','set','typeof','instanceof',
  'void','never','throw','try','catch','finally','delete','with',
]);

const TS_TYPES = new Set([
  'string','number','boolean','object','any','unknown','symbol','bigint',
  'Array','Map','Set','Promise','Record','Partial','Required','Readonly',
  'Pick','Omit','Exclude','Extract','NonNullable','ReturnType','InstanceType',
  'HTMLElement','EventEmitter','Observable','Subject','BehaviorSubject',
  'Injectable','Component','Directive','Pipe','NgModule',
]);

const TS_LITERALS = new Set(['true','false','null','undefined']);

function highlightTs(code: string): string {
  const n = code.length;
  let i = 0;
  let out = '';

  while (i < n) {
    // Block comment
    if (code[i] === '/' && code[i + 1] === '*') {
      const end = code.indexOf('*/', i + 2);
      const s = end === -1 ? code.slice(i) : code.slice(i, end + 2);
      out += tok(s, 'tok-comment'); i += s.length; continue;
    }
    // Line comment
    if (code[i] === '/' && code[i + 1] === '/') {
      const eol = code.indexOf('\n', i);
      const s = eol === -1 ? code.slice(i) : code.slice(i, eol);
      out += tok(s, 'tok-comment'); i += s.length; continue;
    }
    // Template literal (treat entire literal as string)
    if (code[i] === '`') {
      let j = i + 1;
      while (j < n && code[j] !== '`') { if (code[j] === '\\') j++; j++; }
      out += tok(code.slice(i, j + 1), 'tok-str'); i = j + 1; continue;
    }
    // Single / double quoted string
    if (code[i] === '"' || code[i] === "'") {
      const q = code[i]; let j = i + 1;
      while (j < n && code[j] !== q && code[j] !== '\n') { if (code[j] === '\\') j++; j++; }
      out += tok(code.slice(i, j + 1), 'tok-str'); i = j + 1; continue;
    }
    // Decorator
    if (code[i] === '@' && i + 1 < n && /[A-Za-z_]/.test(code[i + 1])) {
      let j = i + 1;
      while (j < n && /\w/.test(code[j])) j++;
      out += tok(code.slice(i, j), 'tok-decorator'); i = j; continue;
    }
    // Number (not preceded by word char)
    if (/\d/.test(code[i]) && (i === 0 || !/\w/.test(code[i - 1]))) {
      let j = i;
      while (j < n && /[\d.xXa-fA-F_]/.test(code[j])) j++;
      out += tok(code.slice(i, j), 'tok-num'); i = j; continue;
    }
    // Identifier / keyword / type / literal
    if (/[A-Za-z_$]/.test(code[i])) {
      let j = i;
      while (j < n && /[\w$]/.test(code[j])) j++;
      const word = code.slice(i, j);
      if      (TS_LITERALS.has(word)) out += tok(word, 'tok-bool');
      else if (TS_KEYWORDS.has(word)) out += tok(word, 'tok-kw');
      else if (TS_TYPES.has(word))    out += tok(word, 'tok-type');
      else                            out += escapeHtml(word);
      i = j; continue;
    }
    out += escapeHtml(code[i]); i++;
  }
  return out;
}

// ── JSON ────────────────────────────────────────────────────────────────────

function highlightJson(code: string): string {
  const n = code.length;
  let i = 0;
  let out = '';

  while (i < n) {
    if (code[i] === '"') {
      let j = i + 1;
      while (j < n && code[j] !== '"') { if (code[j] === '\\') j++; j++; }
      const str = code.slice(i, j + 1);
      let k = j + 1;
      while (k < n && (code[k] === ' ' || code[k] === '\t')) k++;
      out += tok(str, code[k] === ':' ? 'tok-key' : 'tok-str');
      i = j + 1; continue;
    }
    const litMatch = code.slice(i).match(/^(true|false|null)/);
    if (litMatch) { out += tok(litMatch[0], 'tok-bool'); i += litMatch[0].length; continue; }
    const numMatch = code.slice(i).match(/^-?\d+(\.\d+)?([eE][+\-]?\d+)?/);
    if (numMatch && numMatch[0]) { out += tok(numMatch[0], 'tok-num'); i += numMatch[0].length; continue; }
    out += escapeHtml(code[i]); i++;
  }
  return out;
}

// ── Bash ────────────────────────────────────────────────────────────────────

const BASH_KEYWORDS = new Set([
  'if','then','else','elif','fi','for','in','do','done','while','until',
  'case','esac','function','return','export','local','echo','source','exit',
  'cd','ls','mkdir','rm','cp','mv','cat','grep','sed','awk','chmod','sudo',
]);

function highlightBash(code: string): string {
  const n = code.length;
  let i = 0;
  let out = '';

  while (i < n) {
    if (code[i] === '#') {
      const eol = code.indexOf('\n', i);
      const s = eol === -1 ? code.slice(i) : code.slice(i, eol);
      out += tok(s, 'tok-comment'); i += s.length; continue;
    }
    if (code[i] === '"') {
      let j = i + 1;
      while (j < n && code[j] !== '"') { if (code[j] === '\\') j++; j++; }
      out += tok(code.slice(i, j + 1), 'tok-str'); i = j + 1; continue;
    }
    if (code[i] === "'") {
      let j = i + 1;
      while (j < n && code[j] !== "'") j++;
      out += tok(code.slice(i, j + 1), 'tok-str'); i = j + 1; continue;
    }
    if (code[i] === '$') {
      if (code[i + 1] === '{') {
        const end = code.indexOf('}', i);
        const s = end === -1 ? code.slice(i) : code.slice(i, end + 1);
        out += tok(s, 'tok-decorator'); i += s.length;
      } else {
        let j = i + 1;
        while (j < n && /\w/.test(code[j])) j++;
        out += tok(code.slice(i, j), 'tok-decorator'); i = j;
      }
      continue;
    }
    if (/[A-Za-z_]/.test(code[i])) {
      let j = i;
      while (j < n && /[\w\-]/.test(code[j])) j++;
      const word = code.slice(i, j);
      out += tok(word, BASH_KEYWORDS.has(word) ? 'tok-kw' : undefined);
      i = j; continue;
    }
    out += escapeHtml(code[i]); i++;
  }
  return out;
}
