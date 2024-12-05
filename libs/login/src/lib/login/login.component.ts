import {Component} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {AuthService} from "@ladon/auth-guard";
import {Router} from "@angular/router";
import {environment} from "@ladon/environment";

@Component({
  selector: "lib-login",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./login.component.html",
  styleUrl: "./login.component.css",

})
export class LoginComponent {
  public config: { [key: string]: string } | undefined;

  public errorMessage: string | undefined;
  public loginAsset: string | undefined;
  public loginForm: FormGroup;


  constructor(private formBuilder: FormBuilder,
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
      const {password, email} = this.loginForm.value;
      this.authService.login({password, email})
          .subscribe((user) => {
            if (user) {
              this.router.navigateByUrl(`${environment.baseHref}/buckets`);
            }
          })
    }
  }

  private checkAuthentificationStatus() {
    this.authService.getCurrentUser()
        .subscribe(user => {
          if (user) this.router.navigateByUrl(`${environment.baseHref}/buckets`);
        })
  }

}
