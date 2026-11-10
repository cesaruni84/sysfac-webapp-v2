import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Usuario, UsuarioForm } from '../models';
import { SessionService } from './session.service';

/** URL de login; el interceptor la usa para no redirigir ante un 401 de credenciales. */
export const LOGIN_URL = `${environment.apiUrl}/login`;

/** Equivalente a `SigninService` de v1 (login/logout). */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);

  /** POST {apiUrl}/login con el UsuarioForm; al responder guarda el Usuario en sesión. */
  login(user: UsuarioForm): Observable<Usuario> {
    return this.http
      .post<Usuario>(LOGIN_URL, user)
      .pipe(tap((usuario) => this.session.setUserLoggedIn(usuario)));
  }

  /** v1: elimina `currentUser` de localStorage. */
  logout(): void {
    this.session.deleteUserLoggedIn();
  }
}
