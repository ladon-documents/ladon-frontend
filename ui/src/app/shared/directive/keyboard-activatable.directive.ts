import { Directive, ElementRef, HostListener, inject, Renderer2 } from '@angular/core';

/**
 * Keyboard activation for elements that respond to a click but are not natively
 * keyboard-activatable (a11y / WP-P1.2a).
 *
 * A non-`<button>`/`<a>` element that carries only `(click)="…"` cannot be
 * fired from the keyboard (no `focus`/`Enter`/`Space` path), which fails
 * WCAG 2.1.1 (Keyboard) and 4.2.1 (Keyboard). This directive turns the host
 * into a keyboard-activatable control without changing its existing behavior:
 *
 *   - the constructor adds `role="button"` and `tabindex="0"` (idempotent via
 *     `setAttribute`), making the element a focusable, announced button control;
 *   - on `Enter`/`Space` key-down it prevents the default (Space would otherwise
 *     scroll the page) and dispatches a single native `click` on the host, so the
 *     element's existing `(click)` Angular binding fires exactly as before;
 *   - the visible focus ring itself comes from the global `:focus-visible` rule.
 *
 * Use it where a single activation is the only meaning (e.g. sort toggles).
 * Do NOT apply it to elements that also carry `dblclick`/`contextmenu`: a
 * keyboard-triggered single `click` would collide with the pointer double-click.
 */
@Directive({
  selector: '[appKeyboardActivatable]',
  standalone: true,
})
export class KeyboardActivatableDirective {
  private readonly elementRef = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  constructor() {
    const nativeElement = this.elementRef.nativeElement as HTMLElement;
    this.renderer.setAttribute(nativeElement, 'role', 'button');
    this.renderer.setAttribute(nativeElement, 'tabindex', '0');
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const isActivation = event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar';
    if (!isActivation) {
      return;
    }
    event.preventDefault();
    this.elementRef.nativeElement.click();
  }
}
