import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { AliasPipe, DialogComponent } from '@ladon/shared';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { FilterComponent } from '../components/filter/filter.component';
import { UsermanagerStore } from '../../store/usermanager.store';
import { PermissionModel } from '../../../api';
import { heroPlusCircle, heroTrash } from '@ng-icons/heroicons/outline';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-permissions',
  standalone: true,
  providers: [provideIcons({ heroPlusCircle, heroTrash })],
  imports: [AliasPipe, NgIconComponent, DialogComponent, FilterComponent, ReactiveFormsModule],
  templateUrl: './permissions.component.html',
  styleUrl: './permissions.component.scss',
})
export class PermissionsComponent implements OnInit {
  @ViewChild(DialogComponent, { static: true }) permissionDialog: DialogComponent | undefined;

  filteredPermissions: PermissionModel[] | undefined;
  readonly store = inject(UsermanagerStore);
  readonly permissionAddGroup = new FormGroup({});

  ngOnInit(): void {
    this.store.retrievePermissions();
    this.store.loading$().subscribe((loading) => {
      if (!loading) {
        this.filteredPermissions = this.store.permissions();
      }
    });
    this.generateForm();
  }

  createPermission(): void {
    this.permissionDialog?.openDialog();
  }

  onFilterTerm(term: string) {
    this.filteredPermissions = this.store
      .permissions()
      .filter(
        (permission) =>
          permission.permissionId?.toLowerCase().includes(term.toLowerCase()) ||
          permission.description?.toLowerCase().includes(term.toLowerCase()),
      );
  }

  onAddPermission(): void {
    if (this.permissionAddGroup.invalid) {
      this.permissionAddGroup.markAllAsTouched();
      return;
    }

    this.store.addPermission(this.permissionAddGroup.value as PermissionModel);
    this.closeDialog();
  }

  closeDialog(): void {
    this.permissionDialog?.closeDialog();
  }

  deletePermission(permissionId: string): void {
    this.store.deletePermission(permissionId);
  }

  private generateForm(): void {
    this.permissionAddGroup.addControl('permissionId', new FormControl(undefined, Validators.required));
    this.permissionAddGroup.addControl('allowd', new FormControl(undefined, Validators.required));
    this.permissionAddGroup.addControl('description', new FormControl(undefined, Validators.required));
    this.permissionAddGroup.addControl('operation', new FormControl(undefined, Validators.required));
    this.permissionAddGroup.addControl('type', new FormControl(undefined, Validators.required));
    this.permissionAddGroup.addControl('value', new FormControl(undefined, Validators.required));
  }
}
