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
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { UsermanagerStore } from '../../store/usermanager.store';
import { PermissionModel, UserEntryModel, RoleEntryModel } from '../../../api';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { AliasPipe, DialogComponent, PillComponent } from '@ladon/shared';
import { combineLatest, switchMap, tap, of } from 'rxjs';
import { UsermanagerService, MappedPermission, MappedRole } from '../services/usermanager.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroPlus, heroTrash } from '@ng-icons/heroicons/outline';
import { CommonModule } from '@angular/common';
import { DialogType, UsermanagerFacade, UserSetType } from '../services/usermanager.facade';

@Component({
  standalone: true,
  selector: 'app-user-details',
  providers: [provideIcons({ heroTrash, heroPlus }), UsermanagerFacade],
  imports: [
    ReactiveFormsModule,
    NgIconComponent,
    AliasPipe,
    RouterModule,
    DialogComponent,
    PillComponent,
    CommonModule,
  ],
  templateUrl: './user-details.component.html',
  styleUrls: ['../usermanager.component.scss', './user-details.component.scss'],
})
export class UserDetailsComponent implements OnInit {
  @ViewChild(DialogComponent, { static: true }) dialogCmp: DialogComponent | undefined;
  @ViewChildren('roleCheckbox') roleCheckbox: QueryList<ElementRef<HTMLInputElement>> | undefined;
  @ViewChildren('permissionCheckbox') permissionCheckbox: QueryList<ElementRef<HTMLInputElement>> | undefined;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly usermanagerService: UsermanagerService,
    private readonly usermanagerFacade: UsermanagerFacade,
  ) {}

  store = inject(UsermanagerStore);
  user: UserEntryModel | undefined;
  userForm = new FormGroup({});
  passwordForm = new FormGroup({});
  userRoles = signal<string[] | undefined>(undefined);
  patchedRoles = computed<string[] | undefined>(() => {
    const roles = this.userRoles();
    const deletions = Array.from(this.roleDeletionsSet());
    return roles?.filter((roleId) => !deletions.includes(roleId));
  });
  userPermissions = signal<PermissionModel[] | undefined>(undefined);
  patchedPermissions = computed<PermissionModel[] | undefined>(() => {
    const permissions = this.userPermissions();
    const deletions = Array.from(this.permissionDeletionsSet());
    return permissions?.filter(({ permissionId }) => !deletions.includes(permissionId));
  });
  roleOptions = signal<RoleEntryModel[] | undefined>(undefined);
  permissionOptions = signal<PermissionModel[] | undefined>(undefined);
  dialogTitle = '';

  private rolesSet = new Set<RoleEntryModel>();
  private permissionsSet = new Set<PermissionModel>();
  private roleDeletionsSet = signal(new Set<string>());
  private permissionDeletionsSet = signal(new Set<string>());

  mappedRoleOptions: Signal<MappedRole[] | undefined> = computed(() => {
    const options = this.roleOptions();
    const userRoles = this.userRoles();

    return options?.map((option) => ({
      ...option,
      active: userRoles?.includes(option.id),
    }));
  });

  mappedPermissionOptions: Signal<MappedPermission[] | undefined> = computed(() => {
    const options = this.permissionOptions();
    const userPermissions = this.userPermissions();

    return options?.map((option) => ({
      ...option,
      active: userPermissions?.some(({ permissionId }) => permissionId === option.permissionId),
    }));
  });

  ngOnInit(): void {
    this.generateForm();
    this.generatePasswordForm();

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
        }),
        tap(() => {
          Object.entries(this.user!).forEach(([key, value]) => {
            this.userForm.patchValue({ [key]: value });
          });
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

  async onLabelEmit(type: UserSetType, label: string | undefined) {
    if (label) {
      await this.router.navigate([`../../${type}s/${label}`], { relativeTo: this.route });
    }
  }

  onSubmit() {
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

  async openDialogType(type: DialogType) {
    const { dialogTitle, payload } = await this.usermanagerFacade.openDialogByType(type);
    this.dialogTitle = dialogTitle;

    if (type === 'role') {
      this.roleOptions.set(payload);
    }

    if (type === 'permission') {
      this.permissionOptions.set(payload);
    }

    this.dialogCmp?.openDialog();
  }

  checkFormPatch(type: UserSetType, value: PermissionModel | RoleEntryModel, form: FormGroup) {
    return this.usermanagerFacade.checkFormPatch(type, value, form);
  }

  private clearCheckedStates() {
    this.roleCheckbox
      ?.filter((checkbox) => checkbox.nativeElement.disabled === false)
      .forEach((checkbox) => (checkbox.nativeElement.checked = false));
    this.permissionCheckbox
      ?.filter((checkbox) => checkbox.nativeElement.disabled === false)
      .forEach((checkbox) => (checkbox.nativeElement.checked = false));
  }

  private checkPasswords: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('passwordConfirm')?.value;
    return password === confirmPassword ? null : { notSame: true };
  };

  private updatePayload(payload: any[], skipUserPatch = true) {
    const { 0: user, 1: roles, 2: permissions } = payload;
    if (!skipUserPatch) {
      this.store.patchUsersWithUser(user);
    }
    this.userRoles.set(roles);
    this.userPermissions.set(permissions);
    this.clearRolesAndPermissions();
    this.clearCheckedStates();
  }

  private clearRolesAndPermissions() {
    this.rolesSet.clear();
    this.permissionsSet.clear();
    this.usermanagerFacade.clearAndSetSignal(this.roleDeletionsSet);
    this.usermanagerFacade.clearAndSetSignal(this.permissionDeletionsSet);
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
        this.patchFormByType('roles', this.rolesSet);
        break;
      case 'permission':
        if (checked) {
          this.permissionsSet.add(value as PermissionModel);
        } else {
          this.permissionsSet.delete(value as PermissionModel);
        }
        this.patchFormByType('permissions', this.permissionsSet);
        break;
      default:
        console.info(`Unknown type: ${type}`);
        break;
    }
  }

  closeDialogEmit() {
    this.passwordForm.reset();
  }

  deleteUser() {
    this.store.deleteUser(this.user!.id);
    this.router.navigate(['../'], { relativeTo: this.route });
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
        this.patchFormByType('roles', this.rolesSet);
        break;
      case 'roleDeletion':
        this.usermanagerFacade.addAndSetSignal(value, this.roleDeletionsSet);
        this.patchFormByType('roleDeletions', this.roleDeletionsSet());
        break;
      case 'permission':
        this.permissionsSet.delete(value as PermissionModel);
        this.patchFormByType('permissions', this.permissionsSet);
        break;
      case 'permissionDeletion':
        this.usermanagerFacade.addAndSetSignal((value as PermissionModel).permissionId, this.permissionDeletionsSet);
        this.patchFormByType('permissionDeletions', this.permissionDeletionsSet());
        break;
      default:
        console.info(`Unknown type: ${type}`);
        break;
    }
  }

  async onPasswordSubmit() {
    const id = this.user?.id;
    const password = this.passwordForm.get('password')?.value;
    if (id && password) {
      await this.store.updateUserCredentials(id, password);
      this.dialogCmp?.closeDialog();
      return;
    }

    alert('Technisches Problem - Passwortänderung nicht möglich');
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

  private generatePasswordForm() {
    this.passwordForm?.addControl(
      'password',
      new FormControl(undefined, [Validators.required, Validators.minLength(4)]),
    );
    this.passwordForm?.addControl(
      'passwordConfirm',
      new FormControl(undefined, [Validators.required, Validators.minLength(4)]),
    );
    this.passwordForm?.setValidators(this.checkPasswords);
  }

  private patchFormByType(key: 'roles' | 'roleDeletions' | 'permissions' | 'permissionDeletions', set: Set<any>) {
    this.usermanagerFacade.patchFormByKey(key, set, this.userForm);
  }
}
