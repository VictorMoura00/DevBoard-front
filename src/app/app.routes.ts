import { Routes } from '@angular/router';
import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page.component';
import { UiLibraryPageComponent } from './pages/ui-library-page/ui-library-page.component';

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
];
