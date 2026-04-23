import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Project } from '../models/project.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/projects`;

  listProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.baseUrl);
  }
}
