import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { PermissionModel, RoleEntryModel, RoleWrapperModel, UserEntryModel, UserWrapperModel } from '../../api';
import { computed, inject } from '@angular/core';
import { UsermanagerService } from '../usermanager/services/usermanager.service';
import { filter, finalize, forkJoin, lastValueFrom, map, of, Subject } from 'rxjs';

type UsermanagerState = {
  users: UserEntryModel[];
  roles: RoleEntryModel[];
  permissions: PermissionModel[];
  loading: boolean;
};

const loading$ = new Subject<boolean>();

const initialState: UsermanagerState = {
  users: [],
  roles: [],
  permissions: [],
  loading: false,
};

export const UsermanagerStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ users, roles, permissions }) => ({
    usersCount: computed(() => users().length),
    rolesCount: computed(() => roles().length),
    permissionsCount: computed(() => permissions().length),
  })),
  withMethods((store, usermanagerService = inject(UsermanagerService)) => ({
    retrieveUsers() {
      patchState(store, { loading: true });
      loading$.next(store.loading());
      usermanagerService
        .retrieveUsers()
        .pipe(
          finalize(() => {
            patchState(store, { loading: false });
            loading$.next(store.loading());
          }),
        )
        .subscribe({
          next: (users) => {
            patchState(store, { users });
          },
        });
    },

    retrieveRoles() {
      patchState(store, { loading: true });
      loading$.next(store.loading());
      usermanagerService
        .retrieveRoles()
        .pipe(
          finalize(() => {
            patchState(store, { loading: false });
            loading$.next(store.loading());
          }),
        )
        .subscribe({
          next: (roles) => {
            patchState(store, { roles });
          },
        });
    },

    patchRoles(role: RoleEntryModel) {
      loading$.next(true);
      patchState(store, { roles: [...store.roles(), role] });
      loading$.next(false);
    },

    updateRole(role: { [key: string]: any }) {
      patchState(store, { loading: true });
      loading$.next(store.loading());
      const { users, permissions, id, permissionDeletions, userDeletions } = role;

      const users$ = Array.isArray(users)
        ? forkJoin(users?.map(({ id: uId }) => usermanagerService.addRoleForUser(uId, id)))
        : of([]);
      const userDeletions$ = Array.isArray(userDeletions)
        ? forkJoin(userDeletions.map(({ id: uId }) => usermanagerService.deleteRoleFromUser(uId, id)))
        : of([]);

      const permissions$ = Array.isArray(permissions)
        ? forkJoin(permissions?.map(({ permissionId }) => usermanagerService.addPermissionForRole(permissionId, id)))
        : of([]);
      const permissionDeletions$ = Array.isArray(permissionDeletions)
        ? forkJoin(
            permissionDeletions.map(({ permissionId }) =>
              usermanagerService.deletePermissionFromRole(permissionId, id),
            ),
          )
        : of([]);

      return forkJoin({
        users: users$,
        userDeletions: userDeletions$,
        permissions: permissions$,
        permissionDeletions: permissionDeletions$,
      }).pipe(
        finalize(() => {
          patchState(store, { loading: false });
          loading$.next(store.loading());
        }),
      );
    },

    retrievePermissions() {
      patchState(store, { loading: true });
      loading$.next(store.loading());
      usermanagerService
        .retrievePermissions()
        .pipe(
          finalize(() => {
            patchState(store, { loading: false });
            loading$.next(store.loading());
          }),
          // Filter out permissions without an ID
          map((permissions) => permissions.filter(({ permissionId }) => !!permissionId)),
        )
        .subscribe({
          next: (permissions) => {
            patchState(store, { permissions });
          },
        });
    },

    loading$() {
      return loading$;
    },

    getUser(id: string): UserEntryModel | undefined {
      return store.users().find((user) => user.id === id);
    },

    getRole(id: string): RoleEntryModel | undefined {
      return store.roles().find((role) => role.id === id);
    },
    addUser(user: UserWrapperModel) {
      patchState(store, { loading: true });
      usermanagerService
        .addUser(user)
        .pipe(
          finalize(() => {
            patchState(store, { loading: false });
          }),
        )
        .subscribe({
          next: () => {
            this.retrieveUsers();
          },
        });
    },

    patchUsersWithUser(user: UserEntryModel) {
      const users = store.users();
      const foundUser = users.find(({ email }) => email === user.email);
      const foundUserIndex = users.findIndex(({ email }) => email === user.email);
      users[foundUserIndex] = {
        ...foundUser,
        ...user,
      };
      patchState(store, { users });
    },

    updateUser(user: { [key: string]: any }) {
      patchState(store, { loading: true });
      loading$.next(store.loading());
      const { permissions, roles, id, permissionDeletions, roleDeletions } = user;

      const roles$ = Array.isArray(roles)
        ? forkJoin(roles?.map((role: { id: string }) => usermanagerService.addRoleForUser(id, role.id)))
        : of([]);
      const permissions$ = Array.isArray(permissions)
        ? forkJoin(
            permissions?.map((permission: { permissionId: string }) =>
              usermanagerService.addPermissionForUser(id, permission.permissionId),
            ),
          )
        : of([]);
      const roleDeletions$ = Array.isArray(roleDeletions)
        ? forkJoin(roleDeletions.map((roleId: string) => usermanagerService.deleteRoleFromUser(id, roleId)))
        : of([]);

      const permissionDeletions$ = Array.isArray(permissionDeletions)
        ? forkJoin(
            permissionDeletions.map((permissionId: string) =>
              usermanagerService.deletePermissionFromUser(id, permissionId),
            ),
          )
        : of([]);

      return forkJoin({
        user: usermanagerService.updateUser(user),
        roles: roles$,
        roleDeletions: roleDeletions$,
        permissions: permissions$,
        permissionDeletions: permissionDeletions$,
      }).pipe(
        finalize(() => {
          patchState(store, { loading: false });
          loading$.next(store.loading());
        }),
      );
    },

    async updateUserCredentials(userId: string, newPW: string) {
      patchState(store, { loading: true });
      await lastValueFrom(usermanagerService.updateUserCredentials(userId, newPW));
      patchState(store, { loading: false });
    },

    addRole(role: RoleWrapperModel) {
      patchState(store, { loading: true });
      usermanagerService
        .addRole(role)
        .pipe(
          finalize(() => {
            patchState(store, { loading: false });
          }),
        )
        .subscribe({
          next: () => {
            this.retrieveRoles();
          },
        });
    },

    addPermission(permission: PermissionModel) {
      patchState(store, { loading: true });
      usermanagerService
        .addPermission(permission)
        .pipe(
          finalize(() => {
            patchState(store, { loading: false });
          }),
        )
        .subscribe({
          next: () => {
            this.retrievePermissions();
          },
        });
    },

    deleteUser(userId: string) {
      patchState(store, { loading: true });
      usermanagerService
        .deleteUser(userId)
        .pipe(
          finalize(() => {
            patchState(store, { loading: false });
          }),
        )
        .subscribe({
          next: () => {
            this.retrieveUsers();
          },
        });
    },

    deleteRole(roleId: string) {
      patchState(store, { loading: true });
      usermanagerService
        .deleteRole(roleId)
        .pipe(
          finalize(() => {
            patchState(store, { loading: false });
          }),
        )
        .subscribe({
          next: () => {
            this.retrieveRoles();
          },
        });
    },

    deletePermission(permissionId: string) {
      patchState(store, { loading: true });
      usermanagerService
        .deletePermission(permissionId)
        .pipe(
          finalize(() => {
            patchState(store, { loading: false });
          }),
        )
        .subscribe({
          next: () => {
            this.retrievePermissions();
          },
        });
    },
  })),
);
