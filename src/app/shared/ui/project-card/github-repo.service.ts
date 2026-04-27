import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, inject, signal } from '@angular/core';
import { catchError, of, take } from 'rxjs';

export interface GithubRepo {
  name: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  forks_count: number;
}

@Injectable({ providedIn: 'root' })
export class GithubRepoService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, Signal<GithubRepo | null>>();

  getRepo(repositoryUrl: string | null): Signal<GithubRepo | null> {
    if (!repositoryUrl) return signal(null);

    const key = this.extractKey(repositoryUrl);
    if (!key) return signal(null);

    if (this.cache.has(key)) return this.cache.get(key)!;

    const result = signal<GithubRepo | null>(null);
    this.cache.set(key, result);

    this.http
      .get<GithubRepo>(`https://api.github.com/repos/${key}`)
      .pipe(catchError(() => of(null)), take(1))
      .subscribe(data => result.set(data));

    return result;
  }

  private extractKey(url: string): string | null {
    const match = url.match(/github\.com\/([^/\s]+\/[^/\s#?]+)/);
    return match ? match[1].replace(/\.git$/, '') : null;
  }
}
