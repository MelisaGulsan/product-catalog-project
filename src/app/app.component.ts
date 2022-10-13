import { Component,VERSION } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  constructor(private http: HttpClient) { }

  get userEmail() {
    return this.userRegister.get('email')
  }
  get userPass() {
    return this.userRegister.get('password')
  } get userName() {
    return this.userRegister.get('name')
  } get userSurname() {
    return this.userRegister.get('surname')
  }
  get userPhoneNumber() {
    return this.userRegister.get('phoneNumber')
  }
  onRegister() {
    let formData = this.userRegister.value;
    let data = {
      "name": formData.name,
      "password": formData.password,
      "email": formData.email
    }
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Access-Control-Allow-Origin', '*');
    //.set('Accept', 'application/json');

    // let options = { headers: httpHeaders };

    //this.http.post<Article>(this.url, article, options);

    console.log(headers);
    this.http.post(
      "https://assignment-api.piton.com.tr/api/v1/user/register",
      data)
      .subscribe((res) => { console.log(res) });

  }

  title = 'email-validation-tutorial';
  userRegister = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$")]),
    password: new FormControl('', [
      Validators.required,
      Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$")]),
    name: new FormControl('',
      Validators.required),
    surname: new FormControl('',
      Validators.required),
    phoneNumber: new FormControl('',
      Validators.required)
  });

}