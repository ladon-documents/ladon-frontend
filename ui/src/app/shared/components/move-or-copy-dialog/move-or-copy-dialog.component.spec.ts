import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoveOrCopyDialogComponent } from './move-or-copy-dialog.component';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('MoveOrCopyDialogComponent', () => {
  let component: MoveOrCopyDialogComponent;
  let fixture: ComponentFixture<MoveOrCopyDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoveOrCopyDialogComponent, ...smokeTestImports],
      providers: smokeTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(MoveOrCopyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
