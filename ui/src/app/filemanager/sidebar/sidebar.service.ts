import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  private sidebarOpenSubject = new BehaviorSubject<boolean>(false);

  sidebarOpen$ = this.sidebarOpenSubject.asObservable();

  isOpen() {
    return this.sidebarOpenSubject.value;
  }

  closeSidebar() {
    this.sidebarOpenSubject.next(false);
  }

  toggleSidebar() {
    this.sidebarOpenSubject.next(!this.sidebarOpenSubject.value);
  }

}
