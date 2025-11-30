import { TestBed } from '@angular/core/testing';

import { AudioplayerService } from './audio-player.service';

describe('AudioplayerService', () => {
  let service: AudioplayerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AudioplayerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
