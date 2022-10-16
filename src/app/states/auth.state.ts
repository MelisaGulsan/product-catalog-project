import { Injectable } from "@angular/core";
import { Action, State, StateContext } from "@ngxs/store";
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
  @Action(Login)
  login(ctx: StateContext<AuthStateModel>, action: Login) {
    const state = ctx.getState();
    ctx.patchState({
      token: action.token,
    });
  }
}
