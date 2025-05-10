import { Routes } from '@angular/router';
import { FilemanagerComponent } from './filemanager.component';
import { FilemanagerContentComponent } from './filemanager-content/filemanager-content.component';

export const filemanagerRoutes: Routes = [
  {
    path: '',
    component: FilemanagerComponent,
    children: [
      {
        path: ':bucket',
        component: FilemanagerContentComponent,
      },
    ],
  },
];
