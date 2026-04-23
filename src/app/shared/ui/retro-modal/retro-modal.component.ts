import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'app-retro-modal',
  standalone: true,
  templateUrl: './retro-modal.component.html',
  styleUrl: './retro-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetroModalComponent {
  readonly open = input(false);
  readonly title = input('');
  readonly subtitle = input('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly closeOnBackdrop = input(true);
  readonly showCloseButton = input(true);
  readonly closed = output<void>();

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) {
      this.closed.emit();
    }
  }

  protected onBackdropClick(): void {
    if (this.closeOnBackdrop()) {
      this.closed.emit();
    }
  }

  protected onWindowClick(event: MouseEvent): void {
    event.stopPropagation();
  }
}
