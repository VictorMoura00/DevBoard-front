import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { PriorityIndicatorComponent } from '../priority-indicator/priority-indicator.component';
import { RelativeTimePipe } from '../retro-notif-stream/relative-time.pipe';
import { Task, TaskStatus } from './task.model';

export const TASK_COLUMNS = [
  { key: '#',       label: '#',       width: '30px',  align: 'right'  },
  { key: 'pri',     label: '',        width: '28px',  align: 'center' },
  { key: 'status',  label: 'status',  width: '76px'                   },
  { key: 'title',   label: 'title',   width: 'minmax(0, 1fr)'         },
  { key: 'labels',  label: 'labels',  width: '130px'                  },
  { key: 'due',     label: 'due',     width: '76px'                   },
  { key: 'updated', label: 'updated', width: '76px'                   },
  { key: 'del',     label: '',        width: '28px',  align: 'center' },
] as const;

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo:   'TODO',
  doing:  'DOING',
  review: 'REVIEW',
  done:   'DONE',
};

@Component({
  selector: 'app-task-row',
  standalone: true,
  imports: [PriorityIndicatorComponent, RelativeTimePipe, DatePipe],
  templateUrl: './task-row.component.html',
  styleUrl: './task-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'row',
    '[class.is-done]': 'task().status === "done"',
  },
})
export class TaskRowComponent {
  readonly task    = input.required<Task>();
  readonly deleted = output<void>();

  protected readonly statusLabel = computed(() => STATUS_LABELS[this.task().status]);
  protected readonly indexLabel  = computed(() =>
    String(this.task().index).padStart(2, '0'),
  );
}
