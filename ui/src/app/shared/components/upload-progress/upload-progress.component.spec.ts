import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadProgressComponent } from './upload-progress.component';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('UploadProgressComponent', () => {
  let component: UploadProgressComponent;
  let fixture: ComponentFixture<UploadProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadProgressComponent, ...smokeTestImports],
      providers: smokeTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(UploadProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
