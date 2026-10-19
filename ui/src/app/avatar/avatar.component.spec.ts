import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterLink } from '@angular/router';

import { AvatarComponent } from './avatar.component';
import { environment } from '../../environments/environment';

describe('AvatarComponent', () => {
  let component: AvatarComponent;
  let fixture: ComponentFixture<AvatarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('links the existing account settings menu item to the account settings route', () => {
    const router = TestBed.inject(Router);
    const accountSettingsLinks = fixture.debugElement
      .queryAll(By.css('a'))
      .filter((anchor) => anchor.nativeElement.textContent.trim() === 'Kontoeinstellungen');

    expect(accountSettingsLinks.length).toBe(1);
    const routerLink = accountSettingsLinks[0].injector.get(RouterLink);
    expect(routerLink.urlTree).not.toBeNull();
    expect(router.serializeUrl(routerLink.urlTree!)).toBe(`/${environment.baseHref}/account-settings`);
  });
});
