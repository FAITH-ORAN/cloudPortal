import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private router: Router) {}

  isLoggedIn(): boolean {
    return !!localStorage.getItem('username');
  }
}

export const AuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const isLoggedIn = authService.isLoggedIn();

  if (!isLoggedIn) {
    const router = inject(Router);
    router.navigate(['/login']);
    return false;
  }

  return true;
};
