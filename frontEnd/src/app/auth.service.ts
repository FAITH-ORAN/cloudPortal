import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {tap} from "rxjs";

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) { }

  login(username: string, password: string) {
    return this.http.post<any>('http://localhost:3000/login', { username, password }, { withCredentials: true })
      .pipe(tap(response => {
        // Directement dans AuthService, enregistrer le nom d'utilisateur après la connexion réussie
        if (response.username) {
          localStorage.setItem('username', response.username);
          localStorage.setItem('roles', response.roles);
          localStorage.setItem('credits', response.credits.toString());
        }
      }));
  }
}
