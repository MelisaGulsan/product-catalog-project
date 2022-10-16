export class Login {
  static readonly type = "[Auth] Login";
  constructor(public token: string, public email: string) {}
}

export class Register {
  static readonly type = "[Auth] Register";
  constructor(public token: string) {}
}
