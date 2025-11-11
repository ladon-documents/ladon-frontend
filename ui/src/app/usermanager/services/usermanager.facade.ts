import { inject, Injectable, Type, WritableSignal } from '@angular/core';
import { UsermanagerStore } from '../../store/usermanager.store';
import { filter, firstValueFrom, take } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { MappedPermission, MappedRole, MappedUser } from './usermanager.service';

export type UserSetType = 'role' | 'roleDeletion' | 'permission' | 'permissionDeletion' | 'user';
export type RoleSetType = 'user' | 'permission' | 'userDeletion' | 'permissionDeletion';
export type DialogType = UserSetType | 'password';

@Injectable({
  providedIn: 'root',
})
export class UsermanagerFacade {
  private store = inject(UsermanagerStore);

  returnTitleByType(type: DialogType) {
    switch (type) {
      case 'password':
        return 'Passwort ändern';
      case 'role':
        return 'Rolle hinzufügen';
      case 'permission':
        return 'Berechtigung hinzufügen';
      case 'user':
        return 'Nutzer hinzufügen';
      default:
        return type;
    }
  }

  async openDialogByType(type: DialogType) {
    let payload: any | undefined;

    if (type === 'role') {
      if (this.store.rolesCount() === 0) {
        this.store.retrieveRoles();
        await firstValueFrom(
          this.store.loading$().pipe(
            filter((loading) => !loading),
            take(1),
          ),
        );
      }

      payload = this.store.roles();
    }

    if (type === 'permission') {
      if (this.store.permissionsCount() === 0) {
        this.store.retrievePermissions();
        await firstValueFrom(
          this.store.loading$().pipe(
            filter((loading) => !loading),
            take(1),
          ),
        );
      }

      payload = this.store.permissions();
    }

    if (type === 'user') {
      if (this.store.usersCount() === 0) {
        this.store.retrieveUsers();
        await firstValueFrom(
          this.store.loading$().pipe(
            filter((loading) => !loading),
            take(1),
          ),
        );
      }

      payload = this.store.users();
    }

    return { dialogTitle: this.returnTitleByType(type), payload };
  }

  /**
   * Updates check state for FormControl based on the patched userForm
   */
  checkFormPatch(type: UserSetType, value: MappedPermission | MappedRole | MappedUser, form: FormGroup) {
    switch (type) {
      case 'permission':
        const { permissionId } = value as MappedPermission;
        if (Array.isArray(form.get(`${type}s`)?.value)) {
          // @ts-ignore
          return form.get(`${type}s`)?.value?.some(({ permissionId: pId }) => pId === permissionId);
        }
        return false;
      case 'role':
        const { id } = value as MappedRole;
        if (Array.isArray(form.get(`${type}s`)?.value)) {
          // @ts-ignore
          return form.get(`${type}s`)?.value?.some(({ id: rId }) => rId === id);
        }
        return false;
      case 'user':
        const { id: userId } = value as MappedUser;
        if (Array.isArray(form.get(`${type}s`)?.value)) {
          // @ts-ignore
          return form.get(`${type}s`)?.value?.some(({ id: uId }) => uId === userId);
        }
    }

    return false;
  }

  patchFormByKey(key: string, set: Set<any>, form: FormGroup) {
    form.patchValue({ [key]: Array.from(set) });
    form.markAsDirty();
  }
}
