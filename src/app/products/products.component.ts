import { Component, OnInit } from "@angular/core";
import { Product } from "../models/product.model";
import { ProductApiService } from "../services/product-api.service";
import { Store } from "@ngxs/store";
import { AuthState } from "../states/auth.state";

@Component({
  selector: "app-products",
  templateUrl: "./products.component.html",
  styleUrls: ["./products.component.css"],
})
export class ProductsComponent implements OnInit {
  productsList: any;
  constructor(
    private productsService: ProductApiService,
    private store: Store
  ) {
    this.productsList = [];
  }

  ngOnInit(): void {
    const token = this.store.selectSnapshot(AuthState.token);
    const products = this.productsService.getProducts(token!).then((data) => {
      this.productsList = data["products"].map(
        (p: any) =>
          new Product(
            p.id,
            p.name,
            p.price,
            "https://assignment-api.piton.com.tr" + p.image,
            p.description,
            p.timeStamp,
            p.likes
          )
      );
    });
  }
}
