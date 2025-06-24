import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { RoleEntryModel, UserEntryModel, UserWrapperModel } from '../../api';
import { inject } from '@angular/core';
import { UsermanagerService } from '../usermanager/services/usermanager.service';
import { finalize, Subject } from 'rxjs';

type UsermanagerState = {
  users: UserEntryModel[];
  roles: RoleEntryModel[];
  loading: boolean;
};

const loading$ = new Subject<boolean>();

const initialState: UsermanagerState = {
  users: [],
  roles: [],
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
  })),
);
