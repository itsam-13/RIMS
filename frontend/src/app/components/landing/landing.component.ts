import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {
  public authService = inject(AuthService);

  mobileNavOpen = signal(false);

  // Subtle pointer parallax for hero warehouse illustration (4–6px limit)
  tiltX = signal(0);
  tiltY = signal(0);

  onArtMouseMove(event: MouseEvent) {
    const frame = event.currentTarget as HTMLElement;
    const rect = frame.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // Limit movement to ~5px in each direction
    const moveX = ((x - centerX) / centerX) * 5;
    const moveY = ((y - centerY) / centerY) * 5;
    this.tiltX.set(Math.round(moveX * 10) / 10);
    this.tiltY.set(Math.round(moveY * 10) / 10);
  }

  resetArtTilt() {
    this.tiltX.set(0);
    this.tiltY.set(0);
  }

  toggleMobileNav() {
    this.mobileNavOpen.update(v => !v);
  }

  closeMobileNav() {
    this.mobileNavOpen.set(false);
  }
}
