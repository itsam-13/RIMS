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

  // Perspective tilt for hero interactive 3D fluid art
  tiltX = signal(0);
  tiltY = signal(0);

  onArtMouseMove(event: MouseEvent) {
    const frame = event.currentTarget as HTMLElement;
    const rect = frame.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -9;
    const rotateY = ((x - centerX) / centerX) * 9;
    this.tiltX.set(Math.round(rotateX * 10) / 10);
    this.tiltY.set(Math.round(rotateY * 10) / 10);
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
