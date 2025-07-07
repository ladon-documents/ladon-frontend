import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AppStore } from '../store/app.store';

@Component({
  standalone: true,
  selector: 'login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  public config: { [key: string]: string } | undefined;

  public errorMessage: string | undefined;
  public loginAsset: string | undefined;
  public loginForm: FormGroup;
  readonly #store = inject(AppStore);
  readonly #formBuilder =  inject(FormBuilder);


  constructor() {
    this.loginForm = this.#formBuilder.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  login() {
    if (this.loginForm.valid) {
      const { password, email } = this.loginForm.value;
      this.#store.login({ password, email });
    }
  }

}
