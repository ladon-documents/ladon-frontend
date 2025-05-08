import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { UserModel } from '../../api';
import { AppStore } from '../store/app.store';

@Component({
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

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.checkAuthentificationStatus();
  }

  login() {
    if (this.loginForm.valid) {
      const { password, email } = this.loginForm.value;
      this.#store.login({ password, email });
    }
  }

  private checkAuthentificationStatus() {
    const auth = this.#store.auth;
    if (auth.isAuthenticated() && auth.user()) {
      this.router.navigateByUrl(`${environment.baseHref}/buckets`);
    }
  }
}
