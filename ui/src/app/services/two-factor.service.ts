import { inject, Injectable } from '@angular/core';
import { TwoFactorConfirmResponse } from '@ladon/api';
import { Observable } from 'rxjs';
import { FetchApiFactory } from './api/fetch-api.factory';

@Injectable({ providedIn: 'root' })
export class TwoFactorService {
  readonly #apiFactory = inject(FetchApiFactory);

  loadSetupQrCode(): Observable<Blob> {
    return this.#apiFactory.fromApi(() => this.#apiFactory.twoFactorAuthenticationApi.setupTwoFactorQrCode());
  }

  confirm(code: string): Observable<TwoFactorConfirmResponse> {
    return this.#apiFactory.fromApi(() =>
      this.#apiFactory.twoFactorAuthenticationApi.confirmTwoFactorAuthentication({
        twoFactorVerificationRequest: { code },
      }),
    );
  }
}
