import { Component, ElementRef, HostListener, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css'
})
export class ShellComponent implements OnInit {
  public authService = inject(AuthService);
  @ViewChild('mobileMenuButton') private mobileMenuButton?: ElementRef<HTMLButtonElement>;

  theme = signal<'dark' | 'light'>('light');
  mobileNavOpen = signal(false);
  sidebarCollapsed = signal(false);

  get userInitials(): string {
    const username = this.authService.currentUser()?.username || 'User';
    return username.slice(0, 2).toUpperCase();
  }

  get userRoleLabel(): string {
    const role = this.authService.currentUser()?.role;
    if (role === 'ADMIN') return 'Administrator';
    if (role === 'WAREHOUSE_MANAGER') return 'Warehouse manager';
    if (role === 'SALES') return 'Sales';
    return 'RIMS account';
  }

  ngOnInit() {
    const savedTheme = localStorage.getItem('rims_theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      this.theme.set(savedTheme);
      this.applyTheme(savedTheme);
    }

    const savedSidebarState = localStorage.getItem('rims_sidebar_collapsed');
    if (savedSidebarState !== null) {
      this.sidebarCollapsed.set(savedSidebarState === 'true');
    }
  }

  toggleSidebar() {
    if (typeof window !== 'undefined' && window.innerWidth <= 760) {
      this.mobileNavOpen.update(open => !open);
      return;
    }
    const next = !this.sidebarCollapsed();
    this.sidebarCollapsed.set(next);
    try {
      localStorage.setItem('rims_sidebar_collapsed', String(next));
    } catch {
      // ignore storage access errors
    }
  }

  toggleTheme() {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    localStorage.setItem('rims_theme', next);
    this.applyTheme(next);
  }

  private applyTheme(theme: 'dark' | 'light') {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      theme === 'dark' ? '#151e22' : '#f3f6f7'
    );
  }

  onNavClick() {
    if (this.mobileNavOpen()) {
      this.closeMobileNav();
    }
  }

  closeMobileNav() {
    this.mobileNavOpen.set(false);
    this.mobileMenuButton?.nativeElement.focus();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.mobileNavOpen()) this.closeMobileNav();
  }
}
