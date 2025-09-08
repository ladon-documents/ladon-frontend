import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarService } from './sidebar.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'filemanager-sidebar',
  imports: [CommonModule],
  providers: [],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit, OnDestroy {
  isOpen = false;
  imageUrl: string | null = null;
  private subscriptions = new Subscription();

  constructor(private sidebarService: SidebarService) {}

  ngOnInit() {
    this.subscriptions.add(
      this.sidebarService.sidebarOpen$.subscribe((isOpen) => {
        this.isOpen = isOpen;
      }),
    );

    this.subscriptions.add(
      this.sidebarService.imageUrl$.subscribe((url) => {
        this.imageUrl = url;
      }),
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  closeSidebar() {
    this.sidebarService.closeSidebar();
  }

  onImageError(event: any) {
    console.error('Fehler beim Anzeigen des Bildes:', event);
  }
}
