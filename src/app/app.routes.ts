import { Routes } from '@angular/router';
import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page.component';
import { UiLibraryPageComponent } from './pages/ui-library-page/ui-library-page.component';
import { ResumePageComponent } from './pages/resume-page/resume-page.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardPageComponent,
    title: 'DevBoard | Dashboard',
  },
  {
    path: 'ui-library',
    component: UiLibraryPageComponent,
    title: 'DevBoard | UI Library',
  },
  {
    path: 'resume',
    component: ResumePageComponent,
    title: 'Victor Moura | Full Stack Developer',
  },
];
