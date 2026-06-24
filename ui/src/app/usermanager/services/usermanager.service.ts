import { Injectable } from '@angular/core';
import { Permission, RoleEntry, RoleWrapper, UserEntry, UserWrapper } from '@ladon/api';
import { FetchApiFactory } from '../../services/api/fetch-api.factory';

export interface MappedRole extends RoleEntry {
  active?: boolean;
}

export interface MappedPermission extends Permission {
  active?: boolean;
}

export interface MappedUser extends UserEntry {
  active?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UsermanagerService {
  constructor(private apiFactory: FetchApiFactory) {}

  retrieveUsers() {
    return this.apiFactory.fromApi(() => this.apiFactory.usermanagerApi.getUsers());
  }

  retrieveRoles() {
    return this.apiFactory.fromApi(() => this.apiFactory.usermanagerApi.getRoles());
  }

  retrieveRoleForUser(userId: string) {
    return this.apiFactory.fromApi(() =>
      this.apiFactory.usermanagerApi.getRoleForUser({
        userId,
      }),
    );
  }

  retrievePermissions() {
    return this.apiFactory.fromApi(() => this.apiFactory.usermanagerApi.getAllPermissions());
  }

  retrievePermissionForUser(userId: string) {
    return this.apiFactory.fromApi(() =>
      this.apiFactory.usermanagerApi.getPermissionsForUser({
        userId,
      }),
    );
  }

  retrieveUser(userId: string) {
    return this.apiFactory.fromApi(() =>
      this.apiFactory.usermanagerApi.getUserData({
        userId,
      }),
    );
  }

  addUser(user: UserWrapper) {
    return this.apiFactory.fromApi(() =>
      this.apiFactory.usermanagerApi.addUser({
        userWrapper: user as any,
      }),
    );
  }

  updateUser(user: { [key: string]: any }) {
    const { id, name, email, status, imageUrl } = user;
    return this.apiFactory.fromApi(() =>
      this.apiFactory.usermanagerApi.updateUser({
        userId: id,
        userDataWrapper: { name, email, status, imageUrl } as any,
      }),
    );
  }

  updateUserCredentials(userId: string, newPW: string) {
    return this.apiFactory.fromApi(() =>
      this.apiFactory.usermanagerApi.setCredentials({
        userId,
        body: newPW,
      }),
    );
  }

  addRoleForUser(userId: string, roleId: string) {
    return this.apiFactory.fromApi(() =>
      this.apiFactory.usermanagerApi.addRoleForUser({
        userId,
        roleId,
      }),
    );
  }

  deleteRoleFromUser(userId: string, roleId: string) {
    return this.apiFactory.fromApi(() =>
      this.apiFactory.usermanagerApi.deleteRoleForUser({
        userId,
        roleId,
      }),
    );
  }

  addPermissionForUser(userId: string, permissionId: string) {
    return this.apiFactory.fromApi(() =>
      this.apiFactory.usermanagerApi.addPermissionForUser({
        userId,
        permissionId,
      }),
    );
  }

  addPermissionForRole(permissionId: string, roleId: string) {
    return this.apiFactory.fromApi(() =>
      this.apiFactory.usermanagerApi.addPermissionForRole({
        roleId,
        permissionId,
      }),
    );
  }

  deletePermissionFromUser(userId: string, permissionId: string) {
    return this.apiFactory.fromApi(() =>
      this.apiFactory.usermanagerApi.removePermissionFromUser({
        userId,
        permissionId,
      }),
    );
  }

  deletePermissionFromRole(permissionId: string, roleId: string) {
    return this.apiFactory.fromApi(() =>
      this.apiFactory.usermanagerApi.removePermissionFromRole({
        permissionId,
        roleId,
      }),
    );
  }

  addRole(role: RoleWrapper) {
    return this.apiFactory.fromApi(() =>
      this.apiFactory.usermanagerApi.createRole({
        roleWrapper: role as any,
      }),
    );
  }

  retrievePermissionsByRole(id: string) {
    return this.apiFactory.fromApi(() =>
      this.apiFactory.usermanagerApi.getPermissionsForRole({
        roleId: id,
      }),
    );
  }

  retrieveUsersByRole(id: string) {
    return this.apiFactory.fromApi(() =>
      this.apiFactory.usermanagerApi.getUsersForRole({
        roleId: id,
      }),
    );
  }

  addPermission(permission: Permission) {
    return this.apiFactory.fromApi(() =>
      this.apiFactory.usermanagerApi.createPermissions({
        ladonPermission: permission as any,
      }),
    );
  }

  deleteUser(userId: string) {
    return this.apiFactory.fromApi(() =>
      this.apiFactory.usermanagerApi.deleteUser({
        userId,
      }),
    );
  }

  deleteRole(roleId: string) {
    return this.apiFactory.fromApi(() =>
      this.apiFactory.usermanagerApi.deleteRole({
        roleId,
      }),
    );
  }

  deletePermission(permissionId: string) {
    return this.apiFactory.fromApi(() =>
      this.apiFactory.usermanagerApi.removePermission({
        permissionId,
      }),
    );
  }
}
