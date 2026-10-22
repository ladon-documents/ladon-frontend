import { AuthStorageService } from './auth.storage.service';

describe('Storage (AuthStorageService)', () => {
  it('should be created', () => {
    // The abstract `Storage<T>` base cannot be instantiated directly; the concrete,
    // `providedIn: 'root'` implementation is `AuthStorageService` (extends Storage).
    const service = new AuthStorageService();
    expect(service).toBeTruthy();
  });

  it('should store and read JSON values via the concrete implementation', () => {
    const service = new AuthStorageService();
    service.setData({ token: 'abc' });
    expect(service.getData()).toEqual({ token: 'abc' });
    service.removeData();
    expect(service.getData()).toBeNull();
  });
});
