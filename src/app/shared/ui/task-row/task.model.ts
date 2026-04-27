export type TaskStatus   = 'todo' | 'doing' | 'review' | 'done';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low' | 'none';

export interface Task {
  id: string;
  index: number;
  priority: TaskPriority;
  status: TaskStatus;
  title: string;
  labels: string[];
  dueDate: Date | null;
  updatedAt: Date;
}

export interface TaskStats {
  todo: number;
  doing: number;
  review: number;
  done: number;
}
