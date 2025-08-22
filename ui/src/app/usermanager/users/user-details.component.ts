import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UsermanagerStore } from '../../store/usermanager.store';
import { PermissionModel, UserEntryModel, RoleEntryModel } from '../../../api';
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
  // filteredRoles: RoleEntryModel[] | undefined;
  // filteredPermissions: PermissionModel[] | undefined;
  userPermissions: PermissionModel[] | undefined;

  roleOptions = signal<RoleEntryModel[] | undefined>(undefined);
  permissionOptions = signal<PermissionModel[] | undefined>(undefined);

  filteredRoles = computed(() => {
    const options = this.roleOptions();
    return options?.filter(({ id }) => !this.userRoles?.includes(id));
  });

  filteredPermissions = computed(() => {
    const options = this.permissionOptions();
    return options?.filter(
      ({ permissionId }) => !this.userPermissions?.some(({ permissionId: id }) => id === permissionId),
    );
  });

  private rolesSet = new Set<RoleEntryModel>();
  private permissionsSet = new Set<PermissionModel>();

  ngOnInit(): void {
    this.generateForm();
    this.store.loading$().subscribe((loading) => {
      if (!loading) {
        this.roleOptions.set(this.store.roles());
        // this.filteredRoles = this.store.roles().filter(({ id }) => !this.userRoles?.includes(id));
        this.permissionOptions.set(this.store.permissions());
      }
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

    this.store.updateUser(this.userForm.value);
  }

  getRolesOrRetrieve() {
    if (this.store.roles().length === 0) {
      this.store.retrieveRoles();
      return;
    }

    this.roleOptions.set(this.store.roles());
    // this.filteredRoles = this.store.roles().filter(({ id }) => !this.userRoles?.includes(id));
  }

  getPermissionsOrRetrieve() {
    if (this.store.permissions().length === 0) {
      this.store.retrievePermissions();
      return;
    }

    this.permissionOptions.set(this.store.permissions());

    // this.filteredPermissions = this.store
    //   .permissions()
    //   .filter(({ permissionId }) => !this.userPermissions?.some(({ permissionId: id }) => id === permissionId));
  }

  addToMap(type: string, value: RoleEntryModel | PermissionModel) {
    if (type === 'role') {
      this.rolesSet.add(value as RoleEntryModel);
      this.userForm.patchValue({ [type]: this.rolesSet.values() });
      this.roleOptions.update((prev) => prev?.filter(({ id }) => id !== (value as RoleEntryModel).id));
    } else if (type === 'permission') {
      this.permissionsSet.add(value as PermissionModel);
      this.userForm.patchValue({ [type]: this.permissionsSet.values() });
      this.permissionOptions.update((prev) =>
        prev?.filter(({ permissionId }) => permissionId !== (value as PermissionModel).permissionId),
      );
    }
  }

  removeFromMap(type: string, value: string) {
    // this.postMap.get(type)?.delete(value);
  }

  private generateForm() {
    this.userForm.addControl('name', new FormControl());
    this.userForm.addControl('email', new FormControl());
    this.userForm.addControl('id', new FormControl());
    this.userForm.addControl('status', new FormControl());
    this.userForm.addControl('roles', new FormControl(this.rolesSet));
    this.userForm.addControl('permissions', new FormControl(this.permissionsSet));
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
