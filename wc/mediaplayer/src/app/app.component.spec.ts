import { TestBed } from '@angular/core/testing';
import { MediaPlayerComponent } from './app.component';

describe('MediaPlayerComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaPlayerComponent],
    }).compileComponents();
  });

  it('creates component', () => {
    const fixture = TestBed.createComponent(MediaPlayerComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
