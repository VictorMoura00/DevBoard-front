import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, map, Observable, of } from 'rxjs';

import { ThemeService } from '../../core/theme/theme.service';
import { ThemeName } from '../../core/theme/theme.model';
import { Project, ProjectStatus } from '../../models/project.model';
import { ProjectsApiService } from '../../services/projects-api.service';
import {
  ProjectCardComponent,
  RetroButtonComponent,
  RetroModalComponent,
  RetroWindowComponent,
  StatBoxComponent,
  ToolbarSearchComponent,
} from '../../shared/ui';

interface ActivityItem {
  title: string;
  time: string;
  tone: 'info' | 'warning' | 'success';
}

interface QueueItem {
  title: string;
  meta: string;
  state: string;
}

interface DashboardProjectsState {
  projects: Project[];
  source: 'api' | 'mock' | 'loading';
  apiOffline: boolean;
}

type DashboardTab = 'projects' | 'architecture' | 'tasks';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    ProjectCardComponent,
    RetroButtonComponent,
    RetroModalComponent,
    RetroWindowComponent,
    StatBoxComponent,
    ToolbarSearchComponent,
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent {
  private readonly projectsApi = inject(ProjectsApiService);
  private readonly themeService = inject(ThemeService);

  protected readonly now = new Date();
  protected activeTab: DashboardTab = 'projects';
  protected isCommandModalOpen = false;
  protected searchQuery = '';
  protected selectedFilter: 'all' | 'active' | 'paused' | 'completed' | 'archived' = 'all';
  protected selectedSort: 'updated' | 'name' | 'status' = 'updated';
  protected readonly availableThemes = this.themeService.themes;
  protected readonly quickQueue: QueueItem[] = [
    { title: 'Modelar CRUD de tarefas', meta: 'Tasks module', state: 'next' },
    { title: 'Criar painel de notificacoes', meta: 'Notifications module', state: 'draft' },
    { title: 'Ajustar fichas e filtros retro', meta: 'UI system', state: 'tuning' },
  ];
  protected readonly activityFeed: ActivityItem[] = [
    { title: 'Seed de projetos preparado para o dashboard', time: 'agora', tone: 'info' },
    { title: 'Canal de notificacoes entra na proxima fase da API', time: 'backlog', tone: 'warning' },
    { title: 'Conexao HTTP pronta para localhost:8080', time: 'online', tone: 'success' },
  ];
  private readonly initialProjectsState: DashboardProjectsState = {
    projects: [],
    source: 'loading',
    apiOffline: false,
  };

  private readonly fallbackProjects: Project[] = [
    {
      id: 'retro-shell',
      name: 'Retro Shell UI',
      description: 'Explorar a casca visual do dashboard com atmosfera de monitor fosforo e terminal antigo.',
      repositoryUrl: 'https://github.com/victormoura/devboard',
      status: ProjectStatus.Active,
      tags: ['ui', 'angular', 'theme'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null,
    },
    {
      id: 'task-flow',
      name: 'Tasks Flow',
      description: 'Reservado para validar fluxo completo de projeto, tarefa concluida e notificacao.',
      repositoryUrl: null,
      status: ProjectStatus.Paused,
      tags: ['tasks', 'api'],
      createdAt: new Date().toISOString(),
      updatedAt: null,
      archivedAt: null,
    },
  ];
  private readonly projectsState$: Observable<DashboardProjectsState> = this.projectsApi
    .listProjects()
    .pipe(
      map(
        (projects): DashboardProjectsState => ({
          projects,
          source: 'api',
          apiOffline: false,
        }),
      ),
      catchError(() =>
        of<DashboardProjectsState>({
          projects: this.fallbackProjects,
          source: 'mock',
          apiOffline: true,
        }),
      ),
    );

  protected readonly projectsState = toSignal(this.projectsState$, {
    initialValue: this.initialProjectsState,
  });

  protected readonly projects = computed(() => this.projectsState()?.projects ?? []);
  protected readonly filteredProjects = computed(() => {
    const query = this.searchQuery.trim().toLowerCase();
    const filtered = this.projects().filter((project) => {
      const matchesFilter =
        this.selectedFilter === 'all' || this.statusLabel(project.status) === this.selectedFilter;
      if (!matchesFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        project.name.toLowerCase().includes(query) ||
        (project.description ?? '').toLowerCase().includes(query) ||
        project.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });

    return [...filtered].sort((left, right) => {
      switch (this.selectedSort) {
        case 'name':
          return left.name.localeCompare(right.name);
        case 'status':
          return this.statusLabel(left.status).localeCompare(this.statusLabel(right.status));
        case 'updated':
        default:
          return (
            new Date(right.updatedAt ?? right.createdAt).getTime() -
            new Date(left.updatedAt ?? left.createdAt).getTime()
          );
      }
    });
  });
  protected readonly totalProjects = computed(() => this.projects().length);
  protected readonly activeProjects = computed(
    () => this.projects().filter((project) => project.status === ProjectStatus.Active).length,
  );
  protected readonly pausedProjects = computed(
    () => this.projects().filter((project) => project.status === ProjectStatus.Paused).length,
  );
  protected readonly completedProjects = computed(
    () => this.projects().filter((project) => project.status === ProjectStatus.Completed).length,
  );
  protected readonly openTasksEstimate = computed(() =>
    this.projects().reduce((total, project) => total + Math.max(2, project.tags.length * 3), 0),
  );
  protected readonly doneTasksEstimate = computed(() =>
    this.projects().reduce(
      (total, project) =>
        total +
        (project.status === ProjectStatus.Completed
          ? 18
          : project.status === ProjectStatus.Active
            ? 9
            : 4),
      0,
    ),
  );
  protected readonly dataSource = computed(() => this.projectsState()?.source ?? 'loading');
  protected readonly apiOffline = computed(() => this.projectsState()?.apiOffline ?? false);
  protected readonly currentTheme = this.themeService.currentTheme;
  protected readonly commandItems = [
    {
      kind: 'CMD',
      title: 'New project...',
      meta: 'creates a new project via projects-api',
      shortcut: '↵',
    },
    {
      kind: 'CMD',
      title: 'Go to dashboard',
      meta: '~/devboard',
      shortcut: '↵',
    },
    {
      kind: 'CMD',
      title: 'Go to architecture',
      meta: '~/devboard/infra',
      shortcut: '↵',
    },
    {
      kind: 'PROJ',
      title: 'yarp-auth-middleware',
      meta: 'Middleware de autenticacao JWT centralizada para YARP.',
      shortcut: '↵',
    },
    {
      kind: 'PROJ',
      title: 'signals-kanban',
      meta: 'Kanban Angular 21 usando Signals e drag&drop puro.',
      shortcut: '↵',
    },
  ];

  protected trackByProject(_: number, project: Project): string {
    return project.id;
  }

  protected statusLabel(status: ProjectStatus): string {
    switch (status) {
      case ProjectStatus.Active:
        return 'active';
      case ProjectStatus.Paused:
        return 'paused';
      case ProjectStatus.Completed:
        return 'completed';
      case ProjectStatus.Archived:
        return 'archived';
      default:
        return 'unknown';
    }
  }

  protected projectIndexLabel(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  protected pseudoProgress(project: Project): number {
    const total = Math.max(1, project.tags.length * 4);
    const completed =
      project.status === ProjectStatus.Completed
        ? total
        : project.status === ProjectStatus.Active
          ? Math.max(1, total - 1)
          : Math.max(1, total - 2);

    return Math.min(100, Math.round((completed / total) * 100));
  }

  protected setTheme(theme: ThemeName): void {
    this.themeService.setTheme(theme);
  }

  protected setActiveTab(tab: DashboardTab): void {
    this.activeTab = tab;
  }

  protected openCommandModal(): void {
    this.isCommandModalOpen = true;
  }

  protected closeCommandModal(): void {
    this.isCommandModalOpen = false;
  }
}
