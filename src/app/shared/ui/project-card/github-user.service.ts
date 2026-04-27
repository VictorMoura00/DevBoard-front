import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';

interface GithubUser {
  public_repos: number;
  created_at:   string;
  followers:    number;
  following:    number;
}

interface GithubRepo {
  stargazers_count: number;
}

interface GithubCommitSearch {
  total_count: number;
}

interface GithubContribResponse {
  contributions: ContributionDay[];
}

export interface ContributionDay {
  date:  string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface GithubUserStats {
  uptime:    string;
  ships:     string;
  commits:   string;
  followers: string;
  following: string;
  stars:     string;
}

@Injectable({ providedIn: 'root' })
export class GithubUserService {
  private readonly http = inject(HttpClient);

  readonly stats         = signal<GithubUserStats | null>(null);
  readonly loading       = signal(true);
  readonly contributions = signal<ContributionDay[]>([]);

  load(username: string): void {
    const user$ = this.http.get<GithubUser>(`https://api.github.com/users/${username}`)
      .pipe(catchError(() => of(null)));

    const commits$ = this.http.get<GithubCommitSearch>(
      `https://api.github.com/search/commits?q=author:${username}&per_page=1`,
    ).pipe(catchError(() => of(null)));

    const repos$ = this.http.get<GithubRepo[]>(
      `https://api.github.com/users/${username}/repos?per_page=100`,
    ).pipe(catchError(() => of(null)));

    const contribs$ = this.http.get<GithubContribResponse>(
      `https://github-contributions-api.jogruber.de/v4/${username}?y=last`,
    ).pipe(catchError(() => of(null)));

    forkJoin([user$, commits$, repos$, contribs$]).subscribe(([user, search, repos, contribs]) => {
      if (!user) { this.loading.set(false); return; }

      const days  = Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86_400_000);
      const stars = repos ? repos.reduce((s, r) => s + r.stargazers_count, 0) : 0;

      this.stats.set({
        uptime:    formatPtBr(days) + 'd',
        ships:     formatPtBr(user.public_repos),
        commits:   search ? formatPtBr(search.total_count) : '—',
        followers: formatPtBr(user.followers),
        following: formatPtBr(user.following),
        stars:     formatPtBr(stars),
      });

      if (contribs?.contributions) {
        this.contributions.set(contribs.contributions);
      }

      this.loading.set(false);
    });
  }
}

function formatPtBr(n: number): string {
  return n.toLocaleString('pt-BR');
}
