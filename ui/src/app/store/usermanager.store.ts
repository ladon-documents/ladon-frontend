import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { UserEntryModel, UserWrapperModel } from '../../api';
import { inject } from '@angular/core';
import { UsermanagerService } from '../usermanager/services/usermanager.service';
import { finalize } from 'rxjs';

type UsermanagerState = {
  users: UserEntryModel[];
  loading: boolean;
};

const initialState: UsermanagerState = {
  users: [],
  loading: false,
};

export const UsermanagerStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, usermanagerService = inject(UsermanagerService)) => ({
    retrieveUsers() {
      patchState(store, { loading: true });
      usermanagerService
        .retrieveUsers()
        .pipe(
          finalize(() => {
            patchState(store, { loading: false });
          }),
        )
        .subscribe({
          next: (users) => {
            patchState(store, { users });
          },
        });
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
