import { Clipboard } from '@angular/cdk/clipboard';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TwoFactorConfirmResponse } from '@ladon/api';
import { Subject, of, throwError } from 'rxjs';
import type { FetchApiError } from '../services/api/fetch-api.factory';
import { TwoFactorService } from '../services/two-factor.service';
import { AppStore } from '../store/app.store';
import { AccountSettingsComponent } from './account-settings.component';

describe('AccountSettingsComponent', () => {
  let component: AccountSettingsComponent;
  let fixture: ComponentFixture<AccountSettingsComponent>;
  let twoFactorService: jasmine.SpyObj<TwoFactorService>;
  let clipboard: jasmine.SpyObj<Clipboard>;
  let store: { requireReauthentication: jasmine.Spy };
  let router: { url: string };
  let createObjectUrl: jasmine.Spy;
  let revokeObjectUrl: jasmine.Spy;
  let nextObjectUrl = 0;

  const startSetup = (): void => {
    twoFactorService.loadSetupQrCode.and.returnValue(of(new Blob(['qr'], { type: 'image/png' })));
    component.startSetup();
    fixture.detectChanges();
  };

  const reachBackupStep = (codes = ['alpha-code', 'beta-code']): void => {
    startSetup();
    twoFactorService.confirm.and.returnValue(
      of({ success: true, message: 'enabled', backupCodes: codes } as TwoFactorConfirmResponse),
    );
    component.verificationForm.controls.code.setValue('123456');
    component.confirmSetup();
    fixture.detectChanges();
  };

  const fetchApiError = (status: number, reason: string, message = reason): FetchApiError => ({
    status,
    error: { reason },
    message,
    body: { secret: 'must not be rendered' },
    response: new Response(null, { status }),
    cause: new Error('must not be rendered'),
  });

  const button = (label: string): HTMLButtonElement =>
    Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button')).find(
      (candidate) => candidate.textContent?.trim() === label,
    )!;

  const currentStep = (): string | undefined =>
    fixture.nativeElement.querySelector('li[aria-current="step"]')?.textContent?.trim();

  beforeEach(async () => {
    twoFactorService = jasmine.createSpyObj<TwoFactorService>('TwoFactorService', ['loadSetupQrCode', 'confirm']);
    clipboard = jasmine.createSpyObj<Clipboard>('Clipboard', ['copy']);
    store = { requireReauthentication: jasmine.createSpy('requireReauthentication') };
    router = { url: '/ui/draco/ladon-core/account-settings' };
    nextObjectUrl = 0;
    createObjectUrl = spyOn(URL, 'createObjectURL').and.callFake(() => `blob:test-${++nextObjectUrl}`);
    revokeObjectUrl = spyOn(URL, 'revokeObjectURL');

    await TestBed.configureTestingModule({
      imports: [AccountSettingsComponent],
      providers: [
        { provide: TwoFactorService, useValue: twoFactorService },
        { provide: Clipboard, useValue: clipboard },
        { provide: AppStore, useValue: store },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts with the two-factor activation action', () => {
    expect(component.step()).toBe('start');
    expect(fixture.nativeElement.textContent).toContain('2FA aktivieren');
  });

  it('loads a QR blob, creates its object URL, and renders the image', () => {
    const qrResult = new Subject<Blob>();
    const qrBlob = new Blob(['png'], { type: 'image/png' });
    twoFactorService.loadSetupQrCode.and.returnValue(qrResult);

    component.startSetup();
    fixture.detectChanges();

    expect(component.step()).toBe('loading');
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('QR-Code wird geladen');

    qrResult.next(qrBlob);
    qrResult.complete();
    fixture.detectChanges();

    expect(createObjectUrl).toHaveBeenCalledOnceWith(qrBlob);
    expect(component.step()).toBe('verify');
    const image: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(image.alt).toContain('QR-Code');
    expect(image.src).toContain('blob:test-1');
  });

  it('marks exactly the current setup step for assistive technology', () => {
    expect(currentStep()).toBe('Aktivieren');
    expect(fixture.nativeElement.querySelectorAll('li[aria-current="step"]').length).toBe(1);

    const qrResult = new Subject<Blob>();
    twoFactorService.loadSetupQrCode.and.returnValue(qrResult);
    component.startSetup();
    fixture.detectChanges();
    expect(currentStep()).toBe('Aktivieren');

    qrResult.next(new Blob(['qr'], { type: 'image/png' }));
    fixture.detectChanges();
    expect(currentStep()).toBe('Scannen');

    twoFactorService.confirm.and.returnValue(
      of({ success: true, backupCodes: ['backup'] } as TwoFactorConfirmResponse),
    );
    component.verificationForm.controls.code.setValue('123456');
    component.confirmSetup();
    fixture.detectChanges();
    expect(currentStep()).toBe('Codes sichern');

    component.savedSafelyForm.controls.savedSafely.setValue(true);
    component.acknowledgeBackupCodes();
    fixture.detectChanges();
    expect(currentStep()).toBe('Fertig');
  });

  it('shows a stable QR loading error and retries the request', () => {
    twoFactorService.loadSetupQrCode.and.returnValues(
      throwError(() => new Error('private network detail')),
      of(new Blob(['qr'], { type: 'image/png' })),
    );

    component.startSetup();
    fixture.detectChanges();

    expect(component.step()).toBe('start');
    expect(component.errorMessage()).toBe('QR-Code konnte nicht geladen werden. Bitte erneut versuchen.');
    expect(fixture.nativeElement.textContent).not.toContain('private network detail');

    component.startSetup();
    fixture.detectChanges();

    expect(twoFactorService.loadSetupQrCode).toHaveBeenCalledTimes(2);
    expect(component.step()).toBe('verify');
  });

  it('requires reauthentication instead of showing a retry after a QR 401', () => {
    twoFactorService.loadSetupQrCode.and.returnValue(throwError(() => fetchApiError(401, 'expired')));

    component.startSetup();
    fixture.detectChanges();

    expect(store.requireReauthentication).toHaveBeenCalledOnceWith(router.url);
    expect(component.step()).toBe('start');
    expect(component.errorMessage()).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('expired');
  });

  it('does not overlap setup requests while a QR code is loading', () => {
    const qrResult = new Subject<Blob>();
    twoFactorService.loadSetupQrCode.and.returnValue(qrResult);

    component.startSetup();
    component.startSetup();

    expect(twoFactorService.loadSetupQrCode).toHaveBeenCalledTimes(1);
    expect(component.step()).toBe('loading');
  });

  it('accepts exactly six digits and never confirms invalid values', () => {
    startSetup();
    twoFactorService.confirm.and.returnValue(of({ success: true, backupCodes: ['code'] } as TwoFactorConfirmResponse));

    for (const invalidCode of ['', '12345', '1234567', '12345a']) {
      component.verificationForm.controls.code.setValue(invalidCode);
      component.confirmSetup();
    }

    expect(twoFactorService.confirm).not.toHaveBeenCalled();
    expect(component.verificationForm.controls.code.invalid).toBeTrue();

    component.verificationForm.controls.code.setValue('012345');
    component.confirmSetup();

    expect(twoFactorService.confirm).toHaveBeenCalledOnceWith('012345');
  });

  it('sends only one confirmation while a request is pending and disables conflicting actions', () => {
    startSetup();
    const confirmation = new Subject<TwoFactorConfirmResponse>();
    twoFactorService.confirm.and.returnValue(confirmation);
    component.verificationForm.controls.code.setValue('123456');

    component.confirmSetup();
    component.confirmSetup();
    fixture.detectChanges();

    expect(twoFactorService.confirm).toHaveBeenCalledOnceWith('123456');
    expect(component.isConfirming()).toBeTrue();
    expect(button('2FA bestätigen').disabled).toBeTrue();
    expect(button('Abbrechen').disabled).toBeTrue();
    expect(button('QR-Code neu laden').disabled).toBeTrue();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('2FA wird bestätigt');

    component.cancelSetup();
    component.startSetup();

    expect(twoFactorService.loadSetupQrCode).toHaveBeenCalledTimes(1);
    expect(component.step()).toBe('verify');
    expect(component.isConfirming()).toBeTrue();
  });

  it('ignores late QR responses after cancellation and a newer setup attempt', () => {
    const firstQr = new Subject<Blob>();
    const secondQr = new Subject<Blob>();
    twoFactorService.loadSetupQrCode.and.returnValues(firstQr, secondQr);

    component.startSetup();
    component.cancelSetup();
    firstQr.next(new Blob(['stale'], { type: 'image/png' }));

    expect(component.step()).toBe('start');
    expect(component.qrCodeUrl()).toBeNull();
    expect(createObjectUrl).not.toHaveBeenCalled();

    component.startSetup();
    secondQr.next(new Blob(['current'], { type: 'image/png' }));
    firstQr.error(new Error('late private detail'));

    expect(component.step()).toBe('verify');
    expect(component.qrCodeUrl()).toBe('blob:test-1');
    expect(component.errorMessage()).toBeNull();
  });

  it('keeps verification active, clears the code, and shows only a normalized 400 message', () => {
    startSetup();
    twoFactorService.confirm.and.returnValue(throwError(() => fetchApiError(400, 'Code ist ungültig.')));
    component.verificationForm.controls.code.setValue('123456');

    component.confirmSetup();
    fixture.detectChanges();

    expect(component.step()).toBe('verify');
    expect(component.verificationForm.controls.code.value).toBe('');
    expect(component.errorMessage()).toBe('Code ist ungültig.');
    expect(fixture.nativeElement.textContent).not.toContain('must not be rendered');
  });

  it('requires reauthentication with the current router URL after a 401', () => {
    startSetup();
    twoFactorService.confirm.and.returnValue(throwError(() => fetchApiError(401, 'expired')));
    component.verificationForm.controls.code.setValue('123456');

    component.confirmSetup();

    expect(store.requireReauthentication).toHaveBeenCalledOnceWith(router.url);
    expect(component.verificationForm.controls.code.value).toBe('');
    expect(component.qrCodeUrl()).toBeNull();
    expect(component.errorMessage()).toBeNull();
    expect(component.step()).toBe('start');
  });

  it('rejects an unsuccessful confirmation response without exposing backup actions', () => {
    startSetup();
    twoFactorService.confirm.and.returnValue(
      of({ success: false, backupCodes: ['must-not-be-used'] } as TwoFactorConfirmResponse),
    );
    component.verificationForm.controls.code.setValue('123456');

    component.confirmSetup();
    fixture.detectChanges();

    expect(component.step()).toBe('verify');
    expect(component.verificationForm.controls.code.value).toBe('');
    expect(component.errorMessage()).toBe('2FA konnte nicht aktiviert werden. Bitte erneut versuchen.');
    expect(component.backupCodes()).toEqual([]);
    expect(component.backupDownloadUrl()).toBeNull();
    expect(createObjectUrl).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('a[download]')).toBeNull();
  });

  it('rejects a successful confirmation response without usable backup codes', () => {
    startSetup();
    twoFactorService.confirm.and.returnValue(
      of({ success: true, backupCodes: ['', '   '] } as TwoFactorConfirmResponse),
    );
    component.verificationForm.controls.code.setValue('123456');

    component.confirmSetup();

    expect(component.step()).toBe('verify');
    expect(component.verificationForm.controls.code.value).toBe('');
    expect(component.errorMessage()).toBe('2FA konnte nicht aktiviert werden. Bitte erneut versuchen.');
    expect(component.backupCodes()).toEqual([]);
    expect(component.copySucceeded()).toBeNull();
  });

  it('rejects a malformed confirmation response without throwing', () => {
    startSetup();
    twoFactorService.confirm.and.returnValue(
      of({ success: true, backupCodes: null } as unknown as TwoFactorConfirmResponse),
    );
    component.verificationForm.controls.code.setValue('123456');

    expect(() => component.confirmSetup()).not.toThrow();

    expect(component.step()).toBe('verify');
    expect(component.verificationForm.controls.code.value).toBe('');
    expect(component.errorMessage()).toBe('2FA konnte nicht aktiviert werden. Bitte erneut versuchen.');
    expect(component.backupCodes()).toEqual([]);
  });

  it('rejects a missing confirmation response without throwing', () => {
    startSetup();
    twoFactorService.confirm.and.returnValue(of(null as unknown as TwoFactorConfirmResponse));
    component.verificationForm.controls.code.setValue('123456');

    expect(() => component.confirmSetup()).not.toThrow();

    expect(component.step()).toBe('verify');
    expect(component.verificationForm.controls.code.value).toBe('');
    expect(component.errorMessage()).toBe('2FA konnte nicht aktiviert werden. Bitte erneut versuchen.');
  });

  it('renders each returned backup code exactly once after confirmation', () => {
    reachBackupStep(['first-code', 'second-code', 'third-code']);

    expect(component.step()).toBe('backup');
    const renderedCodes = Array.from<HTMLElement>(
      fixture.nativeElement.querySelectorAll('ul[aria-label="Backup-Codes"] code'),
    ).map((element) => element.textContent?.trim());
    expect(renderedCodes).toEqual(['first-code', 'second-code', 'third-code']);
  });

  it('copies newline-separated backup codes and reports the clipboard result', () => {
    reachBackupStep(['first-code', 'second-code']);
    clipboard.copy.and.returnValue(true);

    component.copyBackupCodes();
    fixture.detectChanges();

    expect(clipboard.copy).toHaveBeenCalledOnceWith('first-code\nsecond-code');
    expect(component.copySucceeded()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Backup-Codes wurden kopiert.');

    clipboard.copy.and.returnValue(false);
    component.copyBackupCodes();
    fixture.detectChanges();

    expect(component.copySucceeded()).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('Backup-Codes konnten nicht kopiert werden.');
  });

  it('does not access the clipboard when there are no backup codes', () => {
    component.copyBackupCodes();

    expect(clipboard.copy).not.toHaveBeenCalled();
    expect(component.copySucceeded()).toBeFalse();
  });

  it('provides a short-lived download URL with the exact filename and useful file content', async () => {
    reachBackupStep(['first-code', 'second-code']);

    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a[download]');
    expect(link.getAttribute('href')).toBe('blob:test-2');
    expect(link.getAttribute('download')).toBe('ladon-2fa-backup-codes.txt');

    const downloadBlob = createObjectUrl.calls.mostRecent().args[0] as Blob;
    const content = await downloadBlob.text();
    expect(downloadBlob.type).toBe('text/plain;charset=utf-8');
    expect(content).toBe('Ladon 2FA Backup-Codes\n\nfirst-code\nsecond-code\n');
  });

  it('keeps completion disabled until safe storage is acknowledged', () => {
    reachBackupStep();
    const finishButton = (): HTMLButtonElement =>
      Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button')).find(
        (button) => button.textContent?.trim() === 'Einrichtung abschließen',
      )!;

    expect(component.savedSafelyForm.controls.savedSafely.value).toBeFalse();
    expect(finishButton().disabled).toBeTrue();

    component.savedSafelyForm.controls.savedSafely.setValue(true);
    fixture.detectChanges();

    expect(finishButton().disabled).toBeFalse();
  });

  it('clears secrets and URLs before entering a persistent complete step', () => {
    reachBackupStep();
    component.verificationForm.controls.code.setValue('654321');
    component.savedSafelyForm.controls.savedSafely.setValue(true);
    const observedSteps: string[] = [];
    revokeObjectUrl.and.callFake(() => observedSteps.push(component.step()));

    component.acknowledgeBackupCodes();
    fixture.detectChanges();

    expect(observedSteps).toEqual(['backup', 'backup']);
    expect(revokeObjectUrl.calls.allArgs()).toEqual([['blob:test-2'], ['blob:test-1']]);
    expect(component.verificationForm.controls.code.value).toBe('');
    expect(component.savedSafelyForm.controls.savedSafely.value).toBeFalse();
    expect(component.backupCodes()).toEqual([]);
    expect(component.copySucceeded()).toBeNull();
    expect(component.backupDownloadUrl()).toBeNull();
    expect(component.qrCodeUrl()).toBeNull();
    expect(component.step()).toBe('complete');
    expect(fixture.nativeElement.querySelector('.alert-success').textContent).toContain('2FA wurde aktiviert');

    fixture.detectChanges();
    expect(component.step()).toBe('complete');
  });

  it('revokes replaced and destroyed QR/download URLs exactly once', () => {
    startSetup();
    component.startSetup();
    fixture.detectChanges();
    reachBackupStep(['backup']);

    expect(revokeObjectUrl.calls.allArgs()).toEqual([['blob:test-1'], ['blob:test-2']]);
    expect(component.qrCodeUrl()).toBe('blob:test-3');
    expect(component.backupDownloadUrl()).toBe('blob:test-4');
    component.verificationForm.controls.code.setValue('654321');
    component.savedSafelyForm.controls.savedSafely.setValue(true);
    component.copySucceeded.set(true);

    fixture.destroy();

    expect(revokeObjectUrl.calls.allArgs()).toEqual([
      ['blob:test-1'],
      ['blob:test-2'],
      ['blob:test-4'],
      ['blob:test-3'],
    ]);
    expect(component.verificationForm.controls.code.value).toBe('');
    expect(component.savedSafelyForm.controls.savedSafely.value).toBeFalse();
    expect(component.backupCodes()).toEqual([]);
    expect(component.copySucceeded()).toBeNull();
    expect(component.qrCodeUrl()).toBeNull();
    expect(component.backupDownloadUrl()).toBeNull();
  });

  it('clears all sensitive values and invalidates a pending confirmation when destroyed', () => {
    startSetup();
    const confirmation = new Subject<TwoFactorConfirmResponse>();
    twoFactorService.confirm.and.returnValue(confirmation);
    component.verificationForm.controls.code.setValue('654321');
    component.backupCodes.set(['temporary-code']);
    component.savedSafelyForm.controls.savedSafely.setValue(true);
    component.copySucceeded.set(true);
    component.confirmSetup();

    fixture.destroy();
    confirmation.next({ success: true, backupCodes: ['late-code'] } as TwoFactorConfirmResponse);
    confirmation.error(fetchApiError(400, 'late error'));

    expect(component.isConfirming()).toBeFalse();
    expect(component.verificationForm.controls.code.value).toBe('');
    expect(component.savedSafelyForm.controls.savedSafely.value).toBeFalse();
    expect(component.backupCodes()).toEqual([]);
    expect(component.copySucceeded()).toBeNull();
    expect(component.qrCodeUrl()).toBeNull();
    expect(component.backupDownloadUrl()).toBeNull();
    expect(component.errorMessage()).toBeNull();
    expect(createObjectUrl).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledOnceWith('blob:test-1');
  });
});
