import axios from "axios";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class ProductApiService {
  async getProducts(token: string) {
    const config = {
      headers: {
        "access-token": token,
      },
    };
    const res = await axios.get(
      "https://assignment-api.piton.com.tr/api/v1/product/all",
      config
    );

    return res.data;
  }

  async getProduct(token: string, id: string) {
    const config = {
      headers: {
        "access-token": token,
      },
      params: {
        id: id,
      },
    };
    const res = await axios.get(
      "https://assignment-api.piton.com.tr/api/v1/product/get/" + id,
      config
    );

    return res.data;
  }
}
