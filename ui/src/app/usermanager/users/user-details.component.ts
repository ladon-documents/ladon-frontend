import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UsermanagerStore } from '../../store/usermanager.store';
import { UserEntryModel } from '../../../api';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AliasPipe } from '@ladon/shared';

@Component({
  standalone: true,
  selector: 'app-user-details',
  imports: [ReactiveFormsModule, AliasPipe],
  templateUrl: './user-details.component.html',
  styleUrls: ['../usermanager.component.scss', './user-details.component.scss'],
})
export class UserDetailsComponent implements OnInit {
  constructor(private route: ActivatedRoute) {}

  store = inject(UsermanagerStore);
  user: UserEntryModel | undefined;
  userForm = new FormGroup({});

  ngOnInit(): void {
    this.generateForm();
    this.route.params.subscribe(({ id }) => {
      this.user = this.store.getUser(id);
      this.patchForm(this.user);
    });
  }

  changePassword(id: string | undefined) {
    console.log('No implementation yet', id);
  }

  onSubmit() {
    if (this.userForm.invalid) {
      return;
    }
  }

  private generateForm() {
    this.userForm.addControl('name', new FormControl());
    this.userForm.addControl('email', new FormControl());
    this.userForm.addControl('id', new FormControl());
    this.userForm.addControl('status', new FormControl());
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
