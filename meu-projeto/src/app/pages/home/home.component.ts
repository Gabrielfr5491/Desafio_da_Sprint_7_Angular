import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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

  currentUser = this.authService.currentUser;

  isSidebarActive = false;
  isSidebarCollapsed = false;

  private readonly MOBILE_BREAKPOINT = 992;

  onLogout(): void {
    this.authService.logout();
  }

  toggleSidebar(): void {
    this.isSidebarActive = !this.isSidebarActive;
  }

  toggleCollapse(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  onLogoClick(): void {
    if (this.isMobile()) {
      this.toggleSidebar();
    } else {
      this.toggleCollapse();
    }
  }

  private isMobile(): boolean {
    return window.innerWidth < this.MOBILE_BREAKPOINT;
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!this.isMobile()) {
      this.isSidebarActive = false;
    } else {
      this.isSidebarCollapsed = false;
    }
  }
}