import { TestBed } from '@angular/core/testing';
import { fetchClient, TwoFactorConfirmResponse } from '@ladon/api';
import { defer, firstValueFrom } from 'rxjs';
import { FetchApiError, FetchApiFactory } from './api/fetch-api.factory';
import { TwoFactorService } from './two-factor.service';

describe('TwoFactorService', () => {
  let service: TwoFactorService;
  let apiFactory: jasmine.SpyObj<FetchApiFactory>;
  let twoFactorAuthenticationApi: jasmine.SpyObj<fetchClient.TwoFactorAuthenticationApi>;

  beforeEach(() => {
    twoFactorAuthenticationApi = jasmine.createSpyObj<fetchClient.TwoFactorAuthenticationApi>(
      'TwoFactorAuthenticationApi',
      ['setupTwoFactorQrCode', 'confirmTwoFactorAuthentication'],
    );
    apiFactory = jasmine.createSpyObj<FetchApiFactory>('FetchApiFactory', ['fromApi'], {
      twoFactorAuthenticationApi,
    });
    apiFactory.fromApi.and.callFake((request) => defer(request));

    TestBed.configureTestingModule({
      providers: [TwoFactorService, { provide: FetchApiFactory, useValue: apiFactory }],
    });
    service = TestBed.inject(TwoFactorService);
  });

  it('loads the setup QR code through the API factory and preserves the PNG blob', async () => {
    const qrCode = new Blob(['png'], { type: 'image/png' });
    twoFactorAuthenticationApi.setupTwoFactorQrCode.and.resolveTo(qrCode);

    const result = await firstValueFrom(service.loadSetupQrCode());

    expect(apiFactory.fromApi).toHaveBeenCalledTimes(1);
    expect(twoFactorAuthenticationApi.setupTwoFactorQrCode).toHaveBeenCalledOnceWith();
    expect(result).toBe(qrCode);
  });

  it('confirms the verification code through the API factory and returns the backup codes', async () => {
    const response: TwoFactorConfirmResponse = {
      success: true,
      message: 'Two-factor authentication enabled',
      backupCodes: ['backup-1', 'backup-2'],
    };
    twoFactorAuthenticationApi.confirmTwoFactorAuthentication.and.resolveTo(response);

    const result = await firstValueFrom(service.confirm('123456'));

    expect(apiFactory.fromApi).toHaveBeenCalledTimes(1);
    expect(twoFactorAuthenticationApi.confirmTwoFactorAuthentication).toHaveBeenCalledOnceWith({
      twoFactorVerificationRequest: { code: '123456' },
    });
    expect(result).toBe(response);
  });

  it('forwards generated response errors through the API factory normalization boundary', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [TwoFactorService, FetchApiFactory] });
    const realFactory = TestBed.inject(FetchApiFactory);
    const realService = TestBed.inject(TwoFactorService);
    const response = new Response(JSON.stringify({ reason: 'Verification code invalid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
    const responseError = new fetchClient.ResponseError(response);
    spyOn(realFactory.twoFactorAuthenticationApi, 'confirmTwoFactorAuthentication').and.rejectWith(responseError);

    let forwardedError: unknown;
    try {
      await firstValueFrom(realService.confirm('000000'));
      fail('expected confirmation to fail');
    } catch (error) {
      forwardedError = error;
    }

    expect(forwardedError).toEqual(
      jasmine.objectContaining<FetchApiError>({
        status: 400,
        error: jasmine.objectContaining({ reason: 'Verification code invalid' }),
        message: 'Verification code invalid',
        response,
        cause: responseError,
      }),
    );
  });

  it('forwards non-response promise rejections unchanged through the API factory boundary', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [TwoFactorService, FetchApiFactory] });
    const realFactory = TestBed.inject(FetchApiFactory);
    const realService = TestBed.inject(TwoFactorService);
    const requestError = new Error('network unavailable');
    spyOn(realFactory.twoFactorAuthenticationApi, 'setupTwoFactorQrCode').and.rejectWith(requestError);

    await expectAsync(firstValueFrom(realService.loadSetupQrCode())).toBeRejectedWith(requestError);
  });
});
