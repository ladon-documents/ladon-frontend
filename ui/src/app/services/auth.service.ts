import {Injectable} from "@angular/core";
import {BehaviorSubject, mergeMap, of, tap} from "rxjs";
import {map} from "rxjs/operators";
import {AuthenticationService, LoginRequest, User, UsersService} from "../../api";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private readonly authConfig = {
    filter: "etc/ui/mind/mf-ladon-auth-api/config/auth.json",
    prefix: "etc/",
    bucket: "_system",
  };
  private userSubject$ = new BehaviorSubject<any>(null);
  private readonly devUser: User = {
    "userId": "admin",
    "fullName": "Armin Strator",
    "email": "info@mind-consulting.de",
    "roles": [
      "admin",
      "user"
    ],
    "imageUrl": undefined,
    "provider": "ladon",
    "emailVerified": "true",
    "homeBucket": "admin"
  }
  user$ = this.userSubject$.asObservable();

  constructor(private as: AuthenticationService, private us: UsersService) {
  //  this.getCurrentUser();
  }

  public login(Login: LoginRequest) {
    if (this.isDevelopmentEnironment()) {
      this.userSubject$.next(this.devUser);
      return of(this.devUser)
    }
    return this.as.authenticateUser(Login).pipe(
        mergeMap((res) => {
          return this.us.getCurrentUser();
        }),
        map((user: User) => {
          this.userSubject$.next(user);
          return user;
        })
    );
  }

  public getCurrentUser() {
    return this.us.getCurrentUser().pipe(
        tap((user: User) => {
          this.userSubject$.next(user);
        })
    );
  }

  private isDevelopmentEnironment() {
    // TODO: implement check for devlopment environment
    return true;
  }
}
