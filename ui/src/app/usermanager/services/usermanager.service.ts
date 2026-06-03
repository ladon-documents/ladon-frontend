import { Injectable } from '@angular/core';
import { from } from 'rxjs';
import {
  UserWrapperModel,
  RoleEntryModel,
  RoleWrapperModel,
  PermissionModel,
} from '@ladon/api';
import { FetchApiFactory } from '../../services/api/fetch-api.factory';

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
  constructor(private apiFactory: FetchApiFactory) {}

  retrieveUsers() {
    return from(this.apiFactory.usermanagerApi.getUsers());
  }

  retrieveRoles() {
    return from(this.apiFactory.usermanagerApi.getRoles());
  }

  retrieveRoleForUser(userId: string) {
    return from(
      this.apiFactory.usermanagerApi.getRoleForUser({
        userId,
      }),
    );
  }

  retrievePermissions() {
    return from(this.apiFactory.usermanagerApi.getAllPermissions());
  }

  retrievePermissionForUser(userId: string) {
    return from(
      this.apiFactory.usermanagerApi.getPermissionsForUser({
        userId,
      }),
    );
  }

  retrieveUser(userId: string) {
    return from(
      this.apiFactory.usermanagerApi.getUserData({
        userId,
      }),
    );
  }

  addUser(user: UserWrapperModel) {
    return from(
      this.apiFactory.usermanagerApi.addUser({
        userWrapper: user as any,
      }),
    );
  }

  updateUser(user: { [key: string]: any }) {
    const { id, name, email, status, imageUrl } = user;
    return from(
      this.apiFactory.usermanagerApi.updateUser({
        userId: id,
        userDataWrapper: { name, email, status, imageUrl } as any,
      }),
    );
  }

  updateUserCredentials(userId: string, newPW: string) {
    return from(
      this.apiFactory.usermanagerApi.setCredentials({
        userId,
        body: newPW,
      }),
    );
  }

  addRoleForUser(userId: string, roleId: string) {
    return from(
      this.apiFactory.usermanagerApi.addRoleForUser({
        userId,
        roleId,
      }),
    );
  }

  deleteRoleFromUser(userId: string, roleId: string) {
    return from(
      this.apiFactory.usermanagerApi.deleteRoleForUser({
        userId,
        roleId,
      }),
    );
  }

  addPermissionForUser(userId: string, permissionId: string) {
    return from(
      this.apiFactory.usermanagerApi.addPermissionForUser({
        userId,
        permissionId,
      }),
    );
  }

  addPermissionForRole(permissionId: string, roleId: string) {
    return from(
      this.apiFactory.usermanagerApi.addPermissionForRole({
        roleId,
        permissionId,
      }),
    );
  }

  deletePermissionFromUser(userId: string, permissionId: string) {
    return from(
      this.apiFactory.usermanagerApi.removePermissionFromUser({
        userId,
        permissionId,
      }),
    );
  }

  deletePermissionFromRole(permissionId: string, roleId: string) {
    return from(
      this.apiFactory.usermanagerApi.removePermissionFromRole({
        permissionId,
        roleId,
      }),
    );
  }

  addRole(role: RoleWrapperModel) {
    return from(
      this.apiFactory.usermanagerApi.createRole({
        roleWrapper: role as any,
      }),
    );
  }

  retrievePermissionsByRole(id: string) {
    return from(
      this.apiFactory.usermanagerApi.getPermissionsForRole({
        roleId: id,
      }),
    );
  }

  retrieveUsersByRole(id: string) {
    return from(
      this.apiFactory.usermanagerApi.getUsersForRole({
        roleId: id,
      }),
    );
  }

  addPermission(permission: PermissionModel) {
    return from(
      this.apiFactory.usermanagerApi.createPermissions({
        ladonPermission: permission as any,
      }),
    );
  }

  deleteUser(userId: string) {
    return from(
      this.apiFactory.usermanagerApi.deleteUser({
        userId,
      }),
    );
  }

  deleteRole(roleId: string) {
    return from(
      this.apiFactory.usermanagerApi.deleteRole({
        roleId,
      }),
    );
  }

  deletePermission(permissionId: string) {
    return from(
      this.apiFactory.usermanagerApi.removePermission({
        permissionId,
      }),
    );
  }
}
