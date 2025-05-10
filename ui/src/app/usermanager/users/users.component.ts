import { Component, inject, OnInit } from '@angular/core';
import { SearchbarComponent } from '../../searchbar/searchbar.component';
import { UsermanagerService } from '../services/usermanager.service';
import { RouterModule } from '@angular/router';
import { heroPlusCircle } from '@ng-icons/heroicons/outline';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { UsermanagerStore } from '../../store/usermanager.store';

@Component({
  selector: 'app-users',
  standalone: true,
  providers: [provideIcons({ heroPlusCircle })],
  imports: [NgIconComponent, SearchbarComponent, RouterModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  constructor(private usermanagerService: UsermanagerService) {}
  store = inject(UsermanagerStore);

  ngOnInit(): void {
    this.store.retrieveUsers();
  }
}
