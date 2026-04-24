import { ChangeDetectionStrategy, Component, OnInit, input, signal } from '@angular/core';

@Component({
  selector: 'app-retro-collapsible',
  standalone: true,
  templateUrl: './retro-collapsible.component.html',
  styleUrl: './retro-collapsible.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetroCollapsibleComponent implements OnInit {
  readonly title = input.required<string>();
  readonly initialCollapsed = input(false);

  protected readonly collapsed = signal(false);

  ngOnInit(): void {
    this.collapsed.set(this.initialCollapsed());
  }

  protected toggle(): void {
    this.collapsed.update((v) => !v);
  }
}
