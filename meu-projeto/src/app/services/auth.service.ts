import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface UserResponse {
  id: number;
  nome: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = 'http://localhost:3001';

 
  readonly currentUser = signal<UserResponse | null>(null);

  constructor() {
  
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedUser = localStorage.getItem('ford_user');
      if (storedUser) {
        try {
          this.currentUser.set(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem('ford_user');
        }
      }
    }
  }

  // login consumindo api
  login(nome: string, senha: string): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/login`, { nome, senha }).pipe(
      tap((user) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('ford_user', JSON.stringify(user));
        }
        this.currentUser.set(user);
      })
    );
  }

 
  logout(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('ford_user');
    }
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }


  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }
}
