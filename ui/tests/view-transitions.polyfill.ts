/**
 * Test-only polyfill: neutralize the benign
 *   "AbortError: Transition was skipped. New ViewTransition started"
 * that Angular's `withViewTransitions()` (app.config) and the app's
 * `navigation.component` produce when navigations overlap in a headless browser.
 *
 * The in-flight transition's `startViewTransition().finished` promise is aborted
 * when a new navigation begins; because that promise is fire-and-forget, the
 * abort becomes an unhandled rejection that Zone surfaces and that destabilizes
 * headless Chromium ("no message in 30000ms" disconnects). No spec asserts on
 * actual view transitions, so in tests we let overlapping transitions settle by
 * swallowing that benign abort. Scoped strictly to the `AbortError` for a
 * `transition was skipped`, so any other rejected promise is still surfaced to
 * the runner — no test assertion is weakened. The prod build never loads this.
 */

// Event-level guard (belt): swallow exactly this rejection if it still escapes.
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event?.reason;
    const name = reason instanceof Error ? reason.name : (reason as { name?: string } | null)?.name;
    const message = reason instanceof Error ? reason.message : (reason as { message?: string } | null)?.message ?? '';
    if (name === 'AbortError' && /transition was skipped/i.test(message)) {
      event.preventDefault();
    }
  });
}

// Source-level guard (suspenders): make `document.startViewTransition()` itself
// cancellation-safe so an overlapping navigation can't leave an unhandled abort.
if (typeof document !== 'undefined' && document && typeof document.startViewTransition === 'function') {
  const original = document.startViewTransition.bind(document);
  (document as unknown as { startViewTransition: unknown }).startViewTransition = (callback?: () => void) => {
    const run = () => {
      try {
        callback?.();
      } catch {
        /* a cosmetic highlight animation must never throw */
      }
    };
    try {
      const transition = original(run) as unknown;
      // The abort surfaces on the ViewTransition's `finished` promise, and in
      // some runtimes on the returned value itself. Swallow only the benign
      // abort; swallow nothing else so real rejections still propagate.
      const maybeFinished = (transition as { finished?: unknown } | null | undefined)?.finished;
      if (maybeFinished && typeof (maybeFinished as Promise<unknown>).catch === 'function') {
        void (maybeFinished as Promise<unknown>).catch(() => undefined);
      }
      if (transition && typeof (transition as Promise<unknown>).catch === 'function') {
        void (transition as Promise<unknown>).catch(() => undefined);
      }
      return transition;
    } catch {
      return undefined;
    }
  };
}

export {};
