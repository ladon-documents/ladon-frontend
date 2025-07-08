import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UsermanagerStore } from '../../store/usermanager.store';
import { PermissionModel, UserEntryModel } from '../../../api';

import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AliasPipe } from '@ladon/shared';
import { combineLatest, switchMap, tap } from 'rxjs';
import { UsermanagerService } from '../services/usermanager.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroPlus, heroTrash } from '@ng-icons/heroicons/outline';

@Component({
  standalone: true,
  selector: 'app-user-details',
  providers: [provideIcons({ heroTrash, heroPlus })],
  imports: [ReactiveFormsModule, NgIconComponent, AliasPipe, RouterModule],
  templateUrl: './user-details.component.html',
  styleUrls: ['../usermanager.component.scss', './user-details.component.scss'],
})
export class UserDetailsComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private usermanagerService: UsermanagerService,
  ) {}

  store = inject(UsermanagerStore);
  user: UserEntryModel | undefined;
  userForm = new FormGroup({});
  userRoles: string[] | undefined;
  userPermissions: PermissionModel[] | undefined;

  ngOnInit(): void {
    this.generateForm();
    this.route.params.subscribe(({ id }) => {
      this.user = this.store.getUser(id);
      this.patchForm(this.user);
    });

    this.route.params
      .pipe(
        tap(({ id }) => {
          this.user = this.store.getUser(id);
          this.patchForm(this.user);
        }),
        switchMap(({ id }) =>
          combineLatest([
            this.usermanagerService.retrieveRoleForUser(id),
            this.usermanagerService.retrievePermissionForUser(id),
          ]),
        ),
      )
      .subscribe({
        next: (payload) => {
          const { 0: roles, 1: permissions } = payload;
          this.userRoles = roles;
          this.userPermissions = permissions;
        },
      });
  }

  changePassword(id: string | undefined) {
    console.log('No implementation yet', id);
  }

  onSubmit() {
    if (this.userForm.invalid) {
      return;
    }
  }

  private generateForm() {
    this.userForm.addControl('name', new FormControl());
    this.userForm.addControl('email', new FormControl());
    this.userForm.addControl('id', new FormControl());
    this.userForm.addControl('status', new FormControl());
    if (!this.user) {
      return;
    }
    Object.entries(this.user).forEach(([key, value]) => {
      this.userForm.addControl(key, new FormControl(value));
    });
  }

  private patchForm(user: UserEntryModel | undefined) {
    if (!user) {
      return;
    }
    Object.entries(user).forEach(([key, value]) => {
      this.userForm.patchValue({ [key]: value });
    });
  }
}
