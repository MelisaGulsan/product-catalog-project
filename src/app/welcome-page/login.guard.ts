import { Injectable } from "@angular/core";
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from "@angular/router";
import { Store } from "@ngxs/store";
import { AuthState } from "../states/auth.state";

@Injectable()
export class LoginGuard implements CanActivate {
  constructor(private _store: Store, private router: Router) {}

  canActivate() {
    const isAuthenticated = this._store.selectSnapshot(
      AuthState.isAuthenticated
    );
    if (!isAuthenticated) {
      this.router.navigate(["/"]);
    }
    return isAuthenticated;
  }
}
