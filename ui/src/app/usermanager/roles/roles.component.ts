import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { UsermanagerStore } from '../../store/usermanager.store';
import { FilterComponent } from '../components/filter/filter.component';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { RoleEntryModel } from '../../../api';
import { AliasPipe, DialogComponent } from '@ladon/shared';
import { heroPlusCircle, heroTrash } from '@ng-icons/heroicons/outline';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-roles',
  standalone: true,
  providers: [provideIcons({ heroPlusCircle, heroTrash })],
  imports: [FilterComponent, NgIconComponent, DialogComponent, AliasPipe, ReactiveFormsModule],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss',
})
export class RolesComponent implements OnInit {
  @ViewChild(DialogComponent, { static: true }) roleDialog: DialogComponent | undefined;

  filteredRoles: RoleEntryModel[] | undefined;
  readonly roleAddGroup = new FormGroup({});
  readonly store = inject(UsermanagerStore);

  createRole(): void {
    this.roleDialog?.openDialog();
  }

  ngOnInit(): void {
    this.store.retrieveRoles();
    this.store.loading$().subscribe((loading) => {
      if (!loading) {
        this.filteredRoles = this.store.roles();
      }
    });

    this.generateForm();
  }

  onFilterTerm(term: string) {
    this.filteredRoles = this.store
      .roles()
      .filter(
        (role) =>
          role.name?.toLowerCase().includes(term.toLowerCase()) ||
          role.details?.toLowerCase().includes(term.toLowerCase()),
      );
  }

  onAddRole(): void {
    if (this.roleAddGroup.invalid) {
      this.roleAddGroup.markAllAsTouched();
      return;
    }

    this.store.addRole(this.roleAddGroup.value);
    this.closeDialog();
  }

  closeDialog(): void {
    this.roleDialog?.closeDialog();
  }

  deleteRole(roleId: string): void {
    this.store.deleteRole(roleId);
  }

  private generateForm(): void {
    this.roleAddGroup.addControl('name', new FormControl(undefined, Validators.required));
    this.roleAddGroup.addControl('id', new FormControl(undefined, Validators.required));
    this.roleAddGroup.addControl('description', new FormControl(undefined, Validators.required));
  }
}
