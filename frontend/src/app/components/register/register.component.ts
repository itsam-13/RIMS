import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal<boolean>(false);
  showPassword = signal<boolean>(false);
  redirectedFromLogin = false;
  isSignUpActive = signal<boolean>(true);

  loginData = {
    username: '',
    password: ''
  };

  registerData = {
    username: '',
    email: '',
    password: ''
  };

  ngOnInit() {
    const prefillUser = this.route.snapshot.queryParamMap.get('username');
    if (prefillUser) {
      this.registerData.username = prefillUser;
      this.loginData.username = prefillUser;
      this.redirectedFromLogin = true;
    }

    const mode = this.route.snapshot.queryParamMap.get('mode');
    if (mode === 'signin' || mode === 'login') {
      this.isSignUpActive.set(false);
    }
  }

  togglePassword() {
    this.showPassword.update(prev => !prev);
  }

  switchToSignUp() {
    this.isSignUpActive.set(true);
    try {
      window.history.pushState(null, '', '/register');
    } catch {
      // fallback for non-browser/SSR test environments
    }
  }

  switchToSignIn() {
    this.isSignUpActive.set(false);
    try {
      window.history.pushState(null, '', '/login');
    } catch {
      // fallback for non-browser/SSR test environments
    }
  }

  onForgotPassword(event: Event) {
    event.preventDefault();
    this.toastService.info(
      'To reset operator credentials, please contact your warehouse IT administrator or Security Officer.',
      'Password Reset'
    );
  }

  onLogin() {
    const username = this.loginData.username.trim();
    if (!username || !this.loginData.password) {
      this.toastService.warning('Enter your username and password to continue.');
      return;
    }

    this.loading.set(true);
    this.authService.login({ username, password: this.loginData.password }).subscribe({
      next: (res) => {
        this.loading.set(false);
        const name = res.username || username;
        this.toastService.success(`Welcome back, ${name}.`, 'Signed in');
        void this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        const isUserNotFound =
          err.error?.userNotFound === true ||
          (typeof err.error?.error === 'string' &&
            (err.error.error.toLowerCase().includes('no account found') ||
             err.error.error.toLowerCase().includes('not found')));

        if (isUserNotFound) {
          this.toastService.warning(
            `No account found for "${username}". Please sign up first.`,
            'Account not registered'
          );
          this.switchToSignUp();
          this.registerData.username = username;
          return;
        }

        const msg =
          err.error?.error ||
          err.error?.message ||
          'Invalid username or password. Please try again.';
        this.toastService.error(msg, 'Sign in failed');
      }
    });
  }

  onRegister() {
    const username = this.registerData.username.trim();
    const email = this.registerData.email.trim();
    const password = this.registerData.password;

    if (!username || !email || !password) {
      this.toastService.warning('Please complete all fields to create your account.');
      return;
    }

    if (password.length < 6) {
      this.toastService.warning('Password must be at least 6 characters long.');
      return;
    }

    this.loading.set(true);

    this.authService.register({ username, email, password }).subscribe({
      next: (user) => {
        this.loading.set(false);
        this.toastService.success(
          `Account for ${user.username} is ready. Sign in to see your approval status.`,
          'Account created'
        );
        void this.router.navigate(['/login'], {
          queryParams: { username: user.username }
        });
      },
      error: (err) => {
        this.loading.set(false);
        const validationDetails = err.error?.details;
        const validationMessage = validationDetails && typeof validationDetails === 'object'
          ? Object.entries(validationDetails)
              .map(([field, message]) => `${field}: ${message}`)
              .join('; ')
          : '';
        const msg =
          validationMessage ||
          err.error?.error ||
          err.error?.message ||
          'Account creation failed. Please check your information and try again.';
        this.toastService.error(msg, 'Registration failed');
      }
    });
  }
}
