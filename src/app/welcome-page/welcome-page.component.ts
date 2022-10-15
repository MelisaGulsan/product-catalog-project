import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Component, ElementRef, ViewChild } from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";
import { UserApiService } from "../services/user-api.service";

@Component({
  selector: "app-welcome-page",
  templateUrl: "./welcome-page.component.html",
  styleUrls: ["./welcome-page.component.css"],
})
export class WelcomePage {
  signUpLoading = false;
  signUpSubmitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {}

  get userEmail() {
    return this.userRegister.get("email");
  }
  get userPass() {
    return this.userRegister.get("password");
  }
  get userName() {
    return this.userRegister.get("name");
  }
  get userSurname() {
    return this.userRegister.get("surname");
  }
  get userPhoneNumber() {
    return this.userRegister.get("phoneNumber");
  }
  @ViewChild("name") name: ElementRef | undefined;
  @ViewChild("email") email: ElementRef | undefined;
  @ViewChild("password") password: ElementRef | undefined;

  async onSignUpSubmit() {
    this.signUpSubmitted = true;
    if (this.userRegister.invalid) {
      return;
    }
    this.signUpLoading = true;

    const s = new UserApiService();

    let formData = this.userRegister.value;

    const res = await s.register(
      formData.name!,
      formData.email!,
      formData.password!
    );
    console.log(res);
  }

  userRegister = new FormGroup({
    email: new FormControl("", [
      Validators.required,
      Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$"),
    ]),
    password: new FormControl("", [
      Validators.required,
      // Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$")
    ]),
    name: new FormControl("", Validators.required),
  });

  @ViewChild("container") container: ElementRef | undefined;

  addSignUpClass() {
    this.container?.nativeElement.classList.add("right-panel-active");
  }

  addSignInClass() {
    this.container?.nativeElement.classList.remove("right-panel-active");
  }
}
