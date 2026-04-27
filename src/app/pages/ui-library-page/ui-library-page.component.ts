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
  FilterRule,
  FilterTab,
  GridColumn,
  RetroFilterBarComponent,
  RetroGridRowComponent,
  NotifService,
  NotifSource,
  NotifType,
  Priority,
  PriorityIndicatorComponent,
  ProjectCardComponent,
  ProjectDetailHeaderComponent,
  ProjectBadge,
  RetroButtonComponent,
  RetroButtonGroupComponent,
  RetroCheckboxComponent,
  RetroCodeComponent,
  RetroCollapsibleComponent,
  RetroDataGridComponent,
  RetroExpandableRowComponent,
  RetroPaginatorComponent,
  RelativeTimePipe,
  createRetroTable,
  RetroInputComponent,
  RetroKbdComponent,
  RetroMessageComponent,
  RetroModalComponent,
  RetroNotifItemComponent,
  RetroNotifStreamComponent,
  RetroProgressComponent,
  RetroRangeComponent,
  RetroSegmentedComponent,
  RetroSelectComponent,
  RetroSkeletonComponent,
  RetroStatusBarComponent,
  RetroTagComponent,
  RetroToastComponent,
  RetroWindowComponent,
  StatBoxComponent,
  StatusDotComponent,
  StatusItem,
  StatusPillComponent,
  StatusShortcut,
  Task,
  TaskPriority,
  TaskFilterBarComponent,
  TaskRowComponent,
  TaskStats,
  TaskStatus,
  ToastService,
  ToolbarSearchComponent,
  Visibility,
  VisibilityChipComponent,
  RetroTerminalComponent,
  ApiTableComponent,
  RetroTabsComponent,
  RetroSectionComponent,
  RetroTab,
} from '../../shared/ui';
import type { TerminalCommand, TerminalLineType } from '../../shared/ui';
import { Project, ProjectStatus } from '../../models/project.model';
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
  | 'modal' | 'collapsible' | 'code'
  | 'toolbar-search' | 'project-card' | 'notif-item' | 'notif-stream'
  | 'priority-indicator' | 'visibility-chip' | 'retro-filter-bar' | 'retro-grid-row'
  | 'retro-status-bar' | 'retro-data-grid' | 'task-row' | 'retro-expandable-row' | 'retro-paginator'
  | 'project-detail-header' | 'terminal'
  | 'segmented' | 'button-group'
  | 'api-table' | 'retro-tabs' | 'retro-section'
  | 'task-filter-bar';
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
    RetroSegmentedComponent,
    RetroSelectComponent,
    RetroSkeletonComponent,
    RetroTagComponent,
    RetroToastComponent,
    RetroWindowComponent,
    StatBoxComponent,
    StatusDotComponent,
    StatusPillComponent,
    ProjectCardComponent,
    ToolbarSearchComponent,
    RetroNotifItemComponent,
    RetroNotifStreamComponent,
    PriorityIndicatorComponent,
    VisibilityChipComponent,
    RetroFilterBarComponent,
    TaskFilterBarComponent,
    RetroGridRowComponent,
    RetroStatusBarComponent,
    RetroDataGridComponent,
    RetroExpandableRowComponent,
    RetroPaginatorComponent,
    RelativeTimePipe,
    TaskRowComponent,
    ProjectDetailHeaderComponent,
    RetroTerminalComponent,
    ApiTableComponent,
    RetroTabsComponent,
    RetroSectionComponent,
  ],
  templateUrl: './ui-library-page.component.html',
  styleUrl: './ui-library-page.component.scss',
})
export class UiLibraryPageComponent implements OnInit {
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly toastService  = inject(ToastService);
  protected readonly notifService  = inject(NotifService);
  private readonly storySearchInput = viewChild<RetroInputComponent>('storySearchInput');
  private readonly previewViewportElement = viewChild<ElementRef<HTMLElement>>('previewViewportEl');
  private readonly hydrated = signal(false);
  private readonly storagePrefix = 'devboard.lib';

  protected readonly themes       = APP_THEMES;
  protected readonly currentTheme = this.themeService.currentTheme;
  protected readonly themeOptions = (() => {
    const opts: { label: string; value: string; separator?: boolean }[] = [];
    let hadDark = false;
    for (const theme of APP_THEMES) {
      if (theme.dark && !hadDark) {
        opts.push({ label: '', value: '__sep__', separator: true });
        hadDark = true;
      }
      opts.push({ label: theme.label, value: theme.name });
    }
    return opts;
  })();

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
        { id: 'win',            label: 'Window Frame' },
        { id: 'retro-section',  label: 'Section' },
        { id: 'modal',          label: 'Modal' },
        { id: 'collapsible',    label: 'Collapsible' },
      ],
    },
    {
      group: 'form',
      items: [
        { id: 'button',         label: 'Button' },
        { id: 'button-group',   label: 'Button Group' },
        { id: 'segmented',      label: 'Segmented' },
        { id: 'input',          label: 'Input' },
        { id: 'select',         label: 'Select' },
        { id: 'range',          label: 'Range' },
        { id: 'checkbox',       label: 'Checkbox' },
        { id: 'kbd',            label: 'Kbd' },
        { id: 'toolbar-search', label: 'Toolbar Search' },
      ],
    },
    {
      group: 'display',
      items: [
        { id: 'stat',      label: 'Stat Box' },
        { id: 'progress',  label: 'Progress' },
        { id: 'ascii',     label: 'Ascii Bar' },
        { id: 'code',      label: 'Code Block' },
        { id: 'api-table',   label: 'API Table' },
        { id: 'retro-tabs', label: 'Tabs' },
      ],
    },
    {
      group: 'feedback',
      items: [
        { id: 'toast',        label: 'Toast' },
        { id: 'message',      label: 'Message' },
        { id: 'skeleton',     label: 'Skeleton' },
        { id: 'notif-item',   label: 'Notif Item' },
        { id: 'notif-stream', label: 'Notif Stream' },
      ],
    },
    {
      group: 'labels',
      items: [
        { id: 'pill',               label: 'Status Pill' },
        { id: 'dot',                label: 'Status Dot' },
        { id: 'tag',                label: 'Tag' },
        { id: 'priority-indicator', label: 'Priority Indicator' },
        { id: 'visibility-chip',    label: 'Visibility Chip' },
      ],
    },
    {
      group: 'data',
      items: [
        { id: 'retro-filter-bar',    label: 'Filter Bar' },
        { id: 'task-filter-bar',     label: 'Task Filter Bar' },
        { id: 'retro-grid-row',      label: 'Grid Row' },
        { id: 'retro-expandable-row', label: 'Expandable Row' },
        { id: 'retro-paginator',     label: 'Paginator' },
        { id: 'retro-data-grid',     label: 'Data Grid' },
        { id: 'task-row',            label: 'Task Row' },
      ],
    },
    {
      group: 'shell',
      items: [
        { id: 'retro-status-bar', label: 'Status Bar' },
      ],
    },
    {
      group: 'composite',
      items: [
        { id: 'project-card',           label: 'Project Card' },
        { id: 'project-detail-header',  label: 'Project Detail Header' },
      ],
    },
    {
      group: 'interactive',
      items: [
        { id: 'terminal', label: 'Terminal' },
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
      collapsible:      'retro-collapsible.component.ts',
      code:             'retro-code.component.ts',
      'toolbar-search': 'toolbar-search.component.ts',
      'project-card':   'project-card.component.ts',
      'notif-item':             'retro-notif-item.component.ts',
      'notif-stream':           'retro-notif-stream.component.ts',
      'priority-indicator':     'priority-indicator.component.ts',
      'visibility-chip':        'visibility-chip.component.ts',
      'retro-filter-bar':       'retro-filter-bar.component.ts',
      'task-filter-bar':        'task-filter-bar.component.ts',
      'retro-grid-row':         'retro-grid-row.component.ts',
      'retro-expandable-row':   'retro-expandable-row.component.ts',
      'retro-paginator':        'retro-paginator.component.ts',
      'retro-status-bar':       'retro-status-bar.component.ts',
      'retro-data-grid':        'retro-data-grid.component.ts',
      'task-row':               'task-row.component.ts',
      'project-detail-header':  'project-detail-header.component.ts',
      'terminal':               'retro-terminal.component.ts',
      'segmented':              'retro-segmented.component.ts',
      'button-group':           'retro-button-group.component.ts',
      'api-table':              'api-table.component.ts',
      'retro-tabs':             'retro-tabs.component.ts',
      'retro-section':          'retro-section.component.ts',
    };
    return map[this.activeStory()];
  });

  protected readonly activeDocMeta = computed<StoryDocMeta>(() => {
    const docs: Record<StoryId, StoryDocMeta> = {
      win: { selector: 'app-retro-window', summary: 'Janela base para shells, painéis e blocos do design system retrô.', inputs: 11, outputs: 4, slots: 3 },
      button: { selector: 'app-retro-button', summary: 'Botão principal da biblioteca com variantes, loading e link rendering.', inputs: 7, outputs: 1, slots: 1 },
      input: { selector: 'app-retro-input', summary: 'Campo de entrada retrô com prefixo, suffix, clearable e estados visuais.', inputs: 14, outputs: 2, slots: 0 },
      select: { selector: 'app-retro-select', summary: 'Select retrô para listas pequenas e configurações rápidas do sistema.', inputs: 7, outputs: 1, slots: 0 },
      range: { selector: 'app-retro-range', summary: 'Slider retrô para ajustes de valor contínuo com feedback imediato.', inputs: 9, outputs: 1, slots: 0 },
      checkbox: { selector: 'app-retro-checkbox', summary: 'Checkbox standalone com estados checked, readonly, invalid e indeterminate.', inputs: 9, outputs: 2, slots: 0 },
      kbd: { selector: 'app-retro-kbd', summary: 'Representação visual de teclas únicas ou combos de atalhos.', inputs: 1, outputs: 0, slots: 1 },
      pill: { selector: 'app-status-pill', summary: 'Pill compacta para estados de workflow e status categóricos.', inputs: 3, outputs: 0, slots: 0 },
      dot: { selector: 'app-status-dot', summary: 'Indicador pontual de estado com opção de pulso para atividade.', inputs: 4, outputs: 0, slots: 0 },
      tag: { selector: 'app-retro-tag', summary: 'Tag textual para labels, filtros e taxonomias do projeto.', inputs: 6, outputs: 1, slots: 0 },
      stat: { selector: 'app-stat-box', summary: 'Caixa métrica para KPIs, contadores e resumos do dashboard.', inputs: 5, outputs: 0, slots: 0 },
      progress: { selector: 'app-retro-progress', summary: 'Barra de progresso com modos determinate e indeterminate.', inputs: 7, outputs: 0, slots: 0 },
      ascii: { selector: 'app-ascii-bar', summary: 'Barra em estilo terminal usando caracteres ASCII configuráveis.', inputs: 5, outputs: 0, slots: 0 },
      toast: { selector: 'app-retro-toast', summary: 'Host visual para notificações emitidas pelo ToastService.', inputs: 2, outputs: 1, slots: 0 },
      message: { selector: 'app-retro-message', summary: 'Mensagem inline com severidade, variante e fechamento opcional.', inputs: 5, outputs: 1, slots: 1 },
      skeleton: { selector: 'app-retro-skeleton', summary: 'Placeholder visual para carregamento com wave, pulse ou estado estático.', inputs: 5, outputs: 0, slots: 0 },
      modal: { selector: 'app-retro-modal', summary: 'Modal standalone com overlay, backdrop close, teclado e slots nomeados.', inputs: 6, outputs: 1, slots: 2 },
      collapsible:      { selector: 'app-retro-collapsible',   summary: 'Bloco expansível para seções de documentação e conteúdo progressivo.', inputs: 3, outputs: 1, slots: 1 },
      code:             { selector: 'app-retro-code',          summary: 'Bloco de código com linguagem, borda opcional e ação de cópia.', inputs: 3, outputs: 0, slots: 0 },
      'toolbar-search': { selector: 'app-toolbar-search',      summary: 'Campo de busca pré-configurado para toolbars — wraps RetroInput com prefix $ e clearable.', inputs: 2, outputs: 2, slots: 0 },
      'project-card':   { selector: 'app-project-card',        summary: 'Card composto de projeto — combina RetroWindow, StatusPill e métricas de tarefas. Busca language e stars via GitHub API.', inputs: 6, outputs: 0, slots: 0 },
      'notif-item':             { selector: 'app-retro-notif-item',         summary: 'Linha individual de notificação com badge de tipo, fonte, timestamp relativo e subtítulo.', inputs: 6, outputs: 1, slots: 0 },
      'notif-stream':           { selector: 'app-retro-notif-stream',        summary: 'Painel lateral de notificações com slide-in, ações em lote e projeção de NotifItem.', inputs: 1, outputs: 1, slots: 1 },
      'priority-indicator':     { selector: 'app-priority-indicator',        summary: 'Indicador de prioridade em estilo terminal: !!, !, •, · ou — por nível.', inputs: 1, outputs: 0, slots: 0 },
      'visibility-chip':        { selector: 'app-visibility-chip',           summary: 'Chip de visibilidade [PUB]/[PRIV]/[INT] com cor semântica por tipo.', inputs: 1, outputs: 0, slots: 0 },
      'retro-filter-bar':       { selector: 'app-retro-filter-bar',          summary: 'Barra de filtros genérica com single/multi-select, disabled por tab e slot [filter-end] para controles extras.', inputs: 5, outputs: 2, slots: 1 },
      'task-filter-bar':        { selector: 'app-task-filter-bar',           summary: 'Barra de abas para filtro de tarefas — botões role="tab" com contadores opcionais e active highlight.', inputs: 2, outputs: 1, slots: 0 },
      'retro-grid-row':         { selector: 'app-retro-grid-row',            summary: 'Linha genérica de grid — projeta qualquer filho como célula e herda --grid-cols.', inputs: 0, outputs: 0, slots: 1 },
      'retro-expandable-row':   { selector: 'app-retro-expandable-row',      summary: 'Linha expansível com painel de detalhe animado — herda --grid-cols e usa model(expanded).', inputs: 1, outputs: 1, slots: 2 },
      'retro-paginator':        { selector: 'app-retro-paginator',           summary: 'Barra de paginação com navegação de páginas, janela inteligente de números e seletor de page size.', inputs: 5, outputs: 2, slots: 0 },
      'retro-status-bar':       { selector: 'app-retro-status-bar',          summary: 'Barra de status fixa com versão, itens de sistema e atalhos de teclado.', inputs: 3, outputs: 0, slots: 0 },
      'retro-data-grid':        { selector: 'app-retro-data-grid',           summary: 'Grid de dados com sort, busca, filtros por checkbox, regras avançadas (column+op+value), redimensionamento de colunas e visibilidade dinâmica.', inputs: 18, outputs: 11, slots: 2 },
      'task-row':               { selector: 'app-task-row',                  summary: 'Linha de tarefa com índice, prioridade, status, título, labels, due e updated. Alinha via --grid-cols.', inputs: 1, outputs: 1, slots: 0 },
      'project-detail-header':  { selector: 'app-project-detail-header',     summary: 'Header expandido de projeto com badge, meta GitHub, tags, progress bar e stats de tarefas.', inputs: 8, outputs: 0, slots: 0 },
      'terminal':               { selector: 'app-retro-terminal',            summary: 'Terminal interativo com histórico, tab completion, typewriter, cursor de bloco e comandos registráveis.', inputs: 7, outputs: 1, slots: 0 },
      'segmented':              { selector: 'app-retro-segmented',           summary: 'Seletor segmentado compatível com CVA — alterna entre opções de texto em layout row ou col.', inputs: 3, outputs: 1, slots: 0 },
      'button-group':           { selector: 'app-retro-button-group',        summary: 'Wrapper semântico que agrupa botões adjacentes removendo bordas internas duplicadas.', inputs: 0, outputs: 0, slots: 1 },
      'api-table':              { selector: 'app-api-table',                 summary: 'Tabela de referência de API — renderiza cabeçalhos tipados (input/output/method) e projeta linhas via ng-content.', inputs: 3, outputs: 0, slots: 1 },
      'retro-tabs':             { selector: 'app-retro-tabs',                summary: 'Barra de abas estilo terminal com disabled, icon, badge por aba, navegação por teclado (← → Home End) e cinco variantes visuais.', inputs: 3, outputs: 1, slots: 1 },
      'retro-section':          { selector: 'app-retro-section',             summary: 'Contêiner estilo fieldset com label na borda — versão leve do window frame para agrupar conteúdo internamente.', inputs: 2, outputs: 0, slots: 1 },
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

  // ── Terminal ──────────────────────────────────────────────────────────────

  protected readonly termPrompt          = signal('user@devboard:~$ ');
  protected readonly termHeight          = signal('420px');
  protected readonly termTypewriterSpeed = signal(16);

  protected readonly segOptions  = signal<string[]>(['alpha', 'beta', 'gamma']);
  protected readonly segValue    = signal('alpha');
  protected readonly segDir      = signal<'row' | 'col'>('row');

  protected readonly tabsVariant      = signal<WindowVariant>('default');
  protected readonly tabsCount        = signal(3);
  protected readonly tabsActivePreview = signal('tab-0');
  protected readonly tabsDisabledIdx  = signal(-1);
  protected readonly tabsShowIcon     = signal(false);
  protected readonly tabsShowBadge    = signal(false);

  private readonly TAB_ICONS   = ['▶', '⚙', '⚠', '◈', '✦', '◉', '▣', '⬡'];
  private readonly TAB_BADGES  = [null, 3, 12, 1, null, 7, 2, 5];

  protected readonly tabsPreviewItems = computed<RetroTab[]>(() => {
    const labels = ['overview', 'source', 'config', 'output', 'tests', 'history', 'deploy', 'logs'];
    return Array.from({ length: this.tabsCount() }, (_, i) => ({
      id:       `tab-${i}`,
      label:    labels[i] ?? `tab-${i + 1}`,
      icon:     this.tabsShowIcon() ? this.TAB_ICONS[i] : undefined,
      badge:    (this.tabsShowBadge() && this.TAB_BADGES[i] != null) ? this.TAB_BADGES[i]! : undefined,
      disabled: i === this.tabsDisabledIdx(),
    }));
  });

  protected readonly tabsDisabledOptions = computed(() => [
    { label: 'nenhuma', value: '-1' },
    ...Array.from({ length: this.tabsCount() }, (_, i) => ({
      label: `tab ${i + 1}`,
      value: String(i),
    })),
  ]);

  protected readonly tabsDisabledIdxStr = computed(() => String(this.tabsDisabledIdx()));

  protected readonly tabsActiveOptions = computed(() =>
    this.tabsPreviewItems()
      .filter(t => !t.disabled)
      .map(t => ({ label: t.label, value: t.id })),
  );

  protected readonly sectionVariant = signal<WindowVariant>('default');


  protected readonly termDemoCommands: TerminalCommand[] = [
    {
      name: 'ls',
      description: 'list items in the current directory',
      run: () => [
        { type: 'stdout', text: 'projects/   tasks/   config.json   README.md' },
      ],
    },
    {
      name: 'status',
      description: 'show system service status',
      run: async () => {
        await new Promise(r => setTimeout(r, 600));
        return [
          { type: 'success', text: '● api-server     running   pid 4821  uptime 3d 14h' },
          { type: 'success', text: '● task-worker    running   pid 4822  uptime 3d 14h' },
          { type: 'warn',    text: '▲ db-primary     degraded  1 of 3 nodes responding' },
          { type: 'stderr',  text: '✗ cache-service  stopped   last exit code 1' },
        ];
      },
    },
    {
      name: 'ping',
      description: 'send ICMP packets to a host',
      usage: 'host',
      run: async (args) => {
        const host = args[0] ?? 'devboard.local';
        await new Promise(r => setTimeout(r, 350));
        return [
          { type: 'muted',  text: `PING ${host}: 56 data bytes` },
          ...Array.from({ length: 4 }, (_, i) => ({
            type: 'stdout' as TerminalLineType,
            text: `64 bytes from ${host}: icmp_seq=${i + 1} ttl=64 time=${(Math.random() * 8 + 0.4).toFixed(2)} ms`,
          })),
          { type: 'muted', text: `--- ${host} ping statistics ---` },
          { type: 'success', text: '4 packets transmitted, 4 received, 0% packet loss' },
        ];
      },
    },
    {
      name: 'tasks',
      description: 'list recent tasks',
      usage: 'status?',
      run: async (args) => {
        await new Promise(r => setTimeout(r, 280));
        const filter = args[0];
        const items = [
          { s: 'done',   id: '#042', title: 'Fix retro-select keyboard nav' },
          { s: 'doing',  id: '#043', title: 'Build retro-terminal component' },
          { s: 'review', id: '#044', title: 'Add retro-sparkline' },
          { s: 'todo',   id: '#045', title: 'Write component docs' },
          { s: 'todo',   id: '#046', title: 'Configure CI pipeline' },
        ].filter(t => !filter || t.s === filter);
        if (!items.length) return [{ type: 'muted', text: `  no tasks matching '${filter}'` }];
        const typeMap: Record<string, TerminalLineType> = {
          done: 'success', doing: 'warn', review: 'warn', todo: 'stdout',
        };
        return [
          { type: 'muted', text: '  ID      STATUS    TITLE' },
          { type: 'muted', text: '  ' + '─'.repeat(42) },
          ...items.map(t => ({
            type: typeMap[t.s] ?? 'stdout' as TerminalLineType,
            text: `  ${t.id}   ${t.s.padEnd(8)}  ${t.title}`,
          })),
        ];
      },
    },
    {
      name: 'theme',
      description: 'get or set the active UI theme',
      usage: 'name?',
      run: (args) => {
        if (args[0]) {
          return [
            { type: 'warn',   text: `switching theme to '${args[0]}'...` },
            { type: 'success', text: `theme applied: ${args[0]}` },
          ];
        }
        return [{ type: 'stdout', text: `current theme: ${this.currentTheme()}` }];
      },
    },
  ];

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
  protected readonly btnDownload  = signal('');
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
      this.btnDownload()                ? `  download="${this.btnDownload()}"` : null,
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
  protected readonly pillStatuses = ['active', 'paused', 'completed', 'archived', 'cursando'] as const;
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

  // ── Toolbar Search ───────────────────────────────────────────────────────

  protected readonly toolbarSearchValue       = signal('');
  protected readonly toolbarSearchPlaceholder = signal('search...');

  protected readonly toolbarSearchCode = computed(() =>
    [
      `<app-toolbar-search`,
      this.toolbarSearchPlaceholder() !== 'search...' ? `  placeholder="${this.toolbarSearchPlaceholder()}"` : null,
      `  [value]="searchQuery"`,
      `  (valueChange)="searchQuery = $event"`,
      `  (cleared)="searchQuery = ''"`,
      `/>`,
    ].filter(l => l !== null).join('\n'),
  );

  // ── Project Card ──────────────────────────────────────────────────────────

  protected readonly projectCardName        = signal('pg-tenant-isolator');
  protected readonly projectCardDesc        = signal('Pool de conexões PostgreSQL por tenant. Schema-per-service. Health checks nativos.');
  protected readonly projectCardStatus      = signal('active');
  protected readonly projectCardProgress    = signal(65);
  protected readonly projectCardIndex       = signal('01');
  protected readonly projectCardTags        = signal(['postgres', 'infra']);
  protected readonly projectCardSize        = signal<'sm' | 'md' | 'lg'>('md');
  protected readonly projectCardRepoUrl     = signal('https://github.com/angular/angular');
  protected readonly projectCardShowGithub  = signal(true);

  protected readonly projectCardMock = computed<Project>(() => ({
    id:            'demo',
    name:          this.projectCardName(),
    description:   this.projectCardDesc(),
    repositoryUrl: this.projectCardRepoUrl() || null,
    status:        ProjectStatus.Active,
    tags:          this.projectCardTags(),
    createdAt:     '2025-04-01',
    updatedAt:     null,
    archivedAt:    null,
  }));

  protected readonly projectCardCode = computed(() =>
    `<app-project-card\n  [project]="project"\n  indexLabel="${this.projectCardIndex()}"\n  status="${this.projectCardStatus()}"\n  [progress]="${this.projectCardProgress()}"\n  size="${this.projectCardSize()}"\n  [showGithubStats]="${this.projectCardShowGithub()}"\n/>`,
  );

  // ── Notif Item ────────────────────────────────────────────────────────────

  protected readonly notifItemNow      = new Date();
  protected readonly notifItemType     = signal<NotifType>('event');
  protected readonly notifItemSource   = signal<NotifSource>('webhook');
  protected readonly notifItemTitle    = signal('TaskCompleted → webhook slack');
  protected readonly notifItemSubtitle = signal('proj_02 · t4 entregou 200 OK em 142ms');
  protected readonly notifItemRead     = signal(false);

  protected readonly notifItemCode = computed(() =>
    [
      `<app-retro-notif-item`,
      `  type="${this.notifItemType()}"`,
      `  source="${this.notifItemSource()}"`,
      `  [timestamp]="item.timestamp"`,
      `  title="${this.notifItemTitle()}"`,
      this.notifItemSubtitle() ? `  subtitle="${this.notifItemSubtitle()}"` : null,
      this.notifItemRead()     ? `  [read]="true"` : null,
      `  (itemRead)="markRead(item.id)"`,
      `/>`,
    ].filter(l => l !== null).join('\n'),
  );

  // ── Notif Stream ──────────────────────────────────────────────────────────

  protected readonly notifStreamOpen = signal(false);

  protected readonly notifStreamCode = `<app-retro-notif-stream [open]="streamOpen" (closed)="streamOpen = false">
  @for (item of notifService.items(); track item.id) {
    <app-retro-notif-item
      [type]="item.type"
      [source]="item.source"
      [timestamp]="item.timestamp"
      [title]="item.title"
      [subtitle]="item.subtitle"
      [read]="item.read"
      (itemRead)="notifService.markRead(item.id)"
    />
  }
</app-retro-notif-stream>`;

  protected addSampleNotif(): void {
    const samples: Array<Parameters<NotifService['add']>[0]> = [
      { type: 'event', source: 'webhook', title: 'TaskCompleted → webhook slack', subtitle: 'proj_02 · t4 entregou 200 OK em 142ms' },
      { type: 'build', source: 'email',   title: 'CI: signals-kanban verde',      subtitle: 'pipeline #412 concluído em 3m 22s' },
      { type: 'alert', source: 'email',   title: 'DLQ threshold: devboard-notif', subtitle: "queue 'notif.dlq' atingiu 3 mensagens" },
    ];
    this.notifService.add(samples[this.notifService.totalCount() % samples.length]);
  }

  // ── Priority Indicator ────────────────────────────────────────────────────

  protected readonly priorityKnob = signal<Priority>('high');

  // ── Visibility Chip ───────────────────────────────────────────────────────

  protected readonly visibilityKnob = signal<Visibility>('public');

  // ── Retro Filter Bar ─────────────────────────────────────────────────────

  protected readonly filterBarActive     = signal('all');
  protected readonly filterBarMulti      = signal(false);
  protected readonly filterBarActiveKeys = signal<string[]>(['todo', 'doing']);
  protected readonly filterBarTabs: FilterTab[] = [
    { key: 'all',    label: 'ALL' },
    { key: 'todo',   label: 'TODO',   count: 2 },
    { key: 'doing',  label: 'DOING',  count: 2 },
    { key: 'review', label: 'REVIEW', count: 1 },
    { key: 'done',   label: 'DONE',   count: 3, disabled: false },
  ];

  // ── Task Filter Bar ───────────────────────────────────────────────────────

  protected readonly tfbActive = signal('all');
  protected readonly tfbTabs: FilterTab[] = [
    { key: 'all',    label: 'ALL' },
    { key: 'todo',   label: 'TODO',   count: 4 },
    { key: 'doing',  label: 'DOING',  count: 2 },
    { key: 'review', label: 'REVIEW', count: 1 },
    { key: 'done',   label: 'DONE',   count: 7 },
  ];

  // ── Retro Status Bar ──────────────────────────────────────────────────────

  protected readonly statusBarItems: StatusItem[] = [
    { label: 'YARP gateway', value: ':8080' },
    { label: 'services', value: 4 },
    { label: 'pg instances', value: 4 },
    { label: 'broker', value: 1 },
  ];
  protected readonly statusBarShortcuts: StatusShortcut[] = [
    { key: 'N', label: 'new' },
    { key: 'G', label: 'dashboard' },
    { key: 'A', label: 'arch' },
    { key: '⌘ K', label: 'search' },
  ];

  // ── Task Row & Data Grid ──────────────────────────────────────────────────

  private readonly _initialTasks: Task[] = [
    { id: 't1',  index: 1,  priority: 'critical', status: 'done',   title: 'Setup inicial do repositório',    labels: ['backend'],  dueDate: null, updatedAt: new Date(Date.now() - 86400000)   },
    { id: 't2',  index: 2,  priority: 'critical', status: 'done',   title: 'Definir contratos de API',        labels: ['backend'],  dueDate: null, updatedAt: new Date(Date.now() - 172800000)  },
    { id: 't3',  index: 3,  priority: 'high',     status: 'done',   title: 'Dockerfile + compose',            labels: ['backend'],  dueDate: null, updatedAt: new Date(Date.now() - 259200000)  },
    { id: 't4',  index: 4,  priority: 'critical', status: 'doing',  title: 'Implementar endpoint principal',  labels: ['backend'],  dueDate: null, updatedAt: new Date(Date.now() - 345600000)  },
    { id: 't5',  index: 5,  priority: 'high',     status: 'doing',  title: 'Testes unitários do domínio',     labels: ['backend'],  dueDate: null, updatedAt: new Date(Date.now() - 432000000)  },
    { id: 't6',  index: 6,  priority: 'low',      status: 'todo',   title: 'Documentação README',             labels: ['backend'],  dueDate: null, updatedAt: new Date(Date.now() - 518400000)  },
    { id: 't7',  index: 7,  priority: 'high',     status: 'todo',   title: 'CI/CD pipeline GitHub Actions',   labels: ['devops'],   dueDate: null, updatedAt: new Date(Date.now() - 604800000)  },
    { id: 't8',  index: 8,  priority: 'critical', status: 'review', title: 'Revisão de segurança',            labels: ['security'], dueDate: null, updatedAt: new Date(Date.now() - 691200000)  },
    { id: 't9',  index: 9,  priority: 'medium',   status: 'todo',   title: 'Implementar cache Redis',         labels: ['backend'],  dueDate: null, updatedAt: new Date(Date.now() - 777600000)  },
    { id: 't10', index: 10, priority: 'low',      status: 'todo',   title: 'Configurar Grafana',              labels: ['devops'],   dueDate: null, updatedAt: new Date(Date.now() - 864000000)  },
    { id: 't11', index: 11, priority: 'high',     status: 'doing',  title: 'Rate limiting no gateway',        labels: ['backend'],  dueDate: null, updatedAt: new Date(Date.now() - 950400000)  },
    { id: 't12', index: 12, priority: 'medium',   status: 'review', title: 'Adicionar testes de integração',  labels: ['qa'],       dueDate: null, updatedAt: new Date(Date.now() - 1036800000) },
    { id: 't13', index: 13, priority: 'low',      status: 'done',   title: 'Documentar endpoints OpenAPI',    labels: ['docs'],     dueDate: null, updatedAt: new Date(Date.now() - 1123200000) },
    { id: 't14', index: 14, priority: 'critical', status: 'todo',   title: 'Migração schema v2',              labels: ['backend'],  dueDate: null, updatedAt: new Date(Date.now() - 1209600000) },
    { id: 't15', index: 15, priority: 'none',     status: 'todo',   title: 'Refactor módulo de auth',         labels: ['backend'],  dueDate: null, updatedAt: new Date(Date.now() - 1296000000) },
  ];

  protected readonly demoTasksSource = signal<Task[]>([...this._initialTasks]);

  protected readonly dataGridTable = createRetroTable({
    rows: this.demoTasksSource,
    searchFields: ['title', 'status', 'priority'],
    filterFields: ['status', 'priority'],
    pageSize: 5,
    pageSizeOptions: [5, 10, 15],
  });

  protected readonly taskGridColumns: GridColumn[] = [
    { key: 'exp',     label: '',        width: '28px',            align: 'center', noResize: true },
    { key: '#',       label: '#',       width: '30px',            align: 'right',  sortable: true  },
    { key: 'pri',     label: '',        width: '28px',            align: 'center', noResize: true },
    { key: 'status',  label: 'status',  width: '80px',            sortable: true,  filterable: true },
    { key: 'title',   label: 'title',   width: 'minmax(0, 1fr)', sortable: true                   },
    { key: 'labels',  label: 'labels',  width: '110px'                                            },
    { key: 'updated', label: 'updated', width: '76px',            sortable: true                   },
    { key: 'del',     label: '',        width: '28px',            align: 'center', noResize: true },
  ];

  private _taskCounter = 16;
  private readonly _addTitles = [
    'Implementar cache Redis', 'Configurar monitoramento Grafana', 'Migração schema v3',
    'Lint e formatação do projeto', 'Rate limiting no gateway', 'Adicionar testes e2e',
    'Documentar endpoints gRPC',
  ];
  private readonly _addStatuses: Task['status'][] = ['todo', 'doing', 'review'];
  private readonly _addPriorities: Task['priority'][] = ['critical', 'high', 'medium', 'low'];

  protected addDemoTask(): void {
    const idx = this._taskCounter++;
    this.demoTasksSource.update(tasks => [...tasks, {
      id: `t${idx}`, index: idx,
      priority: this._addPriorities[idx % this._addPriorities.length],
      status:   this._addStatuses[idx % this._addStatuses.length],
      title:    this._addTitles[idx % this._addTitles.length],
      labels:   ['backend'], dueDate: null, updatedAt: new Date(),
    }]);
  }

  protected resetDemoTasks(): void {
    this.demoTasksSource.set([...this._initialTasks]);
    this.dataGridTable.clearAllFilters();
    this.dataGridTable.collapseAll();
  }

  protected deleteTask(id: string): void {
    this.demoTasksSource.update(tasks => tasks.filter(t => t.id !== id));
  }

  // ── Project Detail Header ─────────────────────────────────────────────────

  protected readonly detailBadge      = signal<ProjectBadge | null>('stable');
  protected readonly detailVisibility = signal<Visibility>('public');
  protected readonly detailProgress   = signal(75);
  protected readonly detailTaskStats  = signal<TaskStats>({ todo: 2, doing: 2, review: 1, done: 3 });

  // ── Task Row (standalone demo) ────────────────────────────────────────────

  protected readonly taskRowStatuses:  TaskStatus[]   = ['todo', 'doing', 'review', 'done'];
  protected readonly taskRowPriorities: TaskPriority[] = ['critical', 'high', 'medium', 'low', 'none'];

  protected readonly taskRowStatus   = signal<TaskStatus>('doing');
  protected readonly taskRowPriority = signal<TaskPriority>('high');
  protected readonly taskRowTitle    = signal('Implementar endpoint principal');
  protected readonly taskRowIndex    = signal(4);
  protected readonly taskRowHasDue   = signal(false);
  protected readonly taskRowLabels   = signal('backend');

  protected readonly taskRowDemoTask = computed<Task>(() => ({
    id: 'demo',
    index:    this.taskRowIndex(),
    priority: this.taskRowPriority(),
    status:   this.taskRowStatus(),
    title:    this.taskRowTitle(),
    labels:   this.taskRowLabels().split(',').map(l => l.trim()).filter(Boolean),
    dueDate:  this.taskRowHasDue() ? new Date(Date.now() + 7 * 86400000) : null,
    updatedAt: new Date(Date.now() - 345600000),
  }));

  protected readonly taskRowColumns: GridColumn[] = [
    { key: '#',       label: '#',       width: '30px',            align: 'right'  },
    { key: 'pri',     label: '',        width: '28px',            align: 'center' },
    { key: 'status',  label: 'status',  width: '76px'                             },
    { key: 'title',   label: 'title',   width: 'minmax(0, 1fr)'                   },
    { key: 'labels',  label: 'labels',  width: '130px'                            },
    { key: 'due',     label: 'due',     width: '76px'                             },
    { key: 'updated', label: 'updated', width: '76px'                             },
    { key: 'del',     label: '',        width: '28px',            align: 'center' },
  ];

  // ── Expandable Row (standalone demo) ─────────────────────────────────────

  protected readonly expandableRowExpanded    = signal(false);
  protected readonly expandableRowExpandOnClick = signal(false);

  // ── Paginator (standalone demo) ───────────────────────────────────────────

  protected readonly paginatorDemoPage     = signal(0);
  protected readonly paginatorDemoTotal    = signal(50);
  protected readonly paginatorDemoPageSize = signal(10);

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
          download: this.btnDownload(),
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
        return { language: this.codeLanguage(), framed: this.codeFramed() };
      case 'toolbar-search':
        return { placeholder: this.toolbarSearchPlaceholder() };
      case 'project-card':
        return {
          name: this.projectCardName(), desc: this.projectCardDesc(),
          status: this.projectCardStatus(), progress: this.projectCardProgress(),
          index: this.projectCardIndex(), size: this.projectCardSize(),
          repoUrl: this.projectCardRepoUrl(), showGithub: this.projectCardShowGithub(),
        };
      case 'notif-item':
        return {
          type: this.notifItemType(), source: this.notifItemSource(),
          title: this.notifItemTitle(), subtitle: this.notifItemSubtitle(),
          read: this.notifItemRead(),
        };
      case 'notif-stream':
        return {};
      case 'priority-indicator':
        return { priority: this.priorityKnob() };
      case 'visibility-chip':
        return { visibility: this.visibilityKnob() };
      case 'retro-filter-bar':
        return { active: this.filterBarActive() };
      case 'task-filter-bar':
        return { active: this.tfbActive() };
      case 'retro-grid-row':
        return {};
      case 'retro-expandable-row':
        return {};
      case 'retro-paginator':
        return {};
      case 'retro-status-bar':
        return {};
      case 'retro-data-grid':
        return {};
      case 'task-row':
        return {};
      case 'project-detail-header':
        return {
          badge: this.detailBadge(), visibility: this.detailVisibility(),
          progress: this.detailProgress(),
        };
      case 'terminal':
        return {
          prompt: this.termPrompt(),
          height: this.termHeight(),
          typewriterSpeed: this.termTypewriterSpeed(),
        };
      case 'segmented':
        return {
          options: this.segOptions(),
          value: this.segValue(),
          direction: this.segDir(),
        };
      case 'button-group':
        return {};
      case 'api-table':
        return {};
      case 'retro-tabs':
        return {
          variant:      this.tabsVariant(),
          count:        this.tabsCount(),
          disabledIdx:  this.tabsDisabledIdx(),
          showIcon:     this.tabsShowIcon(),
          showBadge:    this.tabsShowBadge(),
        };
      case 'retro-section':
        return { variant: this.sectionVariant() };

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
        if (typeof state.download === 'string') this.btnDownload.set(state.download);
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
      case 'toolbar-search':
        if (typeof state.placeholder === 'string') this.toolbarSearchPlaceholder.set(state.placeholder);
        break;
      case 'project-card':
        if (typeof state.name === 'string')     this.projectCardName.set(state.name);
        if (typeof state.desc === 'string')     this.projectCardDesc.set(state.desc);
        if (typeof state.status === 'string')   this.projectCardStatus.set(state.status);
        if (typeof state.progress === 'number') this.projectCardProgress.set(state.progress);
        if (typeof state.index === 'string')    this.projectCardIndex.set(state.index.replace(/^proj\//, ''));
        if (state.size === 'sm' || state.size === 'md' || state.size === 'lg') this.projectCardSize.set(state.size);
        if (typeof state.repoUrl === 'string')    this.projectCardRepoUrl.set(state.repoUrl);
        if (typeof state.showGithub === 'boolean') this.projectCardShowGithub.set(state.showGithub);
        break;
      case 'notif-item':
        if (state.type === 'event' || state.type === 'build' || state.type === 'alert') this.notifItemType.set(state.type);
        if (state.source === 'webhook' || state.source === 'email' || state.source === 'system') this.notifItemSource.set(state.source);
        if (typeof state.title === 'string')    this.notifItemTitle.set(state.title);
        if (typeof state.subtitle === 'string') this.notifItemSubtitle.set(state.subtitle);
        if (typeof state.read === 'boolean')    this.notifItemRead.set(state.read);
        break;
      case 'notif-stream':
        break;
      case 'priority-indicator':
        if (['critical','high','medium','low','none'].includes(state.priority)) this.priorityKnob.set(state.priority);
        break;
      case 'visibility-chip':
        if (['public','private','internal'].includes(state.visibility)) this.visibilityKnob.set(state.visibility);
        break;
      case 'retro-filter-bar':
        if (typeof state.active === 'string') this.filterBarActive.set(state.active);
        break;
      case 'task-filter-bar':
        if (typeof state.active === 'string') this.tfbActive.set(state.active);
        break;
      case 'retro-grid-row':
        break;
      case 'retro-expandable-row':
        break;
      case 'retro-paginator':
        break;
      case 'retro-status-bar':
        break;
      case 'retro-data-grid':
        break;
      case 'task-row':
        break;
      case 'project-detail-header':
        if (['stable','beta','wip','deprecated',null].includes(state.badge)) this.detailBadge.set(state.badge);
        if (['public','private','internal'].includes(state.visibility)) this.detailVisibility.set(state.visibility);
        if (typeof state.progress === 'number') this.detailProgress.set(state.progress);
        break;
      case 'terminal':
        if (typeof state.prompt === 'string') this.termPrompt.set(state.prompt);
        if (typeof state.height === 'string') this.termHeight.set(state.height);
        if (typeof state.typewriterSpeed === 'number') this.termTypewriterSpeed.set(state.typewriterSpeed);
        break;
      case 'segmented':
        if (Array.isArray(state.options) && state.options.every((o: any) => typeof o === 'string')) this.segOptions.set(state.options);
        if (typeof state.value === 'string') this.segValue.set(state.value);
        if (state.direction === 'row' || state.direction === 'col') this.segDir.set(state.direction);
        break;
      case 'button-group':
        break;
      case 'api-table':
        break;
      case 'retro-tabs':
        if (state.variant === 'default' || state.variant === 'terminal' || state.variant === 'system' || state.variant === 'alert' || state.variant === 'ghost') this.tabsVariant.set(state.variant);
        if (typeof state.count === 'number' && state.count >= 2 && state.count <= 8) this.tabsCount.set(state.count);
        if (typeof state.disabledIdx === 'number') this.tabsDisabledIdx.set(state.disabledIdx);
        if (typeof state.showIcon === 'boolean') this.tabsShowIcon.set(state.showIcon);
        if (typeof state.showBadge === 'boolean') this.tabsShowBadge.set(state.showBadge);
        break;
      case 'retro-section':
        if (state.variant === 'default' || state.variant === 'terminal' || state.variant === 'system' || state.variant === 'alert' || state.variant === 'ghost') this.sectionVariant.set(state.variant);
        break;

    }
  }
}
