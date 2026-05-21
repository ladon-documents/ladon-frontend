import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AppStore } from '../store/app.store';

@Component({
  standalone: true,
  selector: 'login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  public config: { [key: string]: string } | undefined;

  public errorMessage: string | undefined;
  public loginAsset: string | undefined;
  public loginForm: FormGroup;
  readonly #store = inject(AppStore);
  readonly #formBuilder = inject(FormBuilder);
  readonly #activatedRoute = inject(ActivatedRoute);

  constructor() {
    this.loginForm = this.#formBuilder.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  ngOnInit() {
    const redirectUrl = this.#activatedRoute.snapshot.queryParamMap.get('redirectUrl');
    if (redirectUrl) {
      this.#store.setRedirectUrl(redirectUrl);
    }
  }

  login() {
    if (this.loginForm.valid) {
      const { password, email } = this.loginForm.value;
      this.#store.login({ password, email });
    }
  }
}
