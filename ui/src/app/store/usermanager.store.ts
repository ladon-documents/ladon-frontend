import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { PermissionModel, RoleEntryModel, RoleWrapperModel, UserEntryModel, UserWrapperModel } from '../../api';
import { inject } from '@angular/core';
import { UsermanagerService } from '../usermanager/services/usermanager.service';
import { finalize, Subject } from 'rxjs';

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
