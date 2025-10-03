import { Component, computed, inject, OnInit, Signal, signal, ViewChild } from '@angular/core';
import { MappedPermission, MappedUser, UsermanagerService } from '../services/usermanager.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UsermanagerStore } from '../../store/usermanager.store';
import { tap, take } from 'rxjs/operators';
import { PermissionModel, RoleEntryModel, UserEntryModel } from '../../../api';
import { combineLatest, filter, firstValueFrom, switchMap } from 'rxjs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroTrash, heroPlus } from '@ng-icons/heroicons/outline';
import { AliasPipe, DialogComponent } from '@ladon/shared';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DialogType, RoleSetType, UsermanagerFacade, UserSetType } from '../services/usermanager.facade';

@Component({
  selector: 'app-role-details',
  providers: [provideIcons({ heroTrash, heroPlus })],
  imports: [NgIconComponent, AliasPipe, RouterModule, CommonModule, ReactiveFormsModule, DialogComponent],
  templateUrl: './role-details.component.html',
  styleUrls: ['../usermanager.component.scss', './role-details.component.scss'],
})
export class RoleDetailsComponent implements OnInit {
  @ViewChild(DialogComponent, { static: true }) dialogCmp: DialogComponent | undefined;

  role: RoleEntryModel | undefined;
  private readonly route = inject(ActivatedRoute);
  private readonly usermanagerService = inject(UsermanagerService);
  private readonly usermanagerFacade = inject(UsermanagerFacade);
  readonly store = inject(UsermanagerStore);

  dialogTitle: string | undefined;
  permissions = signal<PermissionModel[] | undefined>(undefined);
  userIds = signal<string[] | undefined>(undefined);
  permissionOptions = signal<PermissionModel[] | undefined>(undefined);
  userOptions = signal<UserEntryModel[] | undefined>(undefined);
  roleForm = new FormGroup({});
  users = computed<UserEntryModel[]>(() => {
    const userIds = this.userIds();
    const users = this.store.users();
    return users.filter(({ id }) => userIds?.includes(id));
  });

  mappedPermissions: Signal<MappedPermission[] | undefined> = computed(() => {
    const options = this.permissionOptions();
    const rolePermissions = this.permissions();
    return options?.map((option) => ({
      ...option,
      active: rolePermissions?.some(({ permissionId }) => permissionId === option.permissionId),
    }));
  });

  mappedUsers: Signal<MappedUser[] | undefined> = computed(() => {
    const options = this.userOptions();
    const roleUsers = this.users();
    return options?.map((option) => ({
      ...option,
      active: roleUsers?.some(({ id }) => id === option.id),
    }));
  });

  private usersSet = new Set<UserEntryModel>();
  private userDeletionsSet = new Set<string>();
  private permissionsSet = new Set<PermissionModel>();
  private permissionDeletionsSet = new Set<string>();

  ngOnInit(): void {
    this.generateForm();

    this.route.params
      .pipe(
        tap(({ id }) => {
          this.role = this.store.getRole(id);
        }),
        tap(() => {
          Object.entries(this.role!).forEach(([key, value]) => {
            this.roleForm.patchValue({ [key]: value });
          });
        }),
        switchMap(({ id }) =>
          combineLatest([
            this.usermanagerService.retrievePermissionsByRole(id),
            this.usermanagerService.retrieveUsersByRole(id),
          ]),
        ),
      )
      .subscribe({
        next: (payload) => {
          this.updateViewByPayload(payload);
        },
      });
  }

  onSubmit() {
    this.store
      .updateRole(this.roleForm.value)
      .pipe(
        switchMap(() =>
          combineLatest([
            this.usermanagerService.retrievePermissionsByRole(this.role!.id),
            this.usermanagerService.retrieveUsersByRole(this.role!.id),
          ]),
        ),
      )
      .subscribe({
        next: (payload) => {
          this.updateViewByPayload(payload);
        },
        error: (error) => {
          console.error(error);
          alert('Fehler beim Aktualisieren der Rolle');
        },
      });
  }

  async openDialogType(type: DialogType) {
    const { dialogTitle, payload } = await this.usermanagerFacade.openDialogByType(type);
    this.dialogTitle = dialogTitle;

    if (type === 'permission') {
      this.permissionOptions.set(payload);
    }

    if (type === 'user') {
      this.userOptions.set(payload);
    }

    this.dialogCmp?.openDialog();
  }

  updateByType(event: any, type: RoleSetType, value: MappedUser | PermissionModel) {
    const { checked } = event.target;
    switch (type) {
      case 'user':
        if (checked) {
          this.usersSet.add(value as UserEntryModel);
        } else {
          this.usersSet.delete(value as UserEntryModel);
        }
        this.patchFormByKey('users', this.usersSet);
        break;
      case 'permission':
        if (checked) {
          this.permissionsSet.add(value as PermissionModel);
        } else {
          this.permissionsSet.delete(value as PermissionModel);
        }
        this.patchFormByKey('permissions', this.permissionsSet);
        break;
    }
  }

  removeByType(type: RoleSetType, value: RoleEntryModel | PermissionModel | UserEntryModel | string) {
    switch (type) {
      case 'permission':
        this.permissionsSet.delete(value as PermissionModel);
        this.patchFormByKey('permissions', this.permissionsSet);
        break;
      case 'permissionDeletion':
        this.permissionDeletionsSet.add(value as string);
        this.patchFormByKey('permissionDeletions', this.permissionDeletionsSet);
        break;
      case 'user':
        this.usersSet.delete(value as UserEntryModel);
        this.patchFormByKey('users', this.usersSet);
        break;
      case 'userDeletion':
        this.userDeletionsSet.add(value as string);
        this.patchFormByKey('userDeletions', this.userDeletionsSet);
        break;
      default:
        console.info(`Unknown type: ${type}`);
        break;
    }
  }

  checkFormPatch(type: UserSetType, value: PermissionModel | RoleEntryModel | MappedUser, form: FormGroup) {
    return this.usermanagerFacade.checkFormPatch(type, value, form);
  }

  updateViewByPayload(payload: any[]) {
    const { 0: permissions, 1: users } = payload;
    this.permissions.set(permissions);
    this.userIds.set(users);
  }

  private generateForm() {
    this.roleForm.addControl('id', new FormControl());
    this.roleForm.addControl('users', new FormControl());
    this.roleForm.addControl('permissions', new FormControl());
  }

  private patchFormByKey(key: 'users' | 'userDeletions' | 'permissions' | 'permissionDeletions', set: Set<any>) {
    this.usermanagerFacade.patchFormByKey(key, set, this.roleForm);
  }
}
