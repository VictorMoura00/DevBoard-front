import { DatePipe, LowerCasePipe, SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { Project } from '../../../models/project.model';
import { AsciiBarComponent } from '../ascii-bar/ascii-bar.component';
import { GithubRepoService } from '../project-card/github-repo.service';
import { RetroTagComponent } from '../retro-tag/retro-tag.component';
import { RetroWindowComponent } from '../retro-window/retro-window.component';
import { StatusPillComponent } from '../status-pill/status-pill.component';
import { VisibilityChipComponent } from '../visibility-chip/visibility-chip.component';
import { Visibility } from '../visibility-chip/visibility-chip.component';
import { TaskStats } from '../task-row/task.model';

export type ProjectBadge = 'stable' | 'beta' | 'wip' | 'deprecated';

@Component({
  selector: 'app-project-detail-header',
  standalone: true,
  imports: [
    LowerCasePipe, SlicePipe, DatePipe,
    RetroWindowComponent, StatusPillComponent,
    AsciiBarComponent, RetroTagComponent, VisibilityChipComponent,
  ],
  templateUrl: './project-detail-header.component.html',
  styleUrl: './project-detail-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailHeaderComponent {
  readonly project         = input.required<Project>();
  readonly status          = input.required<string>();
  readonly badge           = input<ProjectBadge | null>(null);
  readonly visibility      = input<Visibility>('public');
  readonly taskStats       = input<TaskStats>({ todo: 0, doing: 0, review: 0, done: 0 });
  readonly progress        = input(0);
  readonly showGithubStats = input(true);
  readonly showControls    = input(false);

  private readonly github = inject(GithubRepoService);

  protected readonly repoData = computed(() =>
    this.showGithubStats() ? this.github.getRepo(this.project().repositoryUrl)() : null,
  );

  protected readonly repoSlug = computed(() => {
    const url = this.project().repositoryUrl;
    if (!url) return null;
    const match = url.match(/github\.com\/([^/\s]+\/[^/\s#?]+)/);
    return match ? match[1].replace(/\.git$/, '') : null;
  });

  protected readonly displayName = computed(() =>
    this.project().name || this.repoData()?.name || null,
  );

  protected readonly displayDescription = computed(() =>
    this.project().description || this.repoData()?.description || null,
  );

  protected readonly windowTitle = computed(() =>
    `~/devboard/${(this.displayName() ?? 'project').toLowerCase().slice(0, 14)}`,
  );

  protected readonly windowSubtitle = computed(() =>
    (this.displayName() ?? '').toUpperCase().slice(0, 22),
  );

  protected readonly badgeClass = computed(() => {
    const b = this.badge();
    return b ? `pdh__badge pdh__badge--${b}` : '';
  });

  protected readonly totalTasks = computed(() => {
    const s = this.taskStats();
    return s.todo + s.doing + s.review + s.done;
  });
}
