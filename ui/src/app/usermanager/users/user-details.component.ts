import { Component, computed, inject, OnInit, Signal, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UsermanagerStore } from '../../store/usermanager.store';
import { PermissionModel, UserEntryModel, RoleEntryModel } from '../../../api';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AliasPipe, DialogComponent } from '@ladon/shared';
import { combineLatest, switchMap, tap, of } from 'rxjs';
import { UsermanagerService } from '../services/usermanager.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroPlus, heroTrash } from '@ng-icons/heroicons/outline';
import { CommonModule } from '@angular/common';

type UserSetType = 'role' | 'roleDeletion' | 'permission' | 'permissionDeletion';

interface MappedRole extends RoleEntryModel {
  active?: boolean;
}

interface MappedPermission extends PermissionModel {
  active?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-user-details',
  providers: [provideIcons({ heroTrash, heroPlus })],
  imports: [ReactiveFormsModule, NgIconComponent, AliasPipe, RouterModule, DialogComponent, CommonModule],
  templateUrl: './user-details.component.html',
  styleUrls: ['../usermanager.component.scss', './user-details.component.scss'],
})
export class UserDetailsComponent implements OnInit {
  @ViewChild(DialogComponent, { static: true }) dialogCmp: DialogComponent | undefined;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly usermanagerService: UsermanagerService,
  ) {}

  store = inject(UsermanagerStore);
  user: UserEntryModel | undefined;
  userForm = new FormGroup({});
  userRoles = signal<string[] | undefined>(undefined);
  userPermissions = signal<PermissionModel[] | undefined>(undefined);
  roleOptions = signal<RoleEntryModel[] | undefined>(undefined);
  permissionOptions = signal<PermissionModel[] | undefined>(undefined);
  dialogTitle = '';

  private rolesSet = new Set<RoleEntryModel>();
  private roleDeletionsSet = new Set<string>();
  private permissionsSet = new Set<PermissionModel>();
  private permissionDeletionsSet = new Set<string>();

  mappedRoleOptions: Signal<MappedRole[] | undefined> = computed(() => {
    const options = this.roleOptions();
    const userRoles = this.userRoles();

    return options?.map((option) => {
      if (userRoles?.includes(option.id)) {
        return {
          ...option,
          active: true,
        };
      }

      return option;
    });
  });

  mappedPermissionOptions: Signal<MappedPermission[] | undefined> = computed(() => {
    const options = this.permissionOptions();
    const userPermissions = this.userPermissions();

    return options?.map((option) => {
      if (userPermissions?.some(({ permissionId }) => permissionId === option.permissionId)) {
        return {
          ...option,
          active: true,
        };
      }
      return option;
    });
  });

  ngOnInit(): void {
    this.generateForm();

    this.store.loading$().subscribe((loading) => {
      if (!loading) {
        this.roleOptions.set(this.store.roles());
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
            of(this.user),
            this.usermanagerService.retrieveRoleForUser(id),
            this.usermanagerService.retrievePermissionForUser(id),
          ]),
        ),
      )
      .subscribe({
        next: (payload) => {
          this.updatePayload(payload);
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

    this.store
      .updateUser(this.userForm.value)
      .pipe(
        switchMap(() =>
          combineLatest([
            this.usermanagerService.retrieveUser(this.user!.id),
            this.usermanagerService.retrieveRoleForUser(this.user!.id),
            this.usermanagerService.retrievePermissionForUser(this.user!.id),
          ]),
        ),
      )
      .subscribe({
        next: (payload) => {
          this.updatePayload(payload, false);
        },
        error: (error) => {
          console.error('Error updating user:', error);
          alert('Fehler beim Aktualisieren des Benutzers');
        },
      });
  }

  openDialogType(type: UserSetType) {
    switch (type) {
      case 'role':
        this.dialogTitle = 'Rolle hinzufügen';
        this.getRolesOrRetrieve();
        break;
      case 'permission':
        this.dialogTitle = 'Berechtigung hinzufügen';
        this.getPermissionsOrRetrieve();
        break;
    }

    this.dialogCmp?.openDialog();
  }

  /**
   * Updates check state for FormControl based on the patched userForm
   */
  checkFormPatch(type: UserSetType, value: PermissionModel | RoleEntryModel) {
    switch (type) {
      case 'permission':
        const { permissionId } = value as PermissionModel;
        if (Array.isArray(this.userForm.get(type)?.value)) {
          // @ts-ignore
          return this.userForm.get(type)?.value?.some(({ permissionId: pId }) => pId === permissionId);
        }
        break;
      case 'role':
        const { id } = value as RoleEntryModel;
        if (Array.isArray(this.userForm.get(type)?.value)) {
          // @ts-ignore
          return this.userForm.get(type)?.value?.some(({ id: rId }) => rId === id);
        }
        break;
    }

    return false;
  }

  private getRolesOrRetrieve() {
    if (this.store.roles().length === 0) {
      this.store.retrieveRoles();
    }

    this.roleOptions.set(this.store.roles());
  }

  private getPermissionsOrRetrieve() {
    if (this.store.permissions().length === 0) {
      this.store.retrievePermissions();
    }

    this.permissionOptions.set(this.store.permissions());
  }

  private updatePayload(payload: any[], skipUserPatch = true) {
    const { 0: user, 1: roles, 2: permissions } = payload;
    if (!skipUserPatch) {
      this.store.patchUsersWithUser(user);
    }
    this.userRoles.set(roles);
    this.userPermissions.set(permissions);
    this.clearRolesAndPermissions();
  }

  private clearRolesAndPermissions() {
    this.rolesSet.clear();
    this.roleDeletionsSet.clear();
    this.permissionsSet.clear();
    this.permissionDeletionsSet.clear();
    this.userForm.get('roles')?.reset();
    this.userForm.get('permissions')?.reset();
  }

  /**
   * Updates Set and FormControl based on passed checkbox state
   * @param event
   * @param type
   * @param value
   */
  updateByType(event: any, type: UserSetType, value: RoleEntryModel | PermissionModel) {
    const { checked } = event.target;
    switch (type) {
      case 'role':
        if (checked) {
          this.rolesSet.add(value as RoleEntryModel);
        } else {
          this.rolesSet.delete(value as RoleEntryModel);
        }
        this.patchFormByType('role');
        break;
      case 'permission':
        if (checked) {
          this.permissionsSet.add(value as PermissionModel);
        } else {
          this.permissionsSet.delete(value as PermissionModel);
        }
        this.patchFormByType('permission');
        break;
      default:
        console.info(`Unknown type: ${type}`);
        break;
    }
  }

  /**
   * Deletes from Set and updates FormControl
   * @param type
   * @param value
   */
  removeByType(type: UserSetType, value: RoleEntryModel | PermissionModel | string) {
    switch (type) {
      case 'role':
        this.rolesSet.delete(value as RoleEntryModel);
        this.patchFormByType('role');
        break;
      case 'roleDeletion':
        this.roleDeletionsSet.add(value as string);
        this.patchFormByType('roleDeletion');
        break;
      case 'permission':
        this.permissionsSet.delete(value as PermissionModel);
        this.patchFormByType('permission');
        break;
      case 'permissionDeletion':
        this.permissionDeletionsSet.add(value as string);
        this.patchFormByType('permissionDeletion');
        break;
      default:
        console.info(`Unknown type: ${type}`);
        break;
    }
  }

  private generateForm() {
    this.userForm.addControl('name', new FormControl(undefined, [Validators.required]));
    this.userForm.addControl('email', new FormControl(undefined, [Validators.email]));
    this.userForm.addControl('id', new FormControl());
    this.userForm.addControl('status', new FormControl());
    this.userForm.addControl('roles', new FormControl());
    this.userForm.addControl('permissions', new FormControl());
    this.userForm.addControl('roleDeletions', new FormControl());
    this.userForm.addControl('permissionDeletions', new FormControl());
    if (!this.user) {
      return;
    }
    Object.entries(this.user).forEach(([key, value]) => {
      this.userForm.addControl(key, new FormControl(value));
    });
  }

  private patchFormByType(type: UserSetType) {
    switch (type) {
      case 'role':
        this.userForm.patchValue({ roles: Array.from(this.rolesSet) });
        break;
      case 'roleDeletion':
        this.userForm.patchValue({ roleDeletions: Array.from(this.roleDeletionsSet) });
        break;
      case 'permission':
        this.userForm.patchValue({ permissions: Array.from(this.permissionsSet) });
        break;
      case 'permissionDeletion':
        this.userForm.patchValue({ permissionDeletions: Array.from(this.permissionDeletionsSet) });
        break;
    }

    this.userForm.markAsDirty();
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
