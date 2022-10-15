import { Injectable } from '@angular/core';
import axios from 'axios';

@Injectable({
  providedIn: 'root'
})
export class UserApiService {

  async login(email: string, password: string) {
    const res = await axios.post('https://assignment-api.piton.com.tr/api/v1/user/login', {
      email,
      password
    })

    return res.data;
  }
  async register(name: string, email: string, password: string) {
    const res = await axios.post('https://assignment-api.piton.com.tr/api/v1/user/register', {
      email,
      name,
      password
    })

    return res.data;
  }
}
