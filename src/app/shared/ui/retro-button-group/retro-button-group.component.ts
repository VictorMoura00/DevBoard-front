import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-retro-button-group',
  standalone: true,
  template: `<div class="retro-button-group"><ng-content /></div>`,
  styleUrl: './retro-button-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetroButtonGroupComponent {}
