import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';

import { APP_THEMES } from '../../core/theme/theme.model';
import { ThemeService } from '../../core/theme/theme.service';
import { GithubUserService, ContributionDay } from '../../shared/ui/project-card/github-user.service';
import {
  RetroButtonComponent,
  RetroDataGridComponent,
  RetroGridRowComponent,
  RetroRangeComponent,
  RetroStatusBarComponent,
  RetroTagComponent,
  RetroTerminalComponent,
  RetroWindowComponent,
  StatusDotComponent,
  StatusPillComponent,
  StatusItem,
  createRetroTable,
  type GridColumn,
} from '../../shared/ui';
import type { TerminalCommand, TerminalOutputLine } from '../../shared/ui';
import { ResumeNowPlayingComponent } from './ui/resume-now-playing/resume-now-playing.component';

export type ResumeTab = 'about' | 'experience' | 'projects';

function out(text: string, type: TerminalOutputLine['type'] = 'stdout'): TerminalOutputLine {
  return { type, text };
}

function calcDuration(startYearMonth: string, endYearMonth?: string): string {
  const [sy, sm] = startYearMonth.split('-').map(Number);
  const end = endYearMonth ? new Date(endYearMonth + '-01') : new Date();
  const totalMonths = (end.getFullYear() - sy) * 12 + (end.getMonth() + 1 - sm);
  const years  = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  if (months === 0) return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  return `${years} ${years === 1 ? 'ano' : 'anos'} e ${months} ${months === 1 ? 'mês' : 'meses'}`;
}

@Component({
  selector: 'app-resume-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    RetroWindowComponent,
    RetroButtonComponent,
    RetroRangeComponent,
    RetroTagComponent,
    RetroTerminalComponent,
    RetroStatusBarComponent,
    RetroDataGridComponent,
    RetroGridRowComponent,
    StatusDotComponent,
    StatusPillComponent,
    ResumeNowPlayingComponent,
  ],
  templateUrl: './resume-page.component.html',
  styleUrl: './resume-page.component.scss',
})
export class ResumePageComponent implements OnInit, OnDestroy {
  private readonly themeService  = inject(ThemeService);
  private readonly router        = inject(Router);
  private readonly githubUser    = inject(GithubUserService);

  protected readonly themes        = APP_THEMES;
  protected readonly currentTheme  = this.themeService.currentTheme;
  protected readonly activeTab     = signal<ResumeTab>('about');
  protected readonly githubStats    = this.githubUser.stats;
  protected readonly githubLoading  = this.githubUser.loading;
  protected readonly githubContribs = this.githubUser.contributions;

  protected readonly contributionWeeks = computed<ContributionDay[][]>(() => {
    const days = this.githubContribs();
    const weeks: ContributionDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  });

  protected readonly contribTotal = computed(() =>
    this.githubContribs().reduce((s, d) => s + d.count, 0),
  );

  protected readonly contribMonths = computed<{ label: string; col: number }[]>(() => {
    const weeks = this.contributionWeeks();
    const result: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      if (week.length > 0) {
        const d = new Date(week[0].date + 'T12:00:00');
        const m = d.getMonth();
        if (m !== lastMonth) {
          result.push({
            label: d.toLocaleString('pt-BR', { month: 'short' }).replace('.', ''),
            col: i,
          });
          lastMonth = m;
        }
      }
    });
    return result;
  });

  protected readonly heroX     = signal(0);
  protected readonly heroY     = signal(0);
  protected readonly heroHover = signal(false);
  protected readonly heroStyle = computed(() => ({
    '--mx': this.heroX() + 'px',
    '--my': this.heroY() + 'px',
  }));

  protected readonly audioPlaying  = signal(false);
  protected readonly audioVolume   = signal(0.12);
  protected readonly audioProgress = signal(0);

  private bgAudio:    HTMLAudioElement | null = null;
  private progressId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.githubUser.load('VictorMoura00');
    this.initAudio();
  }

  ngOnDestroy(): void {
    this.bgAudio?.pause();
    this.bgAudio = null;
    if (this.progressId) clearInterval(this.progressId);
  }

  private initAudio(): void {
    const audio = new Audio('/ambient.mp3');
    audio.volume = this.audioVolume();
    audio.loop   = true;

    this.progressId = setInterval(() => {
      if (audio.duration > 0) {
        this.audioProgress.set((audio.currentTime / audio.duration) * 100);
      }
    }, 500);

    audio.play()
      .then(() => this.audioPlaying.set(true))
      .catch(() => {
        const unlock = () => {
          audio.play().then(() => this.audioPlaying.set(true));
        };
        document.addEventListener('click',   unlock, { once: true });
        document.addEventListener('keydown', unlock, { once: true });
      });
    this.bgAudio = audio;
  }

  protected togglePlay(): void {
    if (!this.bgAudio) return;
    if (this.audioPlaying()) {
      this.bgAudio.pause();
      this.audioPlaying.set(false);
    } else {
      this.bgAudio.play().then(() => this.audioPlaying.set(true));
    }
  }

  protected setVolume(v: number): void {
    this.audioVolume.set(v);
    if (this.bgAudio) this.bgAudio.volume = v;
  }

  protected readonly navItems: { id: ResumeTab; label: string }[] = [
    { id: 'about',      label: './about'      },
    { id: 'experience', label: './experience'  },
    { id: 'projects',   label: './projects'    },
  ];

  protected readonly statusItems = computed<StatusItem[]>(() => {
    const s = this.githubStats();
    return [
      { label: 'uptime',  value: s ? s.uptime  : '...' },
      { label: 'ships',   value: s ? s.ships   : '...' },
      { label: 'commits', value: s ? s.commits : '...' },
    ];
  });

  protected readonly techGroups: { label: string; tags: string[] }[] = [
    { label: 'backend',  tags: ['C#', '.NET 8', 'ASP.NET Core', 'Entity Framework', 'Dapper'] },
    { label: 'database', tags: ['SQL Server', 'PostgreSQL', 'Redis', 'T-SQL'] },
    { label: 'erp',      tags: ['ADVPL', 'Totvs Protheus', 'ERP Integration', 'BI Reports'] },
    { label: 'frontend', tags: ['Angular 21', 'TypeScript', 'RxJS', 'SCSS', 'HTML5'] },
    { label: 'devops',   tags: ['Git', 'GitHub Actions', 'Azure DevOps', 'Docker', 'CI/CD'] },
    { label: 'testing',  tags: ['E2E', 'Playwright', 'Jest', 'Usability Testing'] },
  ];

  protected readonly experience = [
    {
      path:     'AMVOX/DESENVOLVEDOR_FULL_STACK.LOG',
      company:  'Amvox',
      role:     'Desenvolvedor Full Stack',
      type:     'Tempo integral',
      duration: calcDuration('2024-05'),
      period:   'Mai 2024 → Atual',
      location: 'Camaçari, BA',
      mode:     'No local',
      stack:    ['C#', '.NET 8', 'SQL Server', 'ADVPL', 'Angular 21', 'TypeScript', 'RxJS'],
      items: [
        'Desenvolvimento de APIs .NET de alta performance para integração com módulos ERP',
        'Automação de processos manuais com ADVPL no Totvs Protheus',
        'Manutenção e evolução de sistemas legados em C# / SQL Server',
        'Integração entre módulos financeiros, fiscais e operacionais',
      ],
    },
    {
      path:     'AMVOX/ESTAGIÁRIO.LOG',
      company:  'Amvox',
      role:     'Estagiário',
      type:     'Tempo integral',
      duration: calcDuration('2023-08', '2024-04'),
      period:   'Ago 2023 → Abr 2024',
      location: 'Camaçari, BA',
      mode:     'No local',
      stack:    ['Angular', 'TypeScript', 'SQL', 'Playwright'],
      items: [
        'Escrita de testes E2E e condução de sessões de usabilidade',
        'Desenvolvimento frontend com Angular e RxJS',
        'Queries SQL complexas para relatórios e dashboards',
        'Participação em cerimônias ágeis e refinamento de backlog',
      ],
    },
  ];

  protected readonly courseColumns: GridColumn[] = [
    { key: 'id',         label: '#',          width: '40px',   align: 'center',  noResize: true                                   },
    { key: 'name',       label: 'curso',      width: 'minmax(0,1fr)',             sortable: true                                   },
    { key: 'instructor', label: 'instrutor',  width: '190px',  align: 'center',  sortable: true, filterable: true                 },
    { key: 'platform',   label: 'plataforma', width: '150px',  align: 'center',  sortable: true, filterable: true,
      filterOptions: ['Udemy', 'Atilio Sistemas', 'Green Tecnologia']                                                              },
    { key: 'status',     label: 'status',     width: '115px',  align: 'center',  noResize: true                                   },
  ];

  private readonly courseRows = [
    { name: 'Curso Web API ASP .NET Core Essencial (.NET 8 / .NET 9)', instructor: 'Jose Carlos Macoratti', platform: 'Udemy'           },
    { name: 'API Restful Javascript com Node.js, Typescript, TypeORM', instructor: 'Jorge Aluizio de Souza', platform: 'Udemy'          },
    { name: 'NodeJs Avançado com Clean Architecture, NestJS e Typescript', instructor: 'Jorge Aluizio de Souza', platform: 'Udemy'      },
    { name: 'Programando em ADVPL — Aprenda do Zero',                  instructor: 'RCTI Treinamentos',       platform: 'Udemy'          },
    { name: 'React Js com TypeScript do zero ao avançado na pratica',  instructor: 'Matheus Fraga',           platform: 'Udemy'          },
    { name: 'Postman: Do Zero ao Avançado + Testes Automatizados',     instructor: 'Leonardo Adonis',         platform: 'Udemy'          },
    { name: 'Curso C# Essencial (.NET 9.0, LINQ e IA)',                instructor: 'Jose Carlos Macoratti',   platform: 'Udemy'          },
    { name: 'Módulo Configurador Protheus (SIGACFG)',                   instructor: 'Atilio Sistemas',         platform: 'Atilio Sistemas'},
    { name: 'Instalação e Arquitetura do TOTVS Protheus',              instructor: 'Atilio Sistemas',         platform: 'Atilio Sistemas'},
    { name: 'Introdução ao Angular',                                   instructor: 'Atilio Sistemas',         platform: 'Atilio Sistemas'},
    { name: 'MS — Power Automate',                                     instructor: 'Green Tecnologia',        platform: 'Green Tecnologia'},
  ];

  protected readonly courseTable = createRetroTable({
    rows:         () => this.courseRows,
    searchFields: ['name', 'instructor'],
    filterFields: ['platform', 'instructor'],
  });

  protected readonly projects = [
    {
      name:    'DevBoard',
      desc:    'Plataforma de gestão de projetos com design system retrô/terminal — dashboard, UI library e currículo interativo.',
      stack:   ['Angular 21', '.NET', 'SCSS', 'Signals'],
      status:  'em desenvolvimento',
      link:    'github.com/victormoura/devboard',
    },
    {
      name:    'ERP Integration Layer',
      desc:    'Camada de integração entre módulos Protheus e sistemas externos via REST API e filas de eventos.',
      stack:   ['C#', '.NET 8', 'ADVPL', 'SQL Server', 'RabbitMQ'],
      status:  'produção',
      link:    '',
    },
    {
      name:    'Automation Toolkit',
      desc:    'Conjunto de scripts e rotinas ADVPL para automação de processos manuais no Totvs Protheus.',
      stack:   ['ADVPL', 'SQL', 'Protheus'],
      status:  'produção',
      link:    '',
    },
    {
      name:    'Analytics Dashboard',
      desc:    'Dashboard de KPIs operacionais com consultas SQL otimizadas e renderização Angular.',
      stack:   ['Angular', 'TypeScript', 'SQL Server', 'SCSS'],
      status:  'entregue',
      link:    '',
    },
  ];

  protected readonly terminalGreeting: string[] = [
    ' _   _  _        _                  __  __',
    '| | | |(_)  ___ | |_  ___   _ __  |  \\/  |  ___   _   _  _ __  __ _',
    "| | | || | / __|| __|/ _ \\ | '__| | |\\/| | / _ \\ | | | || '__|/ _` |",
    '| |_| || || (__ | |_| (_) || |    | |  | || (_) || |_| || |  | (_| |',
    " \\___/ |_| \\___| \\__|\\___/ |_|    |_|  |_| \\___/  \\__,_||_|   \\__,_|",
    '',
    'Victor Moura · Full Stack Developer · Camaçari/BA · BR',
    "digite 'help' para ver comandos disponíveis",
    '',
  ];

  protected readonly terminalCommands: TerminalCommand[] = [
    {
      name: 'whoami',
      description: 'exibe informações do usuário',
      run: () => [
        out('Victor Gabriel de Jesus Moura'),
        out('role:   Desenvolvedor Full Stack'),
        out('loc:    Camaçari · Bahia · BR'),
        out('uid:    1001 · gid: dev · shell: /bin/zsh'),
        out('status: aberto a oportunidades', 'success'),
      ],
    },
    {
      name: 'skills',
      description: 'lista habilidades técnicas',
      run: () => [
        out('> backend:   C# · .NET 8 · ASP.NET Core · EF Core · Dapper'),
        out('> database:  SQL Server · PostgreSQL · Redis · T-SQL'),
        out('> erp:       ADVPL · Totvs Protheus · ERP Integration'),
        out('> frontend:  Angular 21 · TypeScript · RxJS · SCSS'),
        out('> devops:    Git · GitHub Actions · Azure DevOps · Docker'),
        out('> testing:   E2E · Playwright · Jest · Usability Testing'),
      ],
    },
    {
      name: 'experience',
      description: 'exibe histórico de trabalho',
      run: () => [
        out('[2023 → presente] Desenvolvedor Full Stack · Empresa Atual', 'muted'),
        out('  › APIs .NET de alta performance'),
        out('  › Integração ERP ADVPL/Protheus'),
        out('  › Automação de processos manuais'),
        out(''),
        out('[2021 → 2023] Desenvolvedor Júnior · Empresa Anterior', 'muted'),
        out('  › Testes E2E e sessões de usabilidade'),
        out('  › Angular + RxJS + SQL pesado'),
        out('  › Relatórios e dashboards'),
      ],
    },
    {
      name: 'contact',
      description: 'exibe informações de contato',
      run: () => [
        out('email:    victormoura@proton.me'),
        out('github:   github.com/VictorMoura00'),
        out('linkedin: linkedin.com/in/victor-moura'),
        out('loc:      Camaçari · Bahia · BR'),
      ],
    },
    {
      name: 'open',
      description: 'navega para uma seção  [about|experience|skills|projects|contact]',
      run: (args) => {
        const valid: ResumeTab[] = ['about', 'experience', 'projects'];
        const target = args[0] as ResumeTab;
        if (valid.includes(target)) {
          this.activeTab.set(target);
          return [out(`navegando para ./${target}...`, 'muted'), out('ok', 'success')];
        }
        return [
          out(`seção desconhecida: ${args[0] ?? ''}`, 'stderr'),
          out('uso: open [about|experience|projects]', 'warn'),
        ];
      },
    },
    {
      name: 'back',
      description: 'volta para o dashboard',
      run: () => {
        this.router.navigate(['/']);
        return [out('redirecionando para /dashboard...', 'muted')];
      },
    },
  ];

  protected onHeroMove(e: MouseEvent): void {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    this.heroX.set(e.clientX - rect.left);
    this.heroY.set(e.clientY - rect.top);
    if (!this.heroHover()) this.heroHover.set(true);
  }

  protected setTheme(name: string): void {
    this.themeService.setTheme(name as any);
  }
}
