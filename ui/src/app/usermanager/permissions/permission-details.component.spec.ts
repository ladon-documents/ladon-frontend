import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermissionDetailsComponent } from './permission-details.component';

describe('PermissionDetailsComponent', () => {
  let component: PermissionDetailsComponent;
  let fixture: ComponentFixture<PermissionDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionDetailsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PermissionDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
