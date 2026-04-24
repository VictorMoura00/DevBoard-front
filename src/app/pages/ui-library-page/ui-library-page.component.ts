import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { APP_THEMES, ThemeName } from '../../core/theme/theme.model';
import { ThemeService } from '../../core/theme/theme.service';
import {
  AsciiBarComponent,
  RetroButtonComponent,
  RetroButtonGroupComponent,
  RetroCheckboxComponent,
  RetroCodeComponent,
  RetroCollapsibleComponent,
  RetroInputComponent,
  RetroKbdComponent,
  RetroMessageComponent,
  RetroModalComponent,
  RetroProgressComponent,
  RetroRangeComponent,
  RetroSelectComponent,
  RetroSkeletonComponent,
  RetroTagComponent,
  RetroToastComponent,
  RetroWindowComponent,
  StatBoxComponent,
  StatusDotComponent,
  StatusPillComponent,
  ToastService,
} from '../../shared/ui';
import { RetroButtonIconPos, RetroButtonTone, RetroButtonVariant } from '../../shared/ui/retro-button/retro-button.component';
import { RetroCheckboxSize } from '../../shared/ui/retro-checkbox/retro-checkbox.component';
import { RetroInputSize, RetroInputType } from '../../shared/ui/retro-input/retro-input.component';
import { MessageSeverity, MessageVariant } from '../../shared/ui/retro-message/retro-message.component';
import { ProgressMode, ProgressTone } from '../../shared/ui/retro-progress/retro-progress.component';
import { SkeletonAnimation, SkeletonShape } from '../../shared/ui/retro-skeleton/retro-skeleton.component';
import { TagSize, TagVariant } from '../../shared/ui/retro-tag/retro-tag.component';
import { ToastPosition } from '../../shared/ui/retro-toast/toast.model';
import { StatBoxTone, StatBoxTrend } from '../../shared/ui/stat-box/stat-box.component';
import { StatusDotSize } from '../../shared/ui/status-dot/status-dot.component';
import { StatusPillSize } from '../../shared/ui/status-pill/status-pill.component';
import { WindowControl, WindowPadding, WindowStatus, WindowVariant } from '../../shared/ui/retro-window/window.model';

type StoryId =
  | 'win' | 'button' | 'input' | 'select' | 'range' | 'checkbox' | 'kbd'
  | 'pill' | 'dot' | 'tag' | 'stat'
  | 'progress' | 'ascii' | 'toast' | 'message' | 'skeleton'
  | 'modal' | 'collapsible' | 'code';
type StoryTab = 'preview' | 'code';
type DocTab = 'usage' | 'api' | 'meta';

interface StoryItem  { id: StoryId; label: string; }
interface StoryGroup { group: string; items: StoryItem[]; }
type PreviewBackground = 'panel' | 'light' | 'dark';
interface StoryDocMeta {
  selector: string;
  summary: string;
  inputs: number;
  outputs: number;
  slots: number;
}

@Component({
  selector: 'app-ui-library-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.sidebar-collapsed]': 'sidebarCollapsed()' },
  imports: [
    FormsModule,
    AsciiBarComponent,
    RetroButtonComponent,
    RetroButtonGroupComponent,
    RetroCheckboxComponent,
    RetroCodeComponent,
    RetroCollapsibleComponent,
    RetroInputComponent,
    RetroKbdComponent,
    RetroMessageComponent,
    RetroModalComponent,
    RetroProgressComponent,
    RetroRangeComponent,
    RetroSelectComponent,
    RetroSkeletonComponent,
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
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly toastService  = inject(ToastService);
  private readonly storySearchInput = viewChild<RetroInputComponent>('storySearchInput');
  private readonly previewViewportElement = viewChild<ElementRef<HTMLElement>>('previewViewportEl');
  private readonly hydrated = signal(false);
  private readonly storagePrefix = 'devboard.lib';

  protected readonly themes       = APP_THEMES;
  protected readonly currentTheme = this.themeService.currentTheme;
  protected readonly themeOptions = APP_THEMES.map((theme) => ({
    label: theme.label,
    value: theme.name,
  }));

  protected readonly sidebarCollapsed = signal(false);
  protected toggleSidebar(): void { this.sidebarCollapsed.update(v => !v); }
  protected readonly storySearch = signal('');

  protected readonly collapsedGroups = signal<Set<string>>(new Set());
  protected isGroupCollapsed(group: string): boolean { return this.collapsedGroups().has(group); }
  protected toggleGroup(group: string): void {
    this.collapsedGroups.update(set => {
      const next = new Set(set);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  }

  protected readonly storyGroups: StoryGroup[] = [
    {
      group: 'containers',
      items: [
        { id: 'win',         label: 'Window Frame' },
        { id: 'modal',       label: 'Modal' },
        { id: 'collapsible', label: 'Collapsible' },
      ],
    },
    {
      group: 'form',
      items: [
        { id: 'button',   label: 'Button' },
        { id: 'input',    label: 'Input' },
        { id: 'select',   label: 'Select' },
        { id: 'range',    label: 'Range' },
        { id: 'checkbox', label: 'Checkbox' },
        { id: 'kbd',      label: 'Kbd' },
      ],
    },
    {
      group: 'display',
      items: [
        { id: 'stat',     label: 'Stat Box' },
        { id: 'progress', label: 'Progress' },
        { id: 'ascii',    label: 'Ascii Bar' },
        { id: 'code',     label: 'Code Block' },
      ],
    },
    {
      group: 'labels',
      items: [
        { id: 'pill', label: 'Status Pill' },
        { id: 'dot',  label: 'Status Dot' },
        { id: 'tag',  label: 'Tag' },
      ],
    },
    {
      group: 'feedback',
      items: [
        { id: 'toast',    label: 'Toast' },
        { id: 'message',  label: 'Message' },
        { id: 'skeleton', label: 'Skeleton' },
      ],
    },
  ];

  protected readonly activeStory = signal<StoryId>('button');
  protected readonly activeTab   = signal<StoryTab>('preview');
  protected readonly activeDocTab = signal<DocTab>('api');
  protected readonly previewBackground = signal<PreviewBackground>('panel');
  protected readonly previewFullscreen = signal(false);
  protected readonly storyControlsCollapsed = signal(true);
  protected readonly previewBackgrounds: PreviewBackground[] = ['panel', 'light', 'dark'];
  protected readonly previewWidth = signal(960);
  protected readonly previewHeight = signal(560);
  protected readonly previewSizeLabel = computed(
    () => `${this.previewWidth()} x ${this.previewHeight()} px`,
  );

  protected readonly flatStoryItems = computed(() =>
    this.storyGroups.flatMap((group) =>
      group.items.map((item) => ({ ...item, group: group.group })),
    ),
  );

  protected readonly filteredStoryGroups = computed(() => {
    const query = this.storySearch().trim().toLowerCase();

    if (!query) {
      return this.storyGroups;
    }

    return this.storyGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          `${group.group} ${item.label} ${item.id}`.toLowerCase().includes(query),
        ),
      }))
      .filter((group) => group.items.length > 0);
  });

  protected readonly totalStoryCount = computed(() => this.flatStoryItems().length);
  protected readonly filteredStoryCount = computed(() =>
    this.filteredStoryGroups().reduce((total, group) => total + group.items.length, 0),
  );
  protected readonly filteredStoryIds = computed(() =>
    this.filteredStoryGroups().flatMap((group) => group.items.map((item) => item.id)),
  );
  protected readonly activeStoryItem = computed(
    () => this.flatStoryItems().find((item) => item.id === this.activeStory()) ?? null,
  );
  protected readonly activeStoryLabel = computed(() => this.activeStoryItem()?.label ?? this.activeStory());
  protected readonly activeGroupLabel = computed(() => this.activeStoryItem()?.group ?? 'catalog');
  protected readonly activeBreadcrumb = computed(
    () => `catalog / ${this.activeGroupLabel()} / ${this.activeStoryLabel()}`,
  );
  protected readonly activeStoryPath = computed(
    () => `@app/shared/ui/${this.activeStoryTitle().replace('.ts', '')}`,
  );
  protected readonly activeStoryHint = computed(
    () => `${this.activeGroupLabel()} component · shareable via ?story=${this.activeStory()}`,
  );

  protected readonly activeStoryTitle = computed(() => {
    const map: Record<StoryId, string> = {
      win:        'retro-window.component.ts',
      button:     'retro-button.component.ts',
      input:      'retro-input.component.ts',
      select:     'retro-select.component.ts',
      range:      'retro-range.component.ts',
      checkbox:   'retro-checkbox.component.ts',
      kbd:        'retro-kbd.component.ts',
      pill:       'status-pill.component.ts',
      dot:        'status-dot.component.ts',
      tag:        'retro-tag.component.ts',
      stat:       'stat-box.component.ts',
      progress:   'retro-progress.component.ts',
      ascii:      'ascii-bar.component.ts',
      toast:      'retro-toast.component.ts',
      message:    'retro-message.component.ts',
      skeleton:   'retro-skeleton.component.ts',
      modal:      'retro-modal.component.ts',
      collapsible:'retro-collapsible.component.ts',
      code:       'retro-code.component.ts',
    };
    return map[this.activeStory()];
  });

  protected readonly activeDocMeta = computed<StoryDocMeta>(() => {
    const docs: Record<StoryId, StoryDocMeta> = {
      win: { selector: 'app-retro-window', summary: 'Janela base para shells, painéis e blocos do design system retrô.', inputs: 11, outputs: 4, slots: 3 },
      button: { selector: 'app-retro-button', summary: 'Botão principal da biblioteca com variantes, loading e link rendering.', inputs: 6, outputs: 1, slots: 1 },
      input: { selector: 'app-retro-input', summary: 'Campo de entrada retrô com prefixo, suffix, clearable e estados visuais.', inputs: 12, outputs: 2, slots: 0 },
      select: { selector: 'app-retro-select', summary: 'Select retrô para listas pequenas e configurações rápidas do sistema.', inputs: 4, outputs: 1, slots: 0 },
      range: { selector: 'app-retro-range', summary: 'Slider retrô para ajustes de valor contínuo com feedback imediato.', inputs: 6, outputs: 1, slots: 0 },
      checkbox: { selector: 'app-retro-checkbox', summary: 'Checkbox standalone com estados checked, readonly, invalid e indeterminate.', inputs: 9, outputs: 2, slots: 0 },
      kbd: { selector: 'app-retro-kbd', summary: 'Representação visual de teclas únicas ou combos de atalhos.', inputs: 1, outputs: 0, slots: 1 },
      pill: { selector: 'app-status-pill', summary: 'Pill compacta para estados de workflow e status categóricos.', inputs: 2, outputs: 0, slots: 0 },
      dot: { selector: 'app-status-dot', summary: 'Indicador pontual de estado com opção de pulso para atividade.', inputs: 3, outputs: 0, slots: 0 },
      tag: { selector: 'app-retro-tag', summary: 'Tag textual para labels, filtros e taxonomias do projeto.', inputs: 6, outputs: 1, slots: 0 },
      stat: { selector: 'app-stat-box', summary: 'Caixa métrica para KPIs, contadores e resumos do dashboard.', inputs: 5, outputs: 0, slots: 0 },
      progress: { selector: 'app-retro-progress', summary: 'Barra de progresso com modos determinate e indeterminate.', inputs: 7, outputs: 0, slots: 0 },
      ascii: { selector: 'app-ascii-bar', summary: 'Barra em estilo terminal usando caracteres ASCII configuráveis.', inputs: 5, outputs: 0, slots: 0 },
      toast: { selector: 'app-retro-toast', summary: 'Host visual para notificações emitidas pelo ToastService.', inputs: 2, outputs: 1, slots: 0 },
      message: { selector: 'app-retro-message', summary: 'Mensagem inline com severidade, variante e fechamento opcional.', inputs: 5, outputs: 1, slots: 1 },
      skeleton: { selector: 'app-retro-skeleton', summary: 'Placeholder visual para carregamento com wave, pulse ou estado estático.', inputs: 5, outputs: 0, slots: 0 },
      modal: { selector: 'app-retro-modal', summary: 'Modal standalone com overlay, backdrop close, teclado e slots nomeados.', inputs: 6, outputs: 1, slots: 2 },
      collapsible: { selector: 'app-retro-collapsible', summary: 'Bloco expansível para seções de documentação e conteúdo progressivo.', inputs: 3, outputs: 1, slots: 1 },
      code: { selector: 'app-retro-code', summary: 'Bloco de código com linguagem, borda opcional e ação de cópia.', inputs: 3, outputs: 0, slots: 0 },
    };

    return docs[this.activeStory()];
  });

  private readonly persistStateEffect = effect(() => {
    if (!this.hydrated()) {
      return;
    }

    localStorage.setItem(`${this.storagePrefix}.active`, this.activeStory());
    localStorage.setItem(
      `${this.storagePrefix}.ui`,
      JSON.stringify({
        activeTab: this.activeTab(),
        activeDocTab: this.activeDocTab(),
        previewBackground: this.previewBackground(),
        previewWidth: this.previewWidth(),
        previewHeight: this.previewHeight(),
        sidebarCollapsed: this.sidebarCollapsed(),
        storyControlsCollapsed: this.storyControlsCollapsed(),
      }),
    );

    for (const storyId of this.flatStoryItems().map((item) => item.id)) {
      localStorage.setItem(this.storyStorageKey(storyId), JSON.stringify(this.getStoryState(storyId)));
    }
  });

  private readonly syncFilteredSelectionEffect = effect(() => {
    if (!this.hydrated()) {
      return;
    }

    const visibleStories = this.filteredStoryIds();

    if (visibleStories.length === 0 || visibleStories.includes(this.activeStory())) {
      return;
    }

    this.activeStory.set(visibleStories[0]);
    this.activeTab.set('preview');
    this.previewFullscreen.set(false);
    this.syncUrlState();
  });

  // ── Win ─────────────────────────────────────────────────────────────────

  protected readonly winTitle      = signal('~/devboard/example');
  protected readonly winSubtitle   = signal('window.frame');
  protected readonly winVariant    = signal<WindowVariant>('default');
  protected readonly winPadding    = signal<WindowPadding>('md');
  protected readonly winStatus     = signal<WindowStatus | ''>('');
  protected readonly winScrollable = signal(false);
  protected readonly winLoading    = signal(false);
  protected readonly winFooter     = signal('');

  // Controls — individual toggles that compute the [controls] array
  protected readonly winCtrlMinimize = signal(false);
  protected readonly winCtrlMaximize = signal(false);
  protected readonly winCtrlClose    = signal(false);
  protected readonly winControls = computed<WindowControl[]>(() => [
    ...(this.winCtrlMinimize() ? ['minimize' as WindowControl] : []),
    ...(this.winCtrlMaximize() ? ['maximize' as WindowControl] : []),
    ...(this.winCtrlClose()    ? ['close'    as WindowControl] : []),
  ]);

  protected readonly winCode = computed(() => {
    const controls = this.winControls();
    const allThree = controls.length === 3;
    const controlsLine = allThree
      ? `  [showControls]="true"`
      : controls.length > 0
        ? `  [controls]="['${controls.join("', '")}']"`
        : null;

    return [
      `<app-retro-window`,
      `  title="${this.winTitle()}"`,
      this.winSubtitle()              ? `  subtitle="${this.winSubtitle()}"` : null,
      this.winVariant() !== 'default' ? `  variant="${this.winVariant()}"` : null,
      this.winPadding() !== 'md'      ? `  padding="${this.winPadding()}"` : null,
      this.winStatus()                ? `  status="${this.winStatus()}"` : null,
      this.winScrollable()            ? `  [scrollable]="true"` : null,
      this.winLoading()               ? `  [loading]="true"` : null,
      controlsLine,
      `>`,
      `  <!-- body content -->`,
      this.winFooter() ? `  <div window-footer><!-- footer --></div>` : null,
      `</app-retro-window>`,
    ].filter((l) => l !== null).join('\n');
  });

  // ── Button ──────────────────────────────────────────────────────────────

  protected readonly btnLabel     = signal('deploy');
  protected readonly btnVariant   = signal<RetroButtonVariant>('primary');
  protected readonly btnTone      = signal<RetroButtonTone>('default');
  protected readonly btnSize      = signal<'sm' | 'md' | 'lg'>('md');
  protected readonly btnIcon      = signal('');
  protected readonly btnIconPos   = signal<RetroButtonIconPos>('left');
  protected readonly btnBadge     = signal('');
  protected readonly btnHref      = signal('');
  protected readonly btnDisabled  = signal(false);
  protected readonly btnLoading   = signal(false);
  protected readonly btnFullWidth = signal(false);
  protected readonly btnClicks    = signal(0);

  protected readonly btnCode = computed(() => {
    const lines = [
      `<app-retro-button`,
      this.btnVariant() !== 'primary'   ? `  variant="${this.btnVariant()}"` : null,
      this.btnTone()    !== 'default'   ? `  tone="${this.btnTone()}"` : null,
      this.btnSize()    !== 'md'        ? `  size="${this.btnSize()}"` : null,
      this.btnIcon()                    ? `  icon="${this.btnIcon()}"` : null,
      this.btnIcon() && this.btnIconPos() !== 'left' ? `  iconPos="${this.btnIconPos()}"` : null,
      this.btnBadge()                   ? `  badge="${this.btnBadge()}"` : null,
      this.btnHref()                    ? `  href="${this.btnHref()}"` : null,
      this.btnDisabled()                ? `  [disabled]="true"` : null,
      this.btnLoading()                 ? `  [loading]="true"` : null,
      this.btnFullWidth()               ? `  [fullWidth]="true"` : null,
      `  (pressed)="onClick()">`,
      `  ${this.btnLabel()}`,
      `</app-retro-button>`,
    ];
    return lines.filter((l) => l !== null).join('\n');
  });

  // ── Input ────────────────────────────────────────────────────────────────

  protected readonly inputValue        = signal('');
  protected readonly inputPlaceholder  = signal('grep projects…');
  protected readonly inputType         = signal<RetroInputType>('text');
  protected readonly inputSize         = signal<RetroInputSize>('md');
  protected readonly inputPrefix       = signal('$');
  protected readonly inputSuffix       = signal('');
  protected readonly inputDisabled     = signal(false);
  protected readonly inputReadonly     = signal(false);
  protected readonly inputInvalid      = signal(false);
  protected readonly inputErrorMessage = signal('campo obrigatório');
  protected readonly inputHelpText     = signal('');
  protected readonly inputClearable    = signal(true);
  protected readonly inputFullWidth    = signal(false);
  protected readonly inputTypes: RetroInputType[] = ['text', 'search', 'number', 'email', 'password'];
  protected readonly inputSizes: RetroInputSize[] = ['sm', 'md', 'lg'];
  protected readonly inputCode = computed(() =>
    [
      `<app-retro-input`,
      `  type="${this.inputType()}"`,
      this.inputSize() !== 'md'  ? `  size="${this.inputSize()}"` : null,
      this.inputPrefix()         ? `  prefix="${this.inputPrefix()}"` : null,
      this.inputSuffix()         ? `  suffix="${this.inputSuffix()}"` : null,
      `  placeholder="${this.inputPlaceholder()}"`,
      `  [value]="value"`,
      this.inputClearable()      ? `  [clearable]="true"` : null,
      this.inputReadonly()       ? `  [readonly]="true"` : null,
      this.inputInvalid()        ? `  [invalid]="true"` : null,
      this.inputInvalid() && this.inputErrorMessage()
        ? `  errorMessage="${this.inputErrorMessage()}"` : null,
      this.inputHelpText()       ? `  helpText="${this.inputHelpText()}"` : null,
      this.inputDisabled()       ? `  [disabled]="true"` : null,
      this.inputFullWidth()      ? `  [fullWidth]="true"` : null,
      `  (valueChange)="value = $event"`,
      `/>`,
    ].filter((l) => l !== null).join('\n'),
  );

  // ── Checkbox ─────────────────────────────────────────────────────────────

  protected readonly selectValue = signal('classic-amber');
  protected readonly selectSize = signal<'sm' | 'md'>('md');
  protected readonly selectDisabled = signal(false);
  protected readonly selectOptions = [
    { label: 'Classic Amber', value: 'classic-amber' },
    { label: 'Phosphor Green', value: 'phosphor-green' },
    { label: 'CRT Blue', value: 'crt-blue' },
  ];
  protected readonly selectCode = computed(() =>
    [
      `<app-retro-select`,
      `  [options]="themeOptions"`,
      `  value="${this.selectValue()}"`,
      this.selectSize() !== 'md' ? `  size="${this.selectSize()}"` : null,
      this.selectDisabled() ? `  [disabled]="true"` : null,
      `  (valueChange)="theme = $event"`,
      `/>`,
    ].filter((l) => l !== null).join('\n'),
  );

  protected readonly rangeValue = signal(42);
  protected readonly rangeMin = signal(0);
  protected readonly rangeMax = signal(100);
  protected readonly rangeStep = signal(1);
  protected readonly rangeDisabled = signal(false);
  protected readonly rangeCode = computed(() =>
    [
      `<app-retro-range`,
      `  [value]="${this.rangeValue()}"`,
      this.rangeMin() !== 0 ? `  [min]="${this.rangeMin()}"` : null,
      this.rangeMax() !== 100 ? `  [max]="${this.rangeMax()}"` : null,
      this.rangeStep() !== 1 ? `  [step]="${this.rangeStep()}"` : null,
      this.rangeDisabled() ? `  [disabled]="true"` : null,
      `  (valueChange)="value = $event"`,
      `/>`,
    ].filter((l) => l !== null).join('\n'),
  );

  protected readonly checkboxChecked       = signal(false);
  protected readonly checkboxLabel         = signal('enable feature flag');
  protected readonly checkboxSize          = signal<RetroCheckboxSize>('md');
  protected readonly checkboxDisabled      = signal(false);
  protected readonly checkboxReadonly      = signal(false);
  protected readonly checkboxInvalid       = signal(false);
  protected readonly checkboxIndeterminate = signal(false);
  protected readonly checkboxCode = computed(() =>
    [
      `<app-retro-checkbox`,
      this.checkboxLabel()          ? `  label="${this.checkboxLabel()}"` : null,
      this.checkboxSize() !== 'md'  ? `  size="${this.checkboxSize()}"` : null,
      `  [checked]="checked"`,
      this.checkboxReadonly()       ? `  [readonly]="true"` : null,
      this.checkboxInvalid()        ? `  [invalid]="true"` : null,
      this.checkboxDisabled()       ? `  [disabled]="true"` : null,
      this.checkboxIndeterminate()  ? `  [indeterminate]="true"` : null,
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
  protected readonly tagSize      = signal<TagSize>('md');
  protected readonly tagIcon      = signal('');
  protected readonly tagRemovable = signal(false);
  protected readonly tagDisabled  = signal(false);
  protected readonly tagVariants: TagVariant[] = ['default', 'primary', 'success', 'warning', 'danger'];
  protected readonly tagCode = computed(() =>
    [
      `<app-retro-tag`,
      `  label="${this.tagLabel()}"`,
      this.tagIcon()              ? `  icon="${this.tagIcon()}"` : null,
      this.tagVariant() !== 'default' ? `  variant="${this.tagVariant()}"` : null,
      this.tagSize() !== 'md'     ? `  size="${this.tagSize()}"` : null,
      this.tagRemovable()         ? `  [removable]="true"` : null,
      this.tagDisabled()          ? `  [disabled]="true"` : null,
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
  protected readonly progressMode     = signal<ProgressMode>('determinate');
  protected readonly progressTone     = signal<ProgressTone>('default');
  protected readonly progressLabel    = signal('loading assets');
  protected readonly progressUnit     = signal('%');
  protected readonly progressShowVal  = signal(true);
  protected readonly progressAnimated = signal(false);
  protected readonly progressTones: ProgressTone[] = ['default', 'success', 'warning', 'danger'];
  protected readonly progressCode = computed(() => {
    const indet = this.progressMode() !== 'determinate';
    return [
      `<app-retro-progress`,
      indet ? `  mode="indeterminate"` : `  [value]="${this.progressValue()}"`,
      this.progressTone() !== 'default' ? `  tone="${this.progressTone()}"` : null,
      this.progressUnit() !== '%'       ? `  unit="${this.progressUnit()}"` : null,
      this.progressLabel()              ? `  label="${this.progressLabel()}"` : null,
      !indet && this.progressShowVal()  ? `  [showValue]="true"` : null,
      !indet && this.progressAnimated() ? `  [animated]="true"` : null,
      `/>`,
    ].filter((l) => l !== null).join('\n');
  });

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
  protected readonly toastLife        = signal(4200);
  protected readonly toastSticky      = signal(false);
  protected readonly toastPosition    = signal<ToastPosition>('bottom-right');
  protected readonly toastMaxVisible  = signal(5);
  protected readonly toastTypes       = ['event', 'success', 'warning', 'error'] as const;
  protected readonly toastPositions: ToastPosition[] = [
    'bottom-right', 'bottom-left', 'top-right', 'top-left', 'top-center', 'bottom-center',
  ];

  protected readonly toastDetailCode        = signal('ERR_503');
  protected readonly toastDetailService     = signal('notifications-api');
  protected readonly toastDetailHttp        = signal('503 Service Unavailable');
  protected readonly toastDetailTrace       = signal('trace_d41ab2');
  protected readonly toastDetailStack       = signal(
    `System.Net.Http.HttpRequestException: Connection refused\nat webhook.PostAsync(uri)\nat NotificationsConsumer.Handle(TaskCompleted)\nat MassTransit.Consumer.Dispatch()`,
  );
  protected readonly toastDetailActionLabel = signal('OPEN IN JAEGER →');
  protected readonly toastDetailActionUrl   = signal('#');

  protected readonly toastCode = computed(() => {
    const sticky      = this.toastSticky();
    const life        = this.toastLife();
    const lifeSuffix  = sticky ? `, 0  // sticky` : life !== 3400 ? `, ${life}` : '';
    return [
      `<app-retro-toast`,
      this.toastPosition() !== 'bottom-right' ? `  position="${this.toastPosition()}"` : null,
      this.toastMaxVisible() !== 5 ? `  [maxVisible]="${this.toastMaxVisible()}"` : null,
      `  (toastClosed)="onToastClosed($event)"`,
      `/>`,
      ``,
      `// inject the service anywhere in your component`,
      `protected readonly toast = inject(ToastService);`,
      ``,
      `this.toast.${this.toastType()}('${this.toastMessage()}'${lifeSuffix ? `, details${lifeSuffix}` : ''});`,
      this.toastWithDetails() ? `` : null,
      this.toastWithDetails() ? `// with structured details (expands inline)` : null,
      this.toastWithDetails() ? `this.toast.error('${this.toastMessage()}', {` : null,
      this.toastWithDetails() && this.toastDetailCode()    ? `  code: '${this.toastDetailCode()}',` : null,
      this.toastWithDetails() && this.toastDetailService() ? `  service: '${this.toastDetailService()}',` : null,
      this.toastWithDetails() && this.toastDetailHttp()    ? `  http: '${this.toastDetailHttp()}',` : null,
      this.toastWithDetails() && this.toastDetailTrace()   ? `  trace: '${this.toastDetailTrace()}',` : null,
      this.toastWithDetails() && this.toastDetailStack()   ? `  stack: \`...\`,` : null,
      this.toastWithDetails() && this.toastDetailActionLabel() ? `  action: { label: '${this.toastDetailActionLabel()}', url: '${this.toastDetailActionUrl()}' },` : null,
      this.toastWithDetails() ? `}${lifeSuffix ? `, ${sticky ? 0 : life}` : ''});` : null,
    ].filter((l) => l !== null).join('\n');
  });

  protected fireToast(): void {
    const duration = this.toastLife();
    const sticky   = this.toastSticky();
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
    this.toastService.show(this.toastMessage(), this.toastType(), duration, details, sticky);
  }

  // ── Message ───────────────────────────────────────────────────────────────

  protected readonly msgSeverity  = signal<MessageSeverity>('info');
  protected readonly msgVariant   = signal<MessageVariant>('filled');
  protected readonly msgText      = signal('Pipeline concluído com 3 artefatos publicados.');
  protected readonly msgClosable  = signal(true);
  protected readonly msgIcon      = signal('');
  protected readonly msgSeverities: MessageSeverity[] = ['info', 'success', 'warning', 'error'];
  protected readonly msgVariants: MessageVariant[]    = ['filled', 'outlined', 'ghost'];
  protected readonly msgCode = computed(() =>
    [
      `<app-retro-message`,
      `  severity="${this.msgSeverity()}"`,
      this.msgVariant() !== 'filled'    ? `  variant="${this.msgVariant()}"` : null,
      this.msgText()                    ? `  text="${this.msgText()}"` : null,
      this.msgIcon()                    ? `  icon="${this.msgIcon()}"` : null,
      this.msgClosable()                ? `  [closable]="true"` : null,
      `  (msgClosed)="onMsgClosed()"`,
      `/>`,
    ].filter((l) => l !== null).join('\n'),
  );

  // ── Skeleton ──────────────────────────────────────────────────────────────

  protected readonly skelWidth     = signal('100%');
  protected readonly skelHeight    = signal('14px');
  protected readonly skelShape     = signal<SkeletonShape>('rectangle');
  protected readonly skelAnimation = signal<SkeletonAnimation>('wave');
  protected readonly skelCount     = signal(1);
  protected readonly skelCode = computed(() =>
    [
      `<app-retro-skeleton`,
      this.skelWidth()  !== '100%'       ? `  width="${this.skelWidth()}"` : null,
      this.skelHeight() !== '14px'       ? `  height="${this.skelHeight()}"` : null,
      this.skelShape()  !== 'rectangle'  ? `  shape="${this.skelShape()}"` : null,
      this.skelAnimation() !== 'wave'    ? `  animation="${this.skelAnimation()}"` : null,
      this.skelCount() !== 1             ? `  [count]="${this.skelCount()}"` : null,
      `/>`,
    ].filter((l) => l !== null).join('\n'),
  );

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

  protected readonly collapsibleTitle     = signal('section.details');
  protected readonly collapsibleCollapsed = signal(false);
  protected readonly collapsibleDisabled  = signal(false);
  protected readonly collapsibleCode = computed(() =>
    [
      `<app-retro-collapsible`,
      `  title="${this.collapsibleTitle()}"`,
      this.collapsibleCollapsed() ? `  [(collapsed)]="isCollapsed"` : null,
      this.collapsibleDisabled()  ? `  [disabled]="true"` : null,
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
    const allIds = this.flatStoryItems().map((item) => item.id);
    const queryStory = this.route.snapshot.queryParamMap.get('story') as StoryId | null;
    const savedStory = localStorage.getItem(`${this.storagePrefix}.active`) as StoryId | null;
    const initialStory = [queryStory, savedStory].find(
      (storyId): storyId is StoryId => !!storyId && allIds.includes(storyId),
    );

    const savedUi = this.readObject(localStorage.getItem(`${this.storagePrefix}.ui`));
    const queryTab = this.route.snapshot.queryParamMap.get('tab');

    for (const storyId of allIds) {
      this.restoreStoryState(storyId, this.readObject(localStorage.getItem(this.storyStorageKey(storyId))));
    }

    if (initialStory) {
      this.activeStory.set(initialStory);
    }

    if (queryTab === 'preview' || queryTab === 'code') {
      this.activeTab.set(queryTab);
    } else if (savedUi && (savedUi.activeTab === 'preview' || savedUi.activeTab === 'code')) {
      this.activeTab.set(savedUi.activeTab);
    }

    if (savedUi && (savedUi.activeDocTab === 'usage' || savedUi.activeDocTab === 'api' || savedUi.activeDocTab === 'meta')) {
      this.activeDocTab.set(savedUi.activeDocTab);
    }

    if (
      savedUi
      && (savedUi.previewBackground === 'panel' || savedUi.previewBackground === 'light' || savedUi.previewBackground === 'dark')
    ) {
      this.previewBackground.set(savedUi.previewBackground);
    }

    if (
      savedUi
      && typeof savedUi.previewWidth === 'number'
    ) {
      this.previewWidth.set(this.coercePreviewDimension(savedUi.previewWidth, 320, 1400));
    }

    if (
      savedUi
      && typeof savedUi.previewHeight === 'number'
    ) {
      this.previewHeight.set(this.coercePreviewDimension(savedUi.previewHeight, 220, 960));
    }

    if (savedUi && typeof savedUi.sidebarCollapsed === 'boolean') {
      this.sidebarCollapsed.set(savedUi.sidebarCollapsed);
    }

    if (savedUi && typeof savedUi.storyControlsCollapsed === 'boolean') {
      this.storyControlsCollapsed.set(savedUi.storyControlsCollapsed);
    }

    this.hydrated.set(true);
    this.syncUrlState();
  }

  protected setActiveStory(id: StoryId): void {
    this.activeStory.set(id);
    this.activeTab.set('preview');
    this.previewFullscreen.set(false);
    this.syncUrlState();
  }

  protected setActiveTab(tab: StoryTab): void {
    this.activeTab.set(tab);
    this.syncUrlState();
  }

  protected setActiveDocTab(tab: DocTab): void {
    this.activeDocTab.set(tab);
  }

  protected setTheme(theme: ThemeName): void  { this.themeService.setTheme(theme); }

  protected setPreviewBackground(background: PreviewBackground): void {
    this.previewBackground.set(background);
  }

  protected setPreviewWidth(value: string): void {
    this.previewWidth.set(this.coercePreviewDimension(Number(value), 320, 1400));
  }

  protected setPreviewHeight(value: string): void {
    this.previewHeight.set(this.coercePreviewDimension(Number(value), 220, 960));
  }

  protected resetPreviewSize(): void {
    this.previewWidth.set(960);
    this.previewHeight.set(560);
  }

  protected syncPreviewFrameSize(): void {
    const element = this.previewViewportElement()?.nativeElement;

    if (!element || this.activeTab() !== 'preview') {
      return;
    }

    this.previewWidth.set(this.coercePreviewDimension(element.offsetWidth, 320, 1400));
    this.previewHeight.set(this.coercePreviewDimension(element.offsetHeight, 220, 960));
  }

  protected togglePreviewFullscreen(): void {
    this.previewFullscreen.update((value) => !value);
  }

  protected onStorySearchChange(value: string): void {
    this.storySearch.set(value);
  }

  protected clearStorySearch(): void {
    this.storySearch.set('');
    this.storySearchInput()?.focus();
  }

  protected focusStorySearch(): void {
    if (this.sidebarCollapsed()) {
      this.sidebarCollapsed.set(false);
    }

    queueMicrotask(() => this.storySearchInput()?.focus());
  }

  @HostListener('document:keydown', ['$event'])
  protected handleKeyboardShortcuts(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.focusStorySearch();
      return;
    }

    if (this.isTypingTarget(event.target)) {
      return;
    }

    const key = event.key.toLowerCase();

    if (key === 'j') {
      event.preventDefault();
      this.moveStorySelection(1);
      return;
    }

    if (key === 'k') {
      event.preventDefault();
      this.moveStorySelection(-1);
      return;
    }

    if (key === 'p') {
      event.preventDefault();
      this.setActiveTab('preview');
      return;
    }

    if (key === 'c') {
      event.preventDefault();
      this.setActiveTab('code');
      return;
    }
  }

  private moveStorySelection(direction: 1 | -1): void {
    const ids = this.filteredStoryIds();

    if (ids.length === 0) {
      return;
    }

    const currentIndex = ids.indexOf(this.activeStory());
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = (safeIndex + direction + ids.length) % ids.length;

    this.setActiveStory(ids[nextIndex]);
  }

  private isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    return !!target.closest('input, textarea, select, [contenteditable="true"]');
  }

  private coercePreviewDimension(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) {
      return min;
    }

    return Math.max(min, Math.min(max, Math.round(value)));
  }

  private syncUrlState(): void {
    if (!this.hydrated()) {
      return;
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        story: this.activeStory(),
        tab: this.activeTab(),
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private storyStorageKey(storyId: StoryId): string {
    return `${this.storagePrefix}.knobs.${storyId}`;
  }

  private readObject(raw: string | null): any {
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed !== null ? parsed : null;
    } catch {
      return null;
    }
  }

  private getStoryState(storyId: StoryId): Record<string, unknown> {
    switch (storyId) {
      case 'win':
        return {
          title: this.winTitle(),
          subtitle: this.winSubtitle(),
          variant: this.winVariant(),
          padding: this.winPadding(),
          status: this.winStatus(),
          scrollable: this.winScrollable(),
          loading: this.winLoading(),
          footer: this.winFooter(),
          ctrlMinimize: this.winCtrlMinimize(),
          ctrlMaximize: this.winCtrlMaximize(),
          ctrlClose: this.winCtrlClose(),
        };
      case 'button':
        return {
          label: this.btnLabel(),
          variant: this.btnVariant(),
          tone: this.btnTone(),
          size: this.btnSize(),
          icon: this.btnIcon(),
          iconPos: this.btnIconPos(),
          badge: this.btnBadge(),
          href: this.btnHref(),
          disabled: this.btnDisabled(),
          loading: this.btnLoading(),
          fullWidth: this.btnFullWidth(),
        };
      case 'input':
        return {
          value: this.inputValue(),
          placeholder: this.inputPlaceholder(),
          type: this.inputType(),
          size: this.inputSize(),
          prefix: this.inputPrefix(),
          suffix: this.inputSuffix(),
          disabled: this.inputDisabled(),
          readonly: this.inputReadonly(),
          invalid: this.inputInvalid(),
          errorMessage: this.inputErrorMessage(),
          helpText: this.inputHelpText(),
          clearable: this.inputClearable(),
          fullWidth: this.inputFullWidth(),
        };
      case 'select':
        return {
          value: this.selectValue(),
          size: this.selectSize(),
          disabled: this.selectDisabled(),
        };
      case 'range':
        return {
          value: this.rangeValue(),
          min: this.rangeMin(),
          max: this.rangeMax(),
          step: this.rangeStep(),
          disabled: this.rangeDisabled(),
        };
      case 'checkbox':
        return {
          checked: this.checkboxChecked(),
          label: this.checkboxLabel(),
          size: this.checkboxSize(),
          disabled: this.checkboxDisabled(),
          readonly: this.checkboxReadonly(),
          invalid: this.checkboxInvalid(),
          indeterminate: this.checkboxIndeterminate(),
        };
      case 'kbd':
        return {
          comboMode: this.kbdComboMode(),
          singleKey: this.kbdSingleKey(),
          comboKeys: this.kbdComboKeys(),
          comboInput: this.kbdComboInput(),
        };
      case 'pill':
        return {
          status: this.pillStatus(),
          size: this.pillSize(),
        };
      case 'dot':
        return {
          status: this.dotStatus(),
          size: this.dotSize(),
          pulse: this.dotPulse(),
        };
      case 'tag':
        return {
          label: this.tagLabel(),
          variant: this.tagVariant(),
          size: this.tagSize(),
          icon: this.tagIcon(),
          removable: this.tagRemovable(),
          disabled: this.tagDisabled(),
        };
      case 'stat':
        return {
          label: this.statLabel(),
          value: this.statValue(),
          sublabel: this.statSublabel(),
          tone: this.statTone(),
          trend: this.statTrend() ?? null,
        };
      case 'progress':
        return {
          value: this.progressValue(),
          mode: this.progressMode(),
          tone: this.progressTone(),
          label: this.progressLabel(),
          unit: this.progressUnit(),
          showValue: this.progressShowVal(),
          animated: this.progressAnimated(),
        };
      case 'ascii':
        return {
          value: this.asciiValue(),
          width: this.asciiWidth(),
          filledChar: this.asciiFilledChar(),
          emptyChar: this.asciiEmptyChar(),
          showValue: this.asciiShowValue(),
        };
      case 'toast':
        return {
          message: this.toastMessage(),
          type: this.toastType(),
          withDetails: this.toastWithDetails(),
          life: this.toastLife(),
          sticky: this.toastSticky(),
          position: this.toastPosition(),
          maxVisible: this.toastMaxVisible(),
          detailCode: this.toastDetailCode(),
          detailService: this.toastDetailService(),
          detailHttp: this.toastDetailHttp(),
          detailTrace: this.toastDetailTrace(),
          detailStack: this.toastDetailStack(),
          detailActionLabel: this.toastDetailActionLabel(),
          detailActionUrl: this.toastDetailActionUrl(),
        };
      case 'message':
        return {
          severity: this.msgSeverity(),
          variant: this.msgVariant(),
          text: this.msgText(),
          closable: this.msgClosable(),
          icon: this.msgIcon(),
        };
      case 'skeleton':
        return {
          width: this.skelWidth(),
          height: this.skelHeight(),
          shape: this.skelShape(),
          animation: this.skelAnimation(),
          count: this.skelCount(),
        };
      case 'modal':
        return {
          title: this.modalTitle(),
          subtitle: this.modalSubtitle(),
          size: this.modalSize(),
          closeOnBackdrop: this.modalCloseOnBackdrop(),
          showCloseButton: this.modalShowCloseButton(),
        };
      case 'collapsible':
        return {
          title: this.collapsibleTitle(),
          collapsed: this.collapsibleCollapsed(),
          disabled: this.collapsibleDisabled(),
        };
      case 'code':
        return {
          language: this.codeLanguage(),
          framed: this.codeFramed(),
        };
    }
  }

  private restoreStoryState(storyId: StoryId, state: any): void {
    if (!state) {
      return;
    }

    switch (storyId) {
      case 'win':
        if (typeof state.title === 'string') this.winTitle.set(state.title);
        if (typeof state.subtitle === 'string') this.winSubtitle.set(state.subtitle);
        if (state.variant === 'default' || state.variant === 'terminal' || state.variant === 'system' || state.variant === 'alert' || state.variant === 'ghost') this.winVariant.set(state.variant);
        if (state.padding === 'none' || state.padding === 'sm' || state.padding === 'md' || state.padding === 'lg') this.winPadding.set(state.padding);
        if (state.status === '' || state.status === 'idle' || state.status === 'active' || state.status === 'loading' || state.status === 'error') this.winStatus.set(state.status);
        if (typeof state.scrollable === 'boolean') this.winScrollable.set(state.scrollable);
        if (typeof state.loading === 'boolean') this.winLoading.set(state.loading);
        if (typeof state.footer === 'string') this.winFooter.set(state.footer);
        if (typeof state.ctrlMinimize === 'boolean') this.winCtrlMinimize.set(state.ctrlMinimize);
        if (typeof state.ctrlMaximize === 'boolean') this.winCtrlMaximize.set(state.ctrlMaximize);
        if (typeof state.ctrlClose === 'boolean') this.winCtrlClose.set(state.ctrlClose);
        break;
      case 'button':
        if (typeof state.label === 'string') this.btnLabel.set(state.label);
        if (state.variant === 'primary' || state.variant === 'secondary' || state.variant === 'ghost') this.btnVariant.set(state.variant);
        if (state.tone === 'default' || state.tone === 'success' || state.tone === 'warning' || state.tone === 'danger') this.btnTone.set(state.tone);
        if (state.size === 'sm' || state.size === 'md' || state.size === 'lg') this.btnSize.set(state.size);
        if (typeof state.icon === 'string') this.btnIcon.set(state.icon);
        if (state.iconPos === 'left' || state.iconPos === 'right') this.btnIconPos.set(state.iconPos);
        if (typeof state.badge === 'string') this.btnBadge.set(state.badge);
        if (typeof state.href === 'string') this.btnHref.set(state.href);
        if (typeof state.disabled === 'boolean') this.btnDisabled.set(state.disabled);
        if (typeof state.loading === 'boolean') this.btnLoading.set(state.loading);
        if (typeof state.fullWidth === 'boolean') this.btnFullWidth.set(state.fullWidth);
        break;
      case 'input':
        if (typeof state.value === 'string') this.inputValue.set(state.value);
        if (typeof state.placeholder === 'string') this.inputPlaceholder.set(state.placeholder);
        if (state.type === 'text' || state.type === 'search' || state.type === 'number' || state.type === 'email' || state.type === 'password') this.inputType.set(state.type);
        if (state.size === 'sm' || state.size === 'md' || state.size === 'lg') this.inputSize.set(state.size);
        if (typeof state.prefix === 'string') this.inputPrefix.set(state.prefix);
        if (typeof state.suffix === 'string') this.inputSuffix.set(state.suffix);
        if (typeof state.disabled === 'boolean') this.inputDisabled.set(state.disabled);
        if (typeof state.readonly === 'boolean') this.inputReadonly.set(state.readonly);
        if (typeof state.invalid === 'boolean') this.inputInvalid.set(state.invalid);
        if (typeof state.errorMessage === 'string') this.inputErrorMessage.set(state.errorMessage);
        if (typeof state.helpText === 'string') this.inputHelpText.set(state.helpText);
        if (typeof state.clearable === 'boolean') this.inputClearable.set(state.clearable);
        if (typeof state.fullWidth === 'boolean') this.inputFullWidth.set(state.fullWidth);
        break;
      case 'select':
        if (typeof state.value === 'string') this.selectValue.set(state.value);
        if (state.size === 'sm' || state.size === 'md') this.selectSize.set(state.size);
        if (typeof state.disabled === 'boolean') this.selectDisabled.set(state.disabled);
        break;
      case 'range':
        if (typeof state.value === 'number') this.rangeValue.set(state.value);
        if (typeof state.min === 'number') this.rangeMin.set(state.min);
        if (typeof state.max === 'number') this.rangeMax.set(state.max);
        if (typeof state.step === 'number') this.rangeStep.set(state.step);
        if (typeof state.disabled === 'boolean') this.rangeDisabled.set(state.disabled);
        break;
      case 'checkbox':
        if (typeof state.checked === 'boolean') this.checkboxChecked.set(state.checked);
        if (typeof state.label === 'string') this.checkboxLabel.set(state.label);
        if (state.size === 'sm' || state.size === 'md' || state.size === 'lg') this.checkboxSize.set(state.size);
        if (typeof state.disabled === 'boolean') this.checkboxDisabled.set(state.disabled);
        if (typeof state.readonly === 'boolean') this.checkboxReadonly.set(state.readonly);
        if (typeof state.invalid === 'boolean') this.checkboxInvalid.set(state.invalid);
        if (typeof state.indeterminate === 'boolean') this.checkboxIndeterminate.set(state.indeterminate);
        break;
      case 'kbd':
        if (typeof state.comboMode === 'boolean') this.kbdComboMode.set(state.comboMode);
        if (typeof state.singleKey === 'string') this.kbdSingleKey.set(state.singleKey);
        if (Array.isArray(state.comboKeys) && state.comboKeys.every((value: any) => typeof value === 'string')) this.kbdComboKeys.set([...state.comboKeys]);
        if (typeof state.comboInput === 'string') this.kbdComboInput.set(state.comboInput);
        break;
      case 'pill':
        if (typeof state.status === 'string') this.pillStatus.set(state.status);
        if (state.size === 'sm' || state.size === 'md' || state.size === 'lg') this.pillSize.set(state.size);
        break;
      case 'dot':
        if (typeof state.status === 'string') this.dotStatus.set(state.status);
        if (state.size === 'sm' || state.size === 'md' || state.size === 'lg') this.dotSize.set(state.size);
        if (typeof state.pulse === 'boolean') this.dotPulse.set(state.pulse);
        break;
      case 'tag':
        if (typeof state.label === 'string') this.tagLabel.set(state.label);
        if (state.variant === 'default' || state.variant === 'primary' || state.variant === 'success' || state.variant === 'warning' || state.variant === 'danger') this.tagVariant.set(state.variant);
        if (state.size === 'sm' || state.size === 'md') this.tagSize.set(state.size);
        if (typeof state.icon === 'string') this.tagIcon.set(state.icon);
        if (typeof state.removable === 'boolean') this.tagRemovable.set(state.removable);
        if (typeof state.disabled === 'boolean') this.tagDisabled.set(state.disabled);
        break;
      case 'stat':
        if (typeof state.label === 'string') this.statLabel.set(state.label);
        if (typeof state.value === 'string' || typeof state.value === 'number') this.statValue.set(state.value);
        if (typeof state.sublabel === 'string') this.statSublabel.set(state.sublabel);
        if (state.tone === 'default' || state.tone === 'success' || state.tone === 'warning' || state.tone === 'danger') this.statTone.set(state.tone);
        if (state.trend === null || state.trend === 'up' || state.trend === 'down' || state.trend === 'neutral') this.statTrend.set(state.trend ?? undefined);
        break;
      case 'progress':
        if (typeof state.value === 'number') this.progressValue.set(state.value);
        if (state.mode === 'determinate' || state.mode === 'indeterminate') this.progressMode.set(state.mode);
        if (state.tone === 'default' || state.tone === 'success' || state.tone === 'warning' || state.tone === 'danger') this.progressTone.set(state.tone);
        if (typeof state.label === 'string') this.progressLabel.set(state.label);
        if (typeof state.unit === 'string') this.progressUnit.set(state.unit);
        if (typeof state.showValue === 'boolean') this.progressShowVal.set(state.showValue);
        if (typeof state.animated === 'boolean') this.progressAnimated.set(state.animated);
        break;
      case 'ascii':
        if (typeof state.value === 'number') this.asciiValue.set(state.value);
        if (typeof state.width === 'number') this.asciiWidth.set(state.width);
        if (typeof state.filledChar === 'string') this.asciiFilledChar.set(state.filledChar);
        if (typeof state.emptyChar === 'string') this.asciiEmptyChar.set(state.emptyChar);
        if (typeof state.showValue === 'boolean') this.asciiShowValue.set(state.showValue);
        break;
      case 'toast':
        if (typeof state.message === 'string') this.toastMessage.set(state.message);
        if (state.type === 'event' || state.type === 'success' || state.type === 'warning' || state.type === 'error') this.toastType.set(state.type);
        if (typeof state.withDetails === 'boolean') this.toastWithDetails.set(state.withDetails);
        if (typeof state.life === 'number') this.toastLife.set(state.life);
        if (typeof state.sticky === 'boolean') this.toastSticky.set(state.sticky);
        if (
          state.position === 'bottom-right'
          || state.position === 'bottom-left'
          || state.position === 'top-right'
          || state.position === 'top-left'
          || state.position === 'top-center'
          || state.position === 'bottom-center'
        ) this.toastPosition.set(state.position);
        if (typeof state.maxVisible === 'number') this.toastMaxVisible.set(state.maxVisible);
        if (typeof state.detailCode === 'string') this.toastDetailCode.set(state.detailCode);
        if (typeof state.detailService === 'string') this.toastDetailService.set(state.detailService);
        if (typeof state.detailHttp === 'string') this.toastDetailHttp.set(state.detailHttp);
        if (typeof state.detailTrace === 'string') this.toastDetailTrace.set(state.detailTrace);
        if (typeof state.detailStack === 'string') this.toastDetailStack.set(state.detailStack);
        if (typeof state.detailActionLabel === 'string') this.toastDetailActionLabel.set(state.detailActionLabel);
        if (typeof state.detailActionUrl === 'string') this.toastDetailActionUrl.set(state.detailActionUrl);
        break;
      case 'message':
        if (state.severity === 'info' || state.severity === 'success' || state.severity === 'warning' || state.severity === 'error') this.msgSeverity.set(state.severity);
        if (state.variant === 'filled' || state.variant === 'outlined' || state.variant === 'ghost') this.msgVariant.set(state.variant);
        if (typeof state.text === 'string') this.msgText.set(state.text);
        if (typeof state.closable === 'boolean') this.msgClosable.set(state.closable);
        if (typeof state.icon === 'string') this.msgIcon.set(state.icon);
        break;
      case 'skeleton':
        if (typeof state.width === 'string') this.skelWidth.set(state.width);
        if (typeof state.height === 'string') this.skelHeight.set(state.height);
        if (state.shape === 'rectangle' || state.shape === 'circle') this.skelShape.set(state.shape);
        if (state.animation === 'wave' || state.animation === 'pulse' || state.animation === 'none') this.skelAnimation.set(state.animation);
        if (typeof state.count === 'number') this.skelCount.set(state.count);
        break;
      case 'modal':
        if (typeof state.title === 'string') this.modalTitle.set(state.title);
        if (typeof state.subtitle === 'string') this.modalSubtitle.set(state.subtitle);
        if (state.size === 'sm' || state.size === 'md' || state.size === 'lg') this.modalSize.set(state.size);
        if (typeof state.closeOnBackdrop === 'boolean') this.modalCloseOnBackdrop.set(state.closeOnBackdrop);
        if (typeof state.showCloseButton === 'boolean') this.modalShowCloseButton.set(state.showCloseButton);
        break;
      case 'collapsible':
        if (typeof state.title === 'string') this.collapsibleTitle.set(state.title);
        if (typeof state.collapsed === 'boolean') this.collapsibleCollapsed.set(state.collapsed);
        if (typeof state.disabled === 'boolean') this.collapsibleDisabled.set(state.disabled);
        break;
      case 'code':
        if (typeof state.language === 'string') this.codeLanguage.set(state.language);
        if (typeof state.framed === 'boolean') this.codeFramed.set(state.framed);
        break;
    }
  }
}
