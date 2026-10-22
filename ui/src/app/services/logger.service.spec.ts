import { TestBed } from '@angular/core/testing';

import { LoggerService } from './logger.service';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('LoggerService', () => {
  let service: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: smokeTestImports,
      providers: smokeTestProviders(),
    });
    service = TestBed.inject(LoggerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // H-Logging: the logger was previously dead code that hard-coded LogLevel.OFF
  // and ignored `environment.logger`. It must now honor the configured level.
  // The test run uses environment.ts, where `logger: 'ALL'`, so the service
  // emits at every level by default.
  it('honors the configured environment level (ALL emits output)', () => {
    const logSpy = spyOn(console, 'log');
    service.debug('debug-msg');
    service.log('log-msg');
    service.info('info-msg');
    service.warn('warn-msg');
    service.error('error-msg');
    expect(logSpy).toHaveBeenCalled();
  });
});
