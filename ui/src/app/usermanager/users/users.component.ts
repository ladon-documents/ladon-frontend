import { Component, ViewChild, inject, OnInit, ElementRef } from '@angular/core';
import { SearchbarComponent } from '../../searchbar/searchbar.component';
import { UsermanagerService } from '../services/usermanager.service';
import { RouterModule } from '@angular/router';
import { heroPlusCircle, heroTrash } from '@ng-icons/heroicons/outline';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { UsermanagerStore } from '../../store/usermanager.store';
import { AliasPipe } from '@ladon/shared';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-users',
  standalone: true,
  providers: [provideIcons({ heroPlusCircle, heroTrash })],
  imports: [NgIconComponent, SearchbarComponent, RouterModule, AliasPipe, ReactiveFormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['../usermanager.component.scss', './users.component.scss'],
})
export class UsersComponent implements OnInit {
  @ViewChild('userDialog', { static: true }) userDialog: ElementRef | undefined;
  constructor(private usermanagerService: UsermanagerService) {}
  store = inject(UsermanagerStore);
  userAddGroup = new FormGroup({});

  ngOnInit(): void {
    this.store.retrieveUsers();
  }

  createUser(): void {
    this.userDialog?.nativeElement.showModal();
  }
}
