import { Routes } from '@angular/router';
import { UsersComponent } from './users/users.component';
import { PermissionsComponent } from './permissions/permissions.component';
import { RolesComponent } from './roles/roles.component';
import { UsermanagerComponent } from './usermanager.component';
import { UserDetailsComponent } from './users/user-details.component';
import { environment } from '../../environments/environment';

export const usermanagerRoutes: Routes = [
  {
    path: '',
    component: UsermanagerComponent,
    children: [
      {
        path: 'users',
        component: UsersComponent,
        children: [
          {
            path: ':id',
            component: UserDetailsComponent,
          },
        ],
      },
      {
        path: 'permissions',
        component: PermissionsComponent,
      },
      {
        path: 'roles',
        component: RolesComponent,
      },
    ],
  },
  { path: '', redirectTo: `${environment.baseHref}/usermanager`, pathMatch: 'full' },

];
