import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext } from "@ngxs/store";
import axios from "axios";
import { map } from "rxjs/operators";
import { UserApiService } from "../services/user-api.service";
import { Login } from "../welcome-page/auth.actions";

export interface AuthStateModel {
  token: string;
}

@State<AuthStateModel>({
  name: "auth",
  defaults: {
    token: "",
  },
})
@Injectable()
export class AuthState {
  @Selector()
  static token(state: AuthStateModel): string | null {
    return state.token;
  }

  @Selector()
  static isAuthenticated(state: AuthStateModel): boolean {
    return !!state.token;
  }

  constructor(private authService: UserApiService) {}

  @Action(Login)
  login(ctx: StateContext<AuthStateModel>, action: Login) {
    const state = ctx.getState();
    state.token = action.token;
    ctx.setState({
      ...state,
    });
  }
}
