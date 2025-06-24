import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { AliasPipe, DialogComponent } from '@ladon/shared';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { FilterComponent } from '../components/filter/filter.component';
import { UsermanagerStore } from '../../store/usermanager.store';
import { PermissionModel } from '../../../api';
import { heroPlusCircle, heroTrash } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-permissions',
  standalone: true,
  providers: [provideIcons({ heroPlusCircle, heroTrash })],
  imports: [AliasPipe, NgIconComponent, DialogComponent, FilterComponent],
  templateUrl: './permissions.component.html',
  styleUrl: './permissions.component.scss',
})
export class PermissionsComponent implements OnInit {
  @ViewChild(DialogComponent, { static: true }) permissionDialog: DialogComponent | undefined;

  filteredPermissions: PermissionModel[] | undefined;
  readonly store = inject(UsermanagerStore);

  ngOnInit(): void {
    this.store.retrievePermissions();
    this.store.loading$().subscribe((loading) => {
      if (!loading) {
        this.filteredPermissions = this.store.permissions();
      }
    });
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
  deletePermission(permissionId: string): void {
    this.store.deletePermission(permissionId);
  }
}
