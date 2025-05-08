import { Routes } from '@angular/router';
import { UsersComponent } from './users/users.component';
import { PermissionsComponent } from './permissions/permissions.component';
import { RolesComponent } from './roles/roles.component';
import { UsermanagerComponent } from './usermanager.component';

export const usermanagerRoutes: Routes = [
  {
    path: '',
    component: UsermanagerComponent,
    children: [
      {
        path: 'users',
        component: UsersComponent,
      },
      {
        path: 'permissions',
        component: PermissionsComponent,
      },
      {
        path: 'roles',
        component: RolesComponent,
      },
    ]
  }
];
