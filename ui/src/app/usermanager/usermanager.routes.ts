import { Routes } from '@angular/router';
import { UsersComponent } from './users/users.component';
import { PermissionsComponent } from './permissions/permissions.component';
import { RolesComponent } from './roles/roles.component';

export const routes: Routes = [
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
];
