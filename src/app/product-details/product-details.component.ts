import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.css']
})
export class ProductDetailsComponent implements OnInit {
  product = {
    id: 0,
    name: "string",
    price: 0,
    image: "string",
    description: "string",
    timeStamp: "2022-10-15T18:18:03.871Z",
    likes: [
      {
        id: 0,
        email: "string",
        password: "string",
        name: "string",
        token: "string",
        timeStamp: 0
      }
    ]
  }
  constructor() { }

  ngOnInit(): void {
  }

}
