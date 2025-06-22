import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { UsermanagerStore } from '../../store/usermanager.store';
import { FilterComponent } from '../components/filter/filter.component';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { RoleEntryModel } from '../../../api';
import { AliasPipe, DialogComponent } from '@ladon/shared';
import { heroPlusCircle, heroTrash } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-roles',
  standalone: true,
  providers: [provideIcons({ heroPlusCircle, heroTrash })],
  imports: [FilterComponent, NgIconComponent, DialogComponent, AliasPipe],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss',
})
export class RolesComponent implements OnInit {
  @ViewChild(DialogComponent, { static: true }) roleDialog: DialogComponent | undefined;

  filteredRoles: RoleEntryModel[] | undefined;
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

  deleteRole(roleId: string): void {
    this.store.deleteRole(roleId);
  }
}
