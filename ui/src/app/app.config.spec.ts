import { appConfig } from './app.config';
import { STATIC_TRUSTED_EXECUTION_ENABLED } from './staticweb/static-trust-boundary.service';
import { environment as developmentEnvironment } from '../environments/environment.development';

describe('appConfig', () => {
  it('provides trusted static script execution from environment statics config', () => {
    const provider = appConfig.providers.find(
      (entry) =>
        typeof entry === 'object' &&
        entry !== null &&
        'provide' in entry &&
        entry.provide === STATIC_TRUSTED_EXECUTION_ENABLED,
    );

    expect(provider).toBeTruthy();
    expect(provider).toEqual(
      jasmine.objectContaining({
        provide: STATIC_TRUSTED_EXECUTION_ENABLED,
        useValue: false,
      }),
    );
  });

  it('enables trusted static script execution in development for local dev statics', () => {
    expect((developmentEnvironment.statics as { trustedExecutionEnabled?: boolean }).trustedExecutionEnabled).toBeTrue();
  });
});
