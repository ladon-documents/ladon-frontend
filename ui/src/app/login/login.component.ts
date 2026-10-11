import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LoginRequest } from '@ladon/api';
import { AppStore } from '../store/app.store';

interface LoginFormControls {
  email: FormControl<string>;
  password: FormControl<string>;
  twoFactorCode?: FormControl<string>;
}

@Component({
  standalone: true,
  selector: 'login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit, OnDestroy {
  public config: { [key: string]: string } | undefined;

  public errorMessage: string | undefined;
  public loginAsset: string | undefined;
  readonly #store = inject(AppStore);
  readonly #formBuilder = inject(NonNullableFormBuilder);
  readonly #activatedRoute = inject(ActivatedRoute);
  readonly requiresTwoFactor = this.#store.auth.requiresTwoFactor;
  readonly loginError = this.#store.auth.loginError;
  readonly isAuthenticating = this.#store.auth.isAuthenticating;
  readonly twoFactorInput = viewChild<ElementRef<HTMLInputElement>>('twoFactorInput');
  readonly loginForm: FormGroup<LoginFormControls> = this.#formBuilder.group({
    email: ['', Validators.required],
    password: ['', Validators.required],
  });

  #wasInTwoFactorStep = false;
  #previousLoginError: string | null = null;

  constructor() {
    effect(() => {
      const isInTwoFactorStep = this.requiresTwoFactor();
      const currentLoginError = this.loginError();
      let shouldFocusCode = false;

      if (isInTwoFactorStep && !this.#wasInTwoFactorStep) {
        this.#addTwoFactorControl();
        shouldFocusCode = true;
      } else if (!isInTwoFactorStep && this.#wasInTwoFactorStep) {
        this.#clearAndRemoveTwoFactorControl();
      }

      if (isInTwoFactorStep && currentLoginError !== null && currentLoginError !== this.#previousLoginError) {
        this.loginForm.controls.twoFactorCode?.setValue('');
        shouldFocusCode = true;
      }

      this.#wasInTwoFactorStep = isInTwoFactorStep;
      this.#previousLoginError = currentLoginError;

      if (shouldFocusCode) {
        queueMicrotask(() => this.twoFactorInput()?.nativeElement.focus());
      }
    });
  }

  ngOnInit() {
    const redirectUrl = this.#activatedRoute.snapshot.queryParamMap.get('redirectUrl');
    if (redirectUrl) {
      this.#store.setRedirectUrl(redirectUrl);
    }
  }

  login(): void {
    if (this.loginForm.invalid || this.isAuthenticating()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password, twoFactorCode } = this.loginForm.getRawValue();
    const request: LoginRequest = { email, password };

    if (this.requiresTwoFactor()) {
      request.twoFactorCode = twoFactorCode;
    }

    this.#store.login(request);
  }

  backToCredentials(): void {
    this.#store.resetLoginFlow();
    this.loginForm.controls.password.setValue('');
    this.#clearAndRemoveTwoFactorControl();
    this.#wasInTwoFactorStep = false;
  }

  ngOnDestroy(): void {
    this.loginForm.controls.password.setValue('');
    this.#clearAndRemoveTwoFactorControl();
    this.#store.resetLoginFlow();
  }

  #addTwoFactorControl(): void {
    if (!this.loginForm.controls.twoFactorCode) {
      this.loginForm.addControl(
        'twoFactorCode',
        this.#formBuilder.control('', [Validators.required, Validators.pattern(/^\d{6}$/)]),
      );
    }
  }

  #clearAndRemoveTwoFactorControl(): void {
    const twoFactorCode = this.loginForm.controls.twoFactorCode;
    if (twoFactorCode) {
      this.twoFactorInput()?.nativeElement.blur();
      twoFactorCode.setValue('');
      this.loginForm.removeControl('twoFactorCode');
    }
  }
}
