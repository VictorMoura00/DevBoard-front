import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-box',
  standalone: true,
  templateUrl: './stat-box.component.html',
  styleUrl: './stat-box.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatBoxComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly sublabel = input('');
}
