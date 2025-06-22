import { Injectable } from '@angular/core';
import { UsermanagerService as UsermanagerApi, UserWrapperModel } from '../../../api';

@Injectable({
  providedIn: 'root',
})
export class UsermanagerService {
  constructor(private usermanagerApi: UsermanagerApi) {}

  retrieveUsers() {
    return this.usermanagerApi.getUsers();
  }

  retrieveRoles() {
    return this.usermanagerApi.getRoles();
  }

  retrievePermissions() {
    return this.usermanagerApi.getAllPermissions();
  }

  addUser(user: UserWrapperModel) {
    return this.usermanagerApi.addUser(user);
  }

  deleteUser(userId: string) {
    return this.usermanagerApi.deleteUser(userId);
  }

  deleteRole(roleId: string) {
    return this.usermanagerApi.deleteRole(roleId);
  }

  deletePermission(permissionId: string) {
    return this.usermanagerApi.removePermission(permissionId);
  }
}
