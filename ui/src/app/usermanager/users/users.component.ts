import { Component, inject, OnInit } from '@angular/core';
import { SearchbarComponent } from '../../searchbar/searchbar.component';
import { UsermanagerService } from '../services/usermanager.service';
import { RouterModule } from '@angular/router';
import { heroPlusCircle } from '@ng-icons/heroicons/outline';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { UsermanagerStore } from '../../store/usermanager.store';
import { AliasPipe } from '@ladon/shared';

@Component({
  selector: 'app-users',
  standalone: true,
  providers: [provideIcons({ heroPlusCircle })],
  imports: [NgIconComponent, SearchbarComponent, RouterModule, AliasPipe],
  templateUrl: './users.component.html',
  styleUrls: ['../usermanager.component.scss', './users.component.scss'],
})
export class UsersComponent implements OnInit {
  constructor(private usermanagerService: UsermanagerService) {}
  store = inject(UsermanagerStore);

  ngOnInit(): void {
    this.store.retrieveUsers();
  }
}
