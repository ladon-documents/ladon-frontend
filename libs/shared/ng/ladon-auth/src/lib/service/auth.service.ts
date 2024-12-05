import {Injectable} from "@angular/core";
import {AuthenticationService, LoginRequest, User, UsersService} from "@ladon/api";
import {BehaviorSubject, mergeMap, tap} from "rxjs";
import {map} from "rxjs/operators";

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
  user$ = this.userSubject$.asObservable();

  constructor(private as: AuthenticationService, private us: UsersService) {
  //  this.getCurrentUser();
  }

  public login(Login: LoginRequest) {
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
}
