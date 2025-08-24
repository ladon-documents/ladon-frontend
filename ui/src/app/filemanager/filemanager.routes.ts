import { Routes } from '@angular/router';
import { FilemanagerComponent } from './filemanager.component';
import { FilemanagerContentComponent } from './filemanager-content/filemanager-content.component';
import { FilemanagerBucketResolver, FilemanagerFolderResolver } from './filemanager-bucket.resolver';

export const filemanagerRoutes: Routes = [
  {
    path: '',
    component: FilemanagerComponent,
    children: [
      {
        path: ':bucket',
        component: FilemanagerContentComponent,
        resolve: {
          bucket: FilemanagerBucketResolver
        },
      },
      {
        path: ':bucket/:subfolders',
        component: FilemanagerContentComponent,
        resolve: {
          subfolders: FilemanagerFolderResolver
        },
      },
    ],
  },
];
