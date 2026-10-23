import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { KeyboardActivatableDirective } from './keyboard-activatable.directive';

// Minimal host template that mirrors real usage: a non-<button> element that
// activates on a native click, here routed to a counter so we can assert the
// synthesized click reaches the existing `(click)` binding.
@Component({
  standalone: true,
  imports: [KeyboardActivatableDirective],
  template: `<div appKeyboardActivatable (click)="record()">label</div>`,
})
class HostComponent {
  clicks = 0;
  record() {
    this.clicks++;
  }
}

describe('KeyboardActivatableDirective (a11y keyboard activation)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let component: HostComponent;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    component = fixture.componentInstance;
    host = fixture.nativeElement.querySelector('div') as HTMLElement;
    fixture.detectChanges();
  });

  it('should be created', () => {
    const directiveEl = fixture.debugElement.query(By.directive(KeyboardActivatableDirective));
    expect(directiveEl).toBeTruthy();
    expect(directiveEl.injector.get(KeyboardActivatableDirective)).toBeTruthy();
  });

  it('makes the host a focusable, announced button control', () => {
    expect(host.getAttribute('role')).toBe('button');
    expect(host.getAttribute('tabindex')).toBe('0');
  });

  it('activates the existing (click) binding on Enter', () => {
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(component.clicks).toBe(1);
  });

  it('activates the existing (click) binding on Space', () => {
    host.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(component.clicks).toBe(1);
  });

  it('does not activate on a non-activating key', () => {
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(component.clicks).toBe(0);
  });
});
