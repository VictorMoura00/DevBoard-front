import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { APP_THEMES, ThemeName } from '../../core/theme/theme.model';
import { ThemeService } from '../../core/theme/theme.service';
import {
  AsciiBarComponent,
  RetroButtonComponent,
  RetroCheckboxComponent,
  RetroCodeComponent,
  RetroCollapsibleComponent,
  RetroInputComponent,
  RetroKbdComponent,
  RetroModalComponent,
  RetroProgressComponent,
  RetroTagComponent,
  RetroToastComponent,
  RetroWindowComponent,
  StatBoxComponent,
  StatusDotComponent,
  StatusPillComponent,
  ToastService,
} from '../../shared/ui';
import { StatBoxTone, StatBoxTrend } from '../../shared/ui/stat-box/stat-box.component';
import { StatusPillSize } from '../../shared/ui/status-pill/status-pill.component';
import { RetroInputType } from '../../shared/ui/retro-input/retro-input.component';
import { StatusDotSize } from '../../shared/ui/status-dot/status-dot.component';
import { TagVariant } from '../../shared/ui/retro-tag/retro-tag.component';
import { ProgressTone } from '../../shared/ui/retro-progress/retro-progress.component';
import { ToastPosition } from '../../shared/ui/retro-toast/toast.model';

type StoryId =
  | 'win' | 'button' | 'input' | 'checkbox' | 'kbd'
  | 'pill' | 'dot' | 'tag' | 'stat'
  | 'progress' | 'ascii' | 'toast'
  | 'modal' | 'collapsible' | 'code';
type StoryTab = 'preview' | 'code';

interface StoryItem  { id: StoryId; label: string; }
interface StoryGroup { group: string; items: StoryItem[]; }

@Component({
  selector: 'app-ui-library-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    AsciiBarComponent,
    RetroButtonComponent,
    RetroCheckboxComponent,
    RetroCodeComponent,
    RetroCollapsibleComponent,
    RetroInputComponent,
    RetroKbdComponent,
    RetroModalComponent,
    RetroProgressComponent,
    RetroTagComponent,
    RetroToastComponent,
    RetroWindowComponent,
    StatBoxComponent,
    StatusDotComponent,
    StatusPillComponent,
  ],
  templateUrl: './ui-library-page.component.html',
  styleUrl: './ui-library-page.component.scss',
})
export class UiLibraryPageComponent implements OnInit {
  private readonly themeService = inject(ThemeService);
  protected readonly toastService  = inject(ToastService);

  protected readonly themes       = APP_THEMES;
  protected readonly currentTheme = this.themeService.currentTheme;

  protected readonly storyGroups: StoryGroup[] = [
    {
      group: 'primitives',
      items: [
        { id: 'win',      label: 'Win (window frame)' },
        { id: 'button',   label: 'Button' },
        { id: 'input',    label: 'Input' },
        { id: 'checkbox', label: 'Checkbox' },
        { id: 'kbd',      label: 'Kbd' },
      ],
    },
    {
      group: 'indicators',
      items: [
        { id: 'pill', label: 'Status Pill' },
        { id: 'dot',  label: 'Status Dot' },
        { id: 'tag',  label: 'Tag' },
        { id: 'stat', label: 'Stat Box' },
      ],
    },
    {
      group: 'feedback',
      items: [
        { id: 'progress', label: 'Progress' },
        { id: 'ascii',    label: 'Ascii Bar' },
        { id: 'toast',    label: 'Toast' },
      ],
    },
    {
      group: 'overlays',
      items: [
        { id: 'modal',       label: 'Modal' },
        { id: 'collapsible', label: 'Collapsible' },
        { id: 'code',        label: 'Code Block' },
      ],
    },
  ];

  protected readonly activeStory = signal<StoryId>('button');
  protected readonly activeTab   = signal<StoryTab>('preview');

  protected readonly activeStoryTitle = computed(() => {
    const map: Record<StoryId, string> = {
      win:        'retro-window.component.ts',
      button:     'retro-button.component.ts',
      input:      'retro-input.component.ts',
      checkbox:   'retro-checkbox.component.ts',
      kbd:        'retro-kbd.component.ts',
      pill:       'status-pill.component.ts',
      dot:        'status-dot.component.ts',
      tag:        'retro-tag.component.ts',
      stat:       'stat-box.component.ts',
      progress:   'retro-progress.component.ts',
      ascii:      'ascii-bar.component.ts',
      toast:      'retro-toast.component.ts',
      modal:      'retro-modal.component.ts',
      collapsible:'retro-collapsible.component.ts',
      code:       'retro-code.component.ts',
    };
    return map[this.activeStory()];
  });

  // ── Win ─────────────────────────────────────────────────────────────────

  protected readonly winTitle        = signal('~/devboard/example');
  protected readonly winSubtitle     = signal('window.frame');
  protected readonly winShowControls = signal(false);
  protected readonly winScrollable   = signal(false);
  protected readonly winCode = computed(() =>
    [
      `<app-retro-window`,
      `  title="${this.winTitle()}"`,
      this.winSubtitle()     ? `  subtitle="${this.winSubtitle()}"` : null,
      this.winShowControls() ? `  [showControls]="true"` : null,
      this.winScrollable()   ? `  [scrollable]="true"` : null,
      `>`,
      `  <!-- content -->`,
      `</app-retro-window>`,
    ].filter((l) => l !== null).join('\n'),
  );

  // ── Button ──────────────────────────────────────────────────────────────

  protected readonly btnLabel     = signal('+ new project');
  protected readonly btnVariant   = signal<'primary' | 'secondary' | 'ghost'>('primary');
  protected readonly btnSize      = signal<'sm' | 'md'>('md');
  protected readonly btnDisabled  = signal(false);
  protected readonly btnLoading   = signal(false);
  protected readonly btnFullWidth = signal(false);
  protected readonly btnClicks    = signal(0);
  protected readonly btnCode = computed(() =>
    [
      `<app-retro-button`,
      `  variant="${this.btnVariant()}"`,
      `  size="${this.btnSize()}"`,
      this.btnDisabled()  ? `  [disabled]="true"` : null,
      this.btnLoading()   ? `  [loading]="true"` : null,
      this.btnFullWidth() ? `  [fullWidth]="true"` : null,
      `  (pressed)="onClick()">`,
      `  ${this.btnLabel()}`,
      `</app-retro-button>`,
    ].filter((l) => l !== null).join('\n'),
  );

  // ── Input ────────────────────────────────────────────────────────────────

  protected readonly inputValue        = signal('');
  protected readonly inputPlaceholder  = signal('grep projects…');
  protected readonly inputType         = signal<RetroInputType>('text');
  protected readonly inputPrefix       = signal('$');
  protected readonly inputSuffix       = signal('');
  protected readonly inputDisabled     = signal(false);
  protected readonly inputInvalid      = signal(false);
  protected readonly inputErrorMessage = signal('campo obrigatorio');
  protected readonly inputClearable    = signal(true);
  protected readonly inputTypes: RetroInputType[] = ['text', 'search', 'number', 'email', 'password'];
  protected readonly inputCode = computed(() =>
    [
      `<app-retro-input`,
      `  type="${this.inputType()}"`,
      this.inputPrefix() ? `  prefix="${this.inputPrefix()}"` : null,
      this.inputSuffix() ? `  suffix="${this.inputSuffix()}"` : null,
      `  placeholder="${this.inputPlaceholder()}"`,
      `  [value]="value"`,
      this.inputClearable() ? `  [clearable]="true"` : null,
      this.inputInvalid()   ? `  [invalid]="true"` : null,
      this.inputInvalid() && this.inputErrorMessage()
        ? `  errorMessage="${this.inputErrorMessage()}"` : null,
      this.inputDisabled() ? `  [disabled]="true"` : null,
      `  (valueChange)="value = $event"`,
      `/>`,
    ].filter((l) => l !== null).join('\n'),
  );

  // ── Checkbox ─────────────────────────────────────────────────────────────

  protected readonly checkboxChecked       = signal(false);
  protected readonly checkboxLabel         = signal('enable feature flag');
  protected readonly checkboxDisabled      = signal(false);
  protected readonly checkboxIndeterminate = signal(false);
  protected readonly checkboxCode = computed(() =>
    [
      `<app-retro-checkbox`,
      this.checkboxLabel()         ? `  label="${this.checkboxLabel()}"` : null,
      `  [checked]="checked"`,
      this.checkboxDisabled()      ? `  [disabled]="true"` : null,
      this.checkboxIndeterminate() ? `  [indeterminate]="true"` : null,
      `  (checkedChange)="checked = $event"`,
      `/>`,
    ].filter((l) => l !== null).join('\n'),
  );

  // ── Kbd ──────────────────────────────────────────────────────────────────

  protected readonly kbdComboMode = signal(false);
  protected readonly kbdSingleKey = signal('Esc');
  protected readonly kbdComboKeys = signal(['⌘', 'K']);
  protected readonly kbdComboInput = signal('⌘, K');
  protected readonly kbdCode = computed(() =>
    this.kbdComboMode()
      ? `<app-retro-kbd [keys]="['${this.kbdComboKeys().join("', '")}']" />`
      : `<app-retro-kbd>${this.kbdSingleKey()}</app-retro-kbd>`,
  );

  protected updateKbdCombo(raw: string): void {
    this.kbdComboInput.set(raw);
    this.kbdComboKeys.set(raw.split(',').map((k) => k.trim()).filter(Boolean));
  }

  // ── Pill ─────────────────────────────────────────────────────────────────

  protected readonly pillStatus   = signal('active');
  protected readonly pillSize     = signal<StatusPillSize>('sm');
  protected readonly pillStatuses = ['active', 'paused', 'completed', 'archived'] as const;
  protected readonly pillSizes: StatusPillSize[] = ['sm', 'md'];
  protected readonly pillCode = computed(
    () => `<app-status-pill\n  status="${this.pillStatus()}"\n  size="${this.pillSize()}" />`,
  );

  // ── Dot ──────────────────────────────────────────────────────────────────

  protected readonly dotStatus   = signal('active');
  protected readonly dotSize     = signal<StatusDotSize>('sm');
  protected readonly dotPulse    = signal(false);
  protected readonly dotStatuses = ['active', 'paused', 'completed', 'archived', 'error', 'default'] as const;
  protected readonly dotSizes: StatusDotSize[] = ['xs', 'sm', 'md'];
  protected readonly dotCode = computed(() =>
    [
      `<app-status-dot`,
      `  status="${this.dotStatus()}"`,
      `  size="${this.dotSize()}"`,
      this.dotPulse() ? `  [pulse]="true"` : null,
      `/>`,
    ].filter((l) => l !== null).join('\n'),
  );

  // ── Tag ──────────────────────────────────────────────────────────────────

  protected readonly tagLabel     = signal('angular');
  protected readonly tagVariant   = signal<TagVariant>('default');
  protected readonly tagRemovable = signal(false);
  protected readonly tagDisabled  = signal(false);
  protected readonly tagVariants: TagVariant[] = ['default', 'primary', 'success', 'warning', 'danger'];
  protected readonly tagCode = computed(() =>
    [
      `<app-retro-tag`,
      `  label="${this.tagLabel()}"`,
      this.tagVariant() !== 'default' ? `  variant="${this.tagVariant()}"` : null,
      this.tagRemovable() ? `  [removable]="true"` : null,
      this.tagDisabled()  ? `  [disabled]="true"` : null,
      `  (removed)="onRemove()"`,
      `/>`,
    ].filter((l) => l !== null).join('\n'),
  );

  // ── Stat ─────────────────────────────────────────────────────────────────

  protected readonly statLabel    = signal('Projects');
  protected readonly statValue    = signal<string | number>(6);
  protected readonly statSublabel = signal('4 active');
  protected readonly statTone     = signal<StatBoxTone>('default');
  protected readonly statTrend    = signal<StatBoxTrend | undefined>(undefined);
  protected readonly statTones: StatBoxTone[] = ['default', 'success', 'warning', 'danger'];
  protected readonly statTrends: Array<StatBoxTrend | 'none'> = ['none', 'up', 'down', 'neutral'];
  protected readonly statCode = computed(() =>
    [
      `<app-stat-box`,
      `  label="${this.statLabel()}"`,
      `  value="${this.statValue()}"`,
      this.statSublabel()         ? `  sublabel="${this.statSublabel()}"` : null,
      this.statTone() !== 'default' ? `  tone="${this.statTone()}"` : null,
      this.statTrend()            ? `  trend="${this.statTrend()}"` : null,
      `/>`,
    ].filter((l) => l !== null).join('\n'),
  );

  // ── Progress ─────────────────────────────────────────────────────────────

  protected readonly progressValue    = signal(65);
  protected readonly progressTone     = signal<ProgressTone>('default');
  protected readonly progressLabel    = signal('loading assets');
  protected readonly progressShowVal  = signal(true);
  protected readonly progressAnimated = signal(false);
  protected readonly progressTones: ProgressTone[] = ['default', 'success', 'warning', 'danger'];
  protected readonly progressCode = computed(() =>
    [
      `<app-retro-progress`,
      `  [value]="${this.progressValue()}"`,
      this.progressTone() !== 'default' ? `  tone="${this.progressTone()}"` : null,
      this.progressLabel()    ? `  label="${this.progressLabel()}"` : null,
      this.progressShowVal()  ? `  [showValue]="true"` : null,
      this.progressAnimated() ? `  [animated]="true"` : null,
      `/>`,
    ].filter((l) => l !== null).join('\n'),
  );

  // ── Ascii Bar ─────────────────────────────────────────────────────────────

  protected readonly asciiValue      = signal(42);
  protected readonly asciiWidth      = signal(20);
  protected readonly asciiFilledChar = signal('█');
  protected readonly asciiEmptyChar  = signal('░');
  protected readonly asciiShowValue  = signal(true);
  protected readonly asciiCode = computed(() =>
    [
      `<app-ascii-bar`,
      `  [value]="${this.asciiValue()}"`,
      this.asciiWidth() !== 20       ? `  [width]="${this.asciiWidth()}"` : null,
      this.asciiFilledChar() !== '█' ? `  filledChar="${this.asciiFilledChar()}"` : null,
      this.asciiEmptyChar()  !== '░' ? `  emptyChar="${this.asciiEmptyChar()}"` : null,
      !this.asciiShowValue()         ? `  [showValue]="false"` : null,
      `/>`,
    ].filter((l) => l !== null).join('\n'),
  );

  // ── Toast ────────────────────────────────────────────────────────────────

  protected readonly toastMessage     = signal('TaskSyncFailed');
  protected readonly toastType        = signal<'event' | 'success' | 'warning' | 'error'>('event');
  protected readonly toastWithDetails = signal(true);
  protected readonly toastAutoDismiss = signal(false);
  protected readonly toastPosition    = signal<ToastPosition>('bottom-right');
  protected readonly toastMaxVisible  = signal(5);
  protected readonly toastTypes       = ['event', 'success', 'warning', 'error'] as const;
  protected readonly toastPositions: ToastPosition[] = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];

  protected readonly toastDetailCode        = signal('ERR_503');
  protected readonly toastDetailService     = signal('notifications-api');
  protected readonly toastDetailHttp        = signal('503 Service Unavailable');
  protected readonly toastDetailTrace       = signal('trace_d41ab2');
  protected readonly toastDetailStack       = signal(
    `System.Net.Http.HttpRequestException: Connection refused\nat webhook.PostAsync(uri)\nat NotificationsConsumer.Handle(TaskCompleted)\nat MassTransit.Consumer.Dispatch()`,
  );
  protected readonly toastDetailActionLabel = signal('OPEN IN JAEGER →');
  protected readonly toastDetailActionUrl   = signal('#');

  protected readonly toastCode = computed(() =>
    [
      `<app-retro-toast`,
      this.toastPosition() !== 'bottom-right' ? `  position="${this.toastPosition()}"` : null,
      this.toastMaxVisible() !== 5 ? `  [maxVisible]="${this.toastMaxVisible()}"` : null,
      `/>`,
      ``,
      `// inject the service anywhere in your component`,
      `protected readonly toast = inject(ToastService);`,
      ``,
      `this.toast.${this.toastType()}('${this.toastMessage()}');`,
      this.toastWithDetails() ? `` : null,
      this.toastWithDetails() ? `// with structured details (expands inline)` : null,
      this.toastWithDetails() ? `this.toast.error('${this.toastMessage()}', {` : null,
      this.toastWithDetails() && this.toastDetailCode()    ? `  code: '${this.toastDetailCode()}',` : null,
      this.toastWithDetails() && this.toastDetailService() ? `  service: '${this.toastDetailService()}',` : null,
      this.toastWithDetails() && this.toastDetailHttp()    ? `  http: '${this.toastDetailHttp()}',` : null,
      this.toastWithDetails() && this.toastDetailTrace()   ? `  trace: '${this.toastDetailTrace()}',` : null,
      this.toastWithDetails() && this.toastDetailStack()   ? `  stack: \`...\`,` : null,
      this.toastWithDetails() && this.toastDetailActionLabel() ? `  action: { label: '${this.toastDetailActionLabel()}', url: '${this.toastDetailActionUrl()}' },` : null,
      this.toastWithDetails() ? `});` : null,
    ].filter((l) => l !== null).join('\n'),
  );

  protected fireToast(): void {
    const duration = this.toastAutoDismiss() ? 4200 : 0;
    const details  = this.toastWithDetails() ? {
      code:    this.toastDetailCode()    || undefined,
      service: this.toastDetailService() || undefined,
      http:    this.toastDetailHttp()    || undefined,
      trace:   this.toastDetailTrace()   || undefined,
      stack:   this.toastDetailStack()   || undefined,
      action:  this.toastDetailActionLabel()
        ? { label: this.toastDetailActionLabel(), url: this.toastDetailActionUrl() }
        : undefined,
    } : undefined;
    this.toastService.show(this.toastMessage(), this.toastType(), duration, details);
  }

  // ── Modal ────────────────────────────────────────────────────────────────

  protected readonly modalOpen            = signal(false);
  protected readonly modalTitle           = signal('new-project.form');
  protected readonly modalSubtitle        = signal('component.preview');
  protected readonly modalSize            = signal<'sm' | 'md' | 'lg'>('md');
  protected readonly modalSizes           = ['sm', 'md', 'lg'] as const;
  protected readonly modalCloseOnBackdrop = signal(true);
  protected readonly modalShowCloseButton = signal(true);
  protected readonly modalCode = computed(() =>
    [
      `<app-retro-modal`,
      `  [open]="isOpen"`,
      `  title="${this.modalTitle()}"`,
      this.modalSubtitle() ? `  subtitle="${this.modalSubtitle()}"` : null,
      `  size="${this.modalSize()}"`,
      `  [closeOnBackdrop]="${this.modalCloseOnBackdrop()}"`,
      `  [showCloseButton]="${this.modalShowCloseButton()}"`,
      `  (closed)="close()">`,
      `  <!-- [modal-body] / [modal-actions] -->`,
      `</app-retro-modal>`,
    ].filter((l) => l !== null).join('\n'),
  );

  // ── Collapsible ───────────────────────────────────────────────────────────

  protected readonly collapsibleTitle            = signal('section.details');
  protected readonly collapsibleInitialCollapsed = signal(false);
  protected readonly collapsibleCode = computed(() =>
    [
      `<app-retro-collapsible`,
      `  title="${this.collapsibleTitle()}"`,
      this.collapsibleInitialCollapsed() ? `  [initialCollapsed]="true"` : null,
      `>`,
      `  <!-- content -->`,
      `</app-retro-collapsible>`,
    ].filter((l) => l !== null).join('\n'),
  );

  // ── Code Block ────────────────────────────────────────────────────────────

  protected readonly codeLanguage  = signal('typescript');
  protected readonly codeFramed    = signal(true);
  protected readonly codeLanguages = ['typescript', 'angular', 'bash', 'json', ''] as const;
  protected readonly codeExamples: Record<string, string> = {
    typescript: `@Component({
  standalone: true,
  imports: [RetroCodeComponent],
  template: \`
    <app-retro-code
      [code]="snippet"
      language="typescript"
    />
  \`,
})
export class MyPage {
  readonly snippet = 'const x = 42;';
}`,
    angular: `<app-retro-window title="~/my-feature">
  <app-retro-input
    prefix="$"
    placeholder="grep..."
    [clearable]="true"
    (valueChange)="onSearch($event)"
  />
  <app-retro-button
    variant="primary"
    [loading]="saving()"
    (pressed)="save()">
    save
  </app-retro-button>
</app-retro-window>`,
    bash: `$ ng generate component shared/ui/my-component \\
    --standalone \\
    --change-detection OnPush

CREATE src/app/shared/ui/my-component/...
✔  BUILD SUCCESS`,
    json: `{
  "name": "devboard-ui",
  "version": "0.1.0",
  "components": [
    "RetroButton",
    "RetroInput",
    "RetroCode"
  ]
}`,
    '': `// sem linguagem definida
const answer = 42;`,
  };
  protected readonly codeExample = computed(
    () => this.codeExamples[this.codeLanguage()] ?? this.codeExamples['typescript'],
  );
  protected readonly codeStoryCode = computed(() =>
    [
      `<app-retro-code`,
      `  [code]="snippet"`,
      this.codeLanguage() ? `  language="${this.codeLanguage()}"` : null,
      !this.codeFramed()  ? `  [framed]="false"` : null,
      `/>`,
    ].filter((l) => l !== null).join('\n'),
  );

  // ── Usage snippet ─────────────────────────────────────────────────────────

  protected readonly usageCodeSnippet = `// standalone component import
import { Component } from '@angular/core';
import {
  RetroButtonComponent,
  RetroInputComponent,
  RetroWindowComponent,
  StatBoxComponent,
  StatusPillComponent,
} from '@app/shared/ui';

@Component({
  standalone: true,
  imports: [RetroButtonComponent, RetroInputComponent, RetroWindowComponent],
  template: \`
    <app-retro-window title="~/my-feature">
      <app-retro-input prefix="$" placeholder="grep..." [clearable]="true"
        (valueChange)="onSearch($event)" />
      <app-retro-button variant="primary" [loading]="saving()" (pressed)="save()">
        save
      </app-retro-button>
    </app-retro-window>
  \`,
})
export class MyFeaturePage {}`;

  // ─────────────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const allIds = this.storyGroups.flatMap((g) => g.items.map((i) => i.id));
    const saved  = localStorage.getItem('devboard.lib.active') as StoryId | null;
    if (saved && allIds.includes(saved)) this.activeStory.set(saved);
  }

  protected setActiveStory(id: StoryId): void {
    this.activeStory.set(id);
    this.activeTab.set('preview');
    localStorage.setItem('devboard.lib.active', id);
  }

  protected setActiveTab(tab: StoryTab): void { this.activeTab.set(tab); }
  protected setTheme(theme: ThemeName): void  { this.themeService.setTheme(theme); }
}
