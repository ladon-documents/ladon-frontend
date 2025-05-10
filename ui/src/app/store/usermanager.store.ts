import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { UserEntryModel } from '../../api';
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
  })),
);
