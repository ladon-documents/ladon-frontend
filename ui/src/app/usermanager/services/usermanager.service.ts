import { Injectable } from '@angular/core';
import {
  UsermanagerService as UsermanagerApi,
  UserWrapperModel,
  RoleWrapperModel,
  PermissionModel,
} from '../../../api';

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

  retrieveRoleForUser(userId: string) {
    return this.usermanagerApi.getRoleForUser(userId);
  }

  retrievePermissions() {
    return this.usermanagerApi.getAllPermissions();
  }

  retrievePermissionForUser(userId: string) {
    return this.usermanagerApi.getPermissionsForUser(userId);
  }

  addUser(user: UserWrapperModel) {
    return this.usermanagerApi.addUser(user);
  }

  addRole(role: RoleWrapperModel) {
    return this.usermanagerApi.createRole(role);
  }

  addPermission(permission: PermissionModel) {
    return this.usermanagerApi.createPermissions(permission);
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
