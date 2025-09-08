import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private sidebarOpenSubject = new BehaviorSubject<boolean>(false);
  private imageUrlSubject = new BehaviorSubject<string | null>(null);

  sidebarOpen$ = this.sidebarOpenSubject.asObservable();
  imageUrl$ = this.imageUrlSubject.asObservable();

  openSidebar(imageUrl: string | null = null) {
    this.imageUrlSubject.next(imageUrl);
    this.sidebarOpenSubject.next(true);
  }

  closeSidebar() {
    this.sidebarOpenSubject.next(false);
    setTimeout(() => {
      const currentUrl = this.imageUrlSubject.value;
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      this.imageUrlSubject.next(null);
    }, 300);
  }
}
