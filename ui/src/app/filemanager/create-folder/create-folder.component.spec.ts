import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateFolderComponent } from './create-folder.component';

describe('CreateFolderComponent', () => {
  let component: CreateFolderComponent;
  let fixture: ComponentFixture<CreateFolderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateFolderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateFolderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
