import { appConfig } from './app.config';
import { RAPID_TRUSTED_EXECUTION_ENABLED } from './rapidweb/rapid-trust-boundary.service';
import { environment as developmentEnvironment } from '../environments/environment.development';

describe('appConfig', () => {
  it('provides trusted rapid script execution from environment rapids config', () => {
    const provider = appConfig.providers.find(
      (entry) =>
        typeof entry === 'object' &&
        entry !== null &&
        'provide' in entry &&
        entry.provide === RAPID_TRUSTED_EXECUTION_ENABLED,
    );

    expect(provider).toBeTruthy();
    expect(provider).toEqual(
      jasmine.objectContaining({
        provide: RAPID_TRUSTED_EXECUTION_ENABLED,
        useValue: false,
      }),
    );
  });

  it('enables trusted rapid script execution in development for local dev rapids', () => {
    expect((developmentEnvironment.rapids as { trustedExecutionEnabled?: boolean }).trustedExecutionEnabled).toBeTrue();
  });
});
