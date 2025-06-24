import { Injectable } from '@angular/core';
import { UsermanagerService as UsermanagerApi, UserWrapperModel } from '../../../api';

@Injectable({
  providedIn: 'root',
})
export class UsermanagerService {
  constructor(private usermanagerApi: UsermanagerApi) {}

  retrieveUsers() {
    return this.usermanagerApi.getUsers();
  }

  retrieveRoles() {
    return this.usermanagerApi.getRoles();
  }

  addUser(user: UserWrapperModel) {
    return this.usermanagerApi.addUser(user);
  }

  deleteUser(userId: string) {
    return this.usermanagerApi.deleteUser(userId);
  }
}
