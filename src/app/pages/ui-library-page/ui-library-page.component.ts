import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { APP_THEMES, ThemeName } from '../../core/theme/theme.model';
import { ThemeService } from '../../core/theme/theme.service';
import { ProjectStatus } from '../../models/project.model';
import {
  ProjectCardComponent,
  RetroButtonComponent,
  RetroModalComponent,
  RetroWindowComponent,
  StatBoxComponent,
  StatusPillComponent,
  ToolbarSearchComponent,
} from '../../shared/ui';

@Component({
  selector: 'app-ui-library-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProjectCardComponent,
    RetroButtonComponent,
    RetroModalComponent,
    RetroWindowComponent,
    StatBoxComponent,
    StatusPillComponent,
    ToolbarSearchComponent,
  ],
  templateUrl: './ui-library-page.component.html',
  styleUrl: './ui-library-page.component.scss',
})
export class UiLibraryPageComponent {
  private readonly themeService = inject(ThemeService);

  protected readonly themes = APP_THEMES;
  protected readonly currentTheme = this.themeService.currentTheme;
  protected readonly componentSections = [
    { id: 'actions', label: 'Actions' },
    { id: 'feedback', label: 'Feedback' },
    { id: 'content', label: 'Content' },
    { id: 'playground', label: 'Playground' },
  ];

  protected isModalOpen = false;
  protected searchPreview = '';
  protected modalTitle = 'retro-modal';
  protected modalSubtitle = 'component.preview';
  protected modalSize: 'sm' | 'md' | 'lg' = 'md';
  protected modalCloseOnBackdrop = true;
  protected modalShowCloseButton = true;
  protected modalShowActions = true;

  protected readonly sampleProject = {
    id: 'ui-library-sample',
    name: 'devboard-ui-library',
    description:
      'Catalogo interno dos componentes standalone com tokens de tema e linguagem retro.',
    repositoryUrl: 'https://github.com/victormoura/devboard',
    status: ProjectStatus.Active,
    tags: ['angular', 'ui', 'standalone'],
    createdAt: '2026-04-23T00:00:00.000Z',
    updatedAt: '2026-04-23T00:00:00.000Z',
    archivedAt: null,
  };

  protected setTheme(theme: ThemeName): void {
    this.themeService.setTheme(theme);
  }

  protected openModal(): void {
    this.isModalOpen = true;
  }

  protected closeModal(): void {
    this.isModalOpen = false;
  }
}
