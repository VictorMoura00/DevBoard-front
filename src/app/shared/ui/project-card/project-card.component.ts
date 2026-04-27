import { DatePipe, LowerCasePipe, SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { Project } from '../../../models/project.model';
import { StatusPillComponent } from '../status-pill/status-pill.component';
import { RetroWindowComponent } from '../retro-window/retro-window.component';
import { GithubRepoService } from './github-repo.service';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [DatePipe, LowerCasePipe, SlicePipe, StatusPillComponent, RetroWindowComponent],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-size]': 'size()' },
})
export class ProjectCardComponent {
  readonly project        = input.required<Project>();
  readonly indexLabel     = input.required<string>();
  readonly status         = input.required<string>();
  readonly progress       = input.required<number>();
  readonly size           = input<'sm' | 'md' | 'lg'>('md');
  readonly showGithubStats = input(true);

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
}
