export class Product {
  public id: number;
  public name: string;
  public price: number;
  public image: string;
  public description: string;
  public timeStamp: Date;
  public likes: Like[];

  constructor(
    id: number,
    name: string,
    price: number,
    image: string,
    description: string,
    timeStamp: Date,
    likes: Like[]
  ) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.image = image;
    this.description = description;
    this.timeStamp = timeStamp;
    this.likes = likes;
  }
}

export interface Like {
  id: string;
  email: string;
  password: string;
  name: string;
  token: string;
  timeStamp: Date;
}
