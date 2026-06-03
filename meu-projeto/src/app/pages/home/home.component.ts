import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly themeService = inject(ThemeService);

  // Expose the current user from auth service signal
  currentUser = this.authService.currentUser;

  // Sidebar toggle state for mobile view responsiveness
  isSidebarActive = false;

  /**
   * Log out of the session
   */
  onLogout(): void {
    this.authService.logout();
  }

  /**
   * Toggle mobile sidebar
   */
  toggleSidebar(): void {
    this.isSidebarActive = !this.isSidebarActive;
  }
}
