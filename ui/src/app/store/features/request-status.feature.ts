import { signalStoreFeature, withState, withComputed, patchState } from '@ngrx/signals';
import { computed } from '@angular/core';

export type RequestStatus = 'idle' | 'loading' | 'fulfilled' | { error: string };

export function withRequestStatus() {
  return signalStoreFeature(
    withState({ requestStatus: 'idle' as RequestStatus }),
    withComputed(({ requestStatus }) => ({
      isLoading: computed(() => requestStatus() === 'loading'),
      isIdle: computed(() => requestStatus() === 'idle'),
      isFulfilled: computed(() => requestStatus() === 'fulfilled'),
      error: computed(() =>
        typeof requestStatus() === 'object' ? (requestStatus() as { error: string }).error : null,
      ),
      hasError: computed(() => typeof requestStatus() === 'object'),
    })),
  );
}

// Hilfsfunktionen für einfacheres patchState
export const requestStatusHelpers = {
  setLoading: () => ({ requestStatus: 'loading' as RequestStatus }),
  setFulfilled: () => ({ requestStatus: 'fulfilled' as RequestStatus }),
  setError: (error: string) => ({ requestStatus: { error } as RequestStatus }),
  setIdle: () => ({ requestStatus: 'idle' as RequestStatus }),
};
