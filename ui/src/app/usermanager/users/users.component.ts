import { Component, OnInit } from '@angular/core';
import { SearchbarComponent } from '../../searchbar/searchbar.component';
import { UsermanagerService } from '../services/usermanager.service';
import { UserEntryModel } from '../../../api';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { heroPlusCircle } from '@ng-icons/heroicons/outline';
import { NgIconComponent, provideIcons } from '@ng-icons/core';

@Component({
  selector: 'app-users',
  standalone: true,
  providers: [provideIcons({ heroPlusCircle })],
  imports: [NgIconComponent, SearchbarComponent, AsyncPipe, RouterModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  constructor(private usermanagerService: UsermanagerService) {}
  users$: Observable<UserEntryModel[]> | undefined;

  ngOnInit(): void {
    this.users$ = this.usermanagerService.retrieveUsers();
  }
}
