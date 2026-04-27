import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  selector: 'app-retro-collapsible',
  standalone: true,
  templateUrl: './retro-collapsible.component.html',
  styleUrl: './retro-collapsible.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetroCollapsibleComponent {
  readonly title    = input.required<string>();
  readonly disabled = input(false);

  /** Two-way bindable: [(collapsed)]="mySignal" or [collapsed]="v" (collapsedChange)="v=$event" */
  readonly collapsed = model(false);

  toggle(): void {
    if (this.disabled()) return;
    this.collapsed.update((v) => !v);
  }
}
