import { CommonModule, DatePipe, LowerCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Project } from '../../../models/project.model';
import { StatusPillComponent } from '../status-pill/status-pill.component';
import { RetroWindowComponent } from '../retro-window/retro-window.component';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [CommonModule, DatePipe, LowerCasePipe, StatusPillComponent, RetroWindowComponent],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCardComponent {
  readonly project = input.required<Project>();
  readonly indexLabel = input.required<string>();
  readonly status = input.required<string>();
  readonly progress = input.required<number>();
}
