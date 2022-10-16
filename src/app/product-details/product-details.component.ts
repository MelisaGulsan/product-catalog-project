import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { ProductApiService } from "../services/product-api.service";
import { Product } from "../models/product.model";
import { Store } from "@ngxs/store";
import { AuthState } from "../states/auth.state";

@Component({
  selector: "app-product-details",
  templateUrl: "./product-details.component.html",
  styleUrls: ["./product-details.component.css"],
})
export class ProductDetailsComponent implements OnInit {
  product: any;
  id: string | null;

  constructor(
    private _Activatedroute: ActivatedRoute,
    private _router: Router,
    private _productsApiService: ProductApiService,
    private store: Store
  ) {
    this.id = "";
  }
  sub: Subscription | undefined;
  ngOnInit(): void {
    const token = this.store.selectSnapshot(AuthState.token);
    this.sub = this._Activatedroute.paramMap.subscribe((params) => {
      this.id = params.get("id");
      let s = this._productsApiService
        .getProduct(token!, this.id!)
        .then((data) => {
          const p = data["product"];
          this.product = new Product(
            p.id,
            p.name,
            p.price,
            "https://assignment-api.piton.com.tr" + p.image,
            p.description,
            p.timeStamp,
            p.likes
          );
        });
    });
  }
}
