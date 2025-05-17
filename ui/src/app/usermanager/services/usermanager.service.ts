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

  addUser(user: UserWrapperModel) {
    return this.usermanagerApi.addUser(user);
  }
}
