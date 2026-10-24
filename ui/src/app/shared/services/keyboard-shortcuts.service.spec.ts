import { TestBed } from '@angular/core/testing';

import { KeyboardShortcutsService } from './keyboard-shortcuts.service';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('KeyboardShortcutsService', () => {
  let service: KeyboardShortcutsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: smokeTestImports,
      providers: smokeTestProviders(),
    });
    service = TestBed.inject(KeyboardShortcutsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('native key passthrough (B9/F24)', () => {
    it('does not block native Ctrl+A when the shortcut is not enabled', () => {
      service.init();

      const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true, cancelable: true });
      document.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(false);
    });

    it('does not block Delete or Escape when the shortcut is not enabled', () => {
      service.init();

      const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete', cancelable: true });
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });

      document.dispatchEvent(deleteEvent);
      document.dispatchEvent(escapeEvent);

      expect(deleteEvent.defaultPrevented).toBe(false);
      expect(escapeEvent.defaultPrevented).toBe(false);
    });

    it('blocks a key only when its shortcut is explicitly enabled', () => {
      service.init();

      const escape = service.getShortcuts().find((shortcut) => shortcut.key === 'Escape');
      if (!escape) {
        throw new Error('Escape shortcut missing');
      }
      escape.enabled = true;

      const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
      document.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    });
  });
});
