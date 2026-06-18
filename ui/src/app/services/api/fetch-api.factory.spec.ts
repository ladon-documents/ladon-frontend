import { TestBed } from '@angular/core/testing';
import { fetchClient } from '@ladon/api';

import { FetchApiFactory } from './fetch-api.factory';

describe('FetchApiFactory', () => {
  let factory: FetchApiFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    factory = TestBed.inject(FetchApiFactory);
  });

  it('normalizes generated response errors for RxJS consumers', (done) => {
    const response = new Response(JSON.stringify({ reason: 'Bucket nicht gefunden' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    factory
      .fromApi(() => Promise.reject(new fetchClient.ResponseError(response)))
      .subscribe({
        next: () => {
          fail('expected api request to fail');
        },
        error: (error) => {
          expect(error.status).toBe(404);
          expect(error.error.reason).toBe('Bucket nicht gefunden');
          done();
        },
      });
  });
});
