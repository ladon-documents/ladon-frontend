import { environment } from '../../../environments/environment';

/**
 * Dev-gated debug logging (H-Logging).
 *
 * Production code must not emit debug `console.log` output: it leaks internal
 * state/data (bucket ids, document keys/names, route tables, …) into the browser
 * console and costs performance. Real diagnostics use `console.warn`/
 * `console.error` and are intentionally NOT suppressed here.
 *
 * In development (`environment.production === false`) the call fires; in the
 * production build it is a no-op.
 */
export function devLog(message: unknown, ...args: unknown[]): void {
  if (!environment.production) {
    console.log(message, ...args);
  }
}
