import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext } from "@ngxs/store";
import { ProductApiService } from "../services/product-api.service";
import { tap } from "rxjs/operators";
import { Products } from "../products/products.actions";
import { Login } from "../welcome-page/auth.actions";

export class ListProduct {
  users: any;
}

@State<ListProduct>({
  name: "list",
  defaults: {
    users: "",
  },
})
@Injectable()
export class ProductState {
  @Action(Login)
  login(ctx: StateContext<ListProduct>, action: Login) {
    const list = ctx.getState();
  }
}
