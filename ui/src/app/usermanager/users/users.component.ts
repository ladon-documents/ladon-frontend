import { Component, ViewChild, inject, OnInit, ElementRef } from '@angular/core';
import { UsermanagerService } from '../services/usermanager.service';
import { RouterModule } from '@angular/router';
import { heroPlusCircle, heroTrash } from '@ng-icons/heroicons/outline';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { UsermanagerStore } from '../../store/usermanager.store';
import { AliasPipe, DialogComponent } from '@ladon/shared';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, FormsModule } from '@angular/forms';
import { FilterComponent } from '../components/filter/filter.component';
import { UserEntryModel } from '../../../api';

@Component({
  selector: 'app-users',
  standalone: true,
  providers: [provideIcons({ heroPlusCircle, heroTrash })],
  imports: [
    NgIconComponent,
    FilterComponent,
    RouterModule,
    AliasPipe,
    ReactiveFormsModule,
    FormsModule,
    DialogComponent,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  @ViewChild(DialogComponent, { static: true }) userDialog: DialogComponent | undefined;

  constructor(private usermanagerService: UsermanagerService) {}

  store = inject(UsermanagerStore);
  userAddGroup = new FormGroup({});
  filteredUsers: UserEntryModel[] | undefined;

  ngOnInit(): void {
    this.store.retrieveUsers();
    this.store.loading$().subscribe((loading) => {
      if (!loading) {
        this.filteredUsers = this.store.users();
      }
    });
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

  onFilterTerm(term: string) {
    this.filteredUsers = this.store
      .users()
      .filter(
        (user) =>
          user.name?.toLowerCase().includes(term.toLowerCase()) ||
          user.email?.toLowerCase().includes(term.toLowerCase()),
      );
  }

  private generateForm(): void {
    this.userAddGroup.addControl('name', new FormControl(undefined, Validators.required));
    this.userAddGroup.addControl('email', new FormControl(undefined, Validators.required));
    this.userAddGroup.addControl('password', new FormControl(undefined, Validators.required));
  }
}
