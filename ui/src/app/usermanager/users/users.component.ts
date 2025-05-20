import { Component, ViewChild, inject, OnInit, ElementRef } from '@angular/core';
import { SearchbarComponent } from '../../searchbar/searchbar.component';
import { UsermanagerService } from '../services/usermanager.service';
import { RouterModule } from '@angular/router';
import { heroPlusCircle, heroTrash } from '@ng-icons/heroicons/outline';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { UsermanagerStore } from '../../store/usermanager.store';
import { AliasPipe, DialogComponent } from '@ladon/shared';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-users',
  standalone: true,
  providers: [provideIcons({ heroPlusCircle, heroTrash })],
  imports: [NgIconComponent, SearchbarComponent, RouterModule, AliasPipe, ReactiveFormsModule, DialogComponent],
  templateUrl: './users.component.html',
  styleUrls: ['../usermanager.component.scss', './users.component.scss'],
})
export class UsersComponent implements OnInit {
  @ViewChild(DialogComponent, { static: true }) userDialog: DialogComponent | undefined;
  constructor(private usermanagerService: UsermanagerService) {}
  store = inject(UsermanagerStore);
  userAddGroup = new FormGroup({});

  ngOnInit(): void {
    this.store.retrieveUsers();
    this.generateForm();
  }

  createUser(): void {
    this.userDialog?.openDialog();
  }

  deleteUser(userId: string): void {
    this.store.deleteUser(userId);
  }

  onAddUser(): void {
    if (this.userAddGroup.invalid) {
      this.userAddGroup.markAllAsTouched();
      return;
    }

    this.store.addUser(this.userAddGroup.value);
    this.closeDialog();
  }

  closeDialog(): void {
    this.userDialog?.closeDialog();
  }

  private generateForm(): void {
    this.userAddGroup.addControl('name', new FormControl(undefined, Validators.required));
    this.userAddGroup.addControl('email', new FormControl(undefined, Validators.required));
    this.userAddGroup.addControl('password', new FormControl(undefined, Validators.required));
  }
}
