import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  
  loginData = {
    nome: '',
    senha: ''
  };

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);


  onSubmit(): void {
    if (!this.loginData.nome || !this.loginData.senha) {
      this.errorMessage.set('O campo de usuário ou senha não foi preenchido!');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.loginData.nome, this.loginData.senha).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isLoading.set(false);
    
        if (err.error && err.error.message) {
          this.errorMessage.set(err.error.message);
        } else if (err.status === 401) {
          this.errorMessage.set('O nome de usuário ou senha está incorreto ou não foi cadastrado!');
        } else if (err.status === 400) {
          this.errorMessage.set('O campo de usuário ou senha não foi preenchido!');
        } else {
          this.errorMessage.set('Falha na comunicação com o servidor!');
        }
      }
    });
  }
}
