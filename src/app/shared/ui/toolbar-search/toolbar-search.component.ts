import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-toolbar-search',
  standalone: true,
  templateUrl: './toolbar-search.component.html',
  styleUrl: './toolbar-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarSearchComponent {
  readonly value = input('');
  readonly placeholder = input('search...');
  readonly valueChange = output<string>();

  protected onInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }
}
