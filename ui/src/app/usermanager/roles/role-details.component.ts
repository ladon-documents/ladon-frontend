import {
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  QueryList,
  Signal,
  signal,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { MappedPermission, MappedUser, UsermanagerService } from '../services/usermanager.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UsermanagerStore } from '../../store/usermanager.store';
import { tap } from 'rxjs/operators';
import { Permission, RoleEntry, UserEntry } from '@ladon/api';
import { combineLatest, switchMap } from 'rxjs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroTrash, heroPlus } from '@ng-icons/heroicons/outline';
import { AliasPipe, DialogComponent, PillComponent } from '@ladon/shared';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DialogType, RoleSetType, UsermanagerFacade, UserSetType } from '../services/usermanager.facade';

@Component({
  selector: 'app-role-details',
  providers: [provideIcons({ heroTrash, heroPlus }), UsermanagerFacade],
  imports: [
    NgIconComponent,
    AliasPipe,
    RouterModule,
    CommonModule,
    ReactiveFormsModule,
    DialogComponent,
    PillComponent,
  ],
  templateUrl: './role-details.component.html',
  styleUrl: './role-details.component.scss',
})
export class RoleDetailsComponent implements OnInit {
  @ViewChild(DialogComponent, { static: true }) dialogCmp: DialogComponent | undefined;
  @ViewChildren('userCheckbox') userCheckbox: QueryList<ElementRef<HTMLInputElement>> | undefined;
  @ViewChildren('permissionCheckbox') permissionCheckbox: QueryList<ElementRef<HTMLInputElement>> | undefined;

  role: RoleEntry | undefined;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly usermanagerService = inject(UsermanagerService);
  private readonly usermanagerFacade = inject(UsermanagerFacade);
  readonly store = inject(UsermanagerStore);

  dialogTitle: string | undefined;
  permissions = signal<Permission[] | undefined>(undefined);
  patchedPermissions = computed<Permission[] | undefined>(() => {
    const permissions = this.permissions();
    const deletions = Array.from(this.permissionDeletionsSet());
    return permissions?.filter(({ permissionId }) => !deletions.some(({ permissionId: pId }) => pId === permissionId));
  });
  permissionOptions = signal<Permission[] | undefined>(undefined);
  userOptions = signal<UserEntry[] | undefined>(undefined);
  roleForm = new FormGroup({});
  userIds = signal<string[] | undefined>(undefined);
  users = computed<UserEntry[]>(() => {
    const userIds = this.userIds();
    const users = this.store.users();
    return users.filter(({ id }) => userIds?.includes(id));
  });

  patchedUsers = computed<UserEntry[] | undefined>(() => {
    const users = this.users();
    const deletions = Array.from(this.userDeletionsSet());
    return users.filter(({ id }) => !deletions.some(({ id: uId }) => uId === id));
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

  private usersSet = new Set<UserEntry>();
  private permissionsSet = new Set<Permission>();
  private userDeletionsSet = signal(new Set<UserEntry>());
  private permissionDeletionsSet = signal(new Set<Permission>());

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

  async onLabelEmit(type: UserSetType, label: string | undefined) {
    if (label) {
      await this.router.navigate([`../../${type}s/${label}`], { relativeTo: this.route });
    }
  }

  updateByType(event: any, type: RoleSetType, value: MappedUser | Permission) {
    const { checked } = event.target;
    switch (type) {
      case 'user':
        if (checked) {
          this.usersSet.add(value as UserEntry);
        } else {
          this.usersSet.delete(value as UserEntry);
        }
        this.patchFormByKey('users', this.usersSet);
        break;
      case 'permission':
        if (checked) {
          this.permissionsSet.add(value as Permission);
        } else {
          this.permissionsSet.delete(value as Permission);
        }
        this.patchFormByKey('permissions', this.permissionsSet);
        break;
    }
  }

  deleteRole() {
    this.store.deleteRole(this.role!.id);
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  removeByType(type: RoleSetType, value: RoleEntry | Permission | UserEntry) {
    switch (type) {
      case 'permission':
        this.permissionsSet.delete(value as Permission);
        this.patchFormByKey('permissions', this.permissionsSet);
        break;
      case 'permissionDeletion':
        this.usermanagerFacade.addAndSetSignal(value, this.permissionDeletionsSet);
        this.patchFormByKey('permissionDeletions', this.permissionDeletionsSet());
        break;
      case 'user':
        this.usersSet.delete(value as UserEntry);
        this.patchFormByKey('users', this.usersSet);
        break;
      case 'userDeletion':
        this.usermanagerFacade.addAndSetSignal(value, this.userDeletionsSet);
        this.patchFormByKey('userDeletions', this.userDeletionsSet());
        break;
      default:
        console.info(`Unknown type: ${type}`);
        break;
    }
  }

  checkFormPatch(type: UserSetType, value: Permission | RoleEntry | MappedUser, form: FormGroup) {
    return this.usermanagerFacade.checkFormPatch(type, value, form);
  }

  updateViewByPayload(payload: any[]) {
    const { 0: permissions, 1: users } = payload;
    this.permissions.set(permissions);
    this.userIds.set(users);
    this.clearRolesAndPermissions();
    this.clearCheckedStates();
  }

  private clearRolesAndPermissions() {
    this.usersSet.clear();
    this.permissionsSet.clear();
    this.usermanagerFacade.clearAndSetSignal(this.userDeletionsSet);
    this.usermanagerFacade.clearAndSetSignal(this.permissionDeletionsSet);
    this.roleForm.get('users')?.reset();
    this.roleForm.get('permissions')?.reset();
  }

  private clearCheckedStates() {
    this.userCheckbox
      ?.filter((checkbox) => checkbox.nativeElement.disabled === false)
      .forEach((checkbox) => (checkbox.nativeElement.checked = false));
    this.permissionCheckbox
      ?.filter((checkbox) => checkbox.nativeElement.disabled === false)
      .forEach((checkbox) => (checkbox.nativeElement.checked = false));
  }

  private generateForm() {
    this.roleForm.addControl('id', new FormControl());
    this.roleForm.addControl('users', new FormControl());
    this.roleForm.addControl('userDeletions', new FormControl());
    this.roleForm.addControl('permissions', new FormControl());
    this.roleForm.addControl('permissionDeletions', new FormControl());
  }

  private patchFormByKey(key: 'users' | 'userDeletions' | 'permissions' | 'permissionDeletions', set: Set<any>) {
    this.usermanagerFacade.patchFormByKey(key, set, this.roleForm);
  }
}
