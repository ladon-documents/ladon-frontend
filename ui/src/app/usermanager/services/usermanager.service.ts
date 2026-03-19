import { Injectable } from '@angular/core';
import {
  UsermanagerService as UsermanagerApi,
  UserWrapperModel,
  RoleEntryModel,
  RoleWrapperModel,
  PermissionModel,
} from '@ladon/api';

export interface MappedRole extends RoleEntryModel {
  active?: boolean;
}

export interface MappedPermission extends PermissionModel {
  active?: boolean;
}

export interface MappedUser extends UserWrapperModel {
  active?: boolean;
}

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

  retrieveUser(userId: string) {
    return this.usermanagerApi.getUserData(userId);
  }

  addUser(user: UserWrapperModel) {
    return this.usermanagerApi.addUser(user);
  }

  updateUser(user: { [key: string]: any }) {
    const { id, name, email, status, imageUrl } = user;
    return this.usermanagerApi.updateUser(id, { name, email, status, imageUrl } as UserWrapperModel);
  }

  updateUserCredentials(userId: string, newPW: string) {
    return this.usermanagerApi.setCredentials(userId, newPW);
  }

  addRoleForUser(userId: string, roleId: string) {
    return this.usermanagerApi.addRoleForUser(userId, roleId);
  }

  deleteRoleFromUser(userId: string, roleId: string) {
    return this.usermanagerApi.deleteRoleForUser(userId, roleId);
  }

  addPermissionForUser(userId: string, permissionId: string) {
    return this.usermanagerApi.addPermissionForUser(userId, permissionId);
  }

  addPermissionForRole(permissionId: string, roleId: string) {
    return this.usermanagerApi.addPermissionForRole(roleId, permissionId);
  }

  deletePermissionFromUser(userId: string, permissionId: string) {
    return this.usermanagerApi.removePermissionFromUser(userId, permissionId);
  }

  deletePermissionFromRole(permissionId: string, roleId: string) {
    return this.usermanagerApi.removePermissionFromRole(permissionId, roleId);
  }

  addRole(role: RoleWrapperModel) {
    return this.usermanagerApi.createRole(role);
  }

  retrievePermissionsByRole(id: string) {
    return this.usermanagerApi.getPermissionsForRole(id);
  }

  retrieveUsersByRole(id: string) {
    return this.usermanagerApi.getUsersForRole(id);
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
