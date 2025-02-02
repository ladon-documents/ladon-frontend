import {Component} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import {environment} from "../../environments/environment";
import {AuthService} from "../services/auth.service";
import {User} from "../../api";

@Component({
  selector: "login",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  public config: { [key: string]: string } | undefined;

  public errorMessage: string | undefined;
  public loginAsset: string | undefined;
  public loginForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
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
      this.authService.login({ password, email }).subscribe((user: User) => {
        if (user) {
          this.router.navigateByUrl(`${environment.baseHref}/buckets`);
        }
      });
    }
  }

  private checkAuthentificationStatus() {
    this.authService.getCurrentUser().subscribe((user: User) => {
      if (user) this.router.navigateByUrl(`${environment.baseHref}/buckets`);
    });
  }
}
