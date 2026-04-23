export interface Project {
  id: string;
  name: string;
  description: string | null;
  repositoryUrl: string | null;
  status: ProjectStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string | null;
  archivedAt: string | null;
}

export enum ProjectStatus {
  Active = 0,
  Paused = 1,
  Completed = 2,
  Archived = 3,
}
