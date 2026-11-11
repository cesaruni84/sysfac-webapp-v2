import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { AuthService } from '../../../core/auth';
import { Empresa, ErrorResponse, UsuarioForm } from '../../../core/models';
import { EmpresaService } from '../../../core/services/empresas/empresa.service';

/** URL a la que se navega tras un login correcto (igual que v1). */
export const URL_TRAS_LOGIN = '/dashboard';

/** Mensaje cuando el backend no devuelve `errorMessage` (p. ej. error de red). */
export const MENSAJE_LOGIN_GENERICO = 'No se pudo iniciar sesión. Intente nuevamente.';

/**
 * Login + selección de empresa (v1: `views/sessions/signin`).
 * Solo pinta la tarjeta: el fondo, el centrado y la marca los aporta `LayoutAuth`.
 */
@Component({
  selector: 'app-signin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    MessageModule,
    SelectModule,
  ],
  host: { class: 'block w-full max-w-md' },
  templateUrl: './signin.html',
})
export class Signin {
  private readonly auth = inject(AuthService);
  private readonly empresaService = inject(EmpresaService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly empresas = signal<Empresa[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: Validators.required }),
    password: new FormControl('', { nonNullable: true, validators: Validators.required }),
    empresaSelected: new FormControl<Empresa | null>(null, Validators.required),
  });

  constructor() {
    // v1: resetea el estado de login al entrar.
    this.auth.logout();
    this.empresaService
      .listarComboEmpresas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => this.empresas.set(data));
  }

  protected signin(): void {
    const { username, password, empresaSelected } = this.form.getRawValue();
    if (this.form.invalid || this.cargando() || !empresaSelected) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    this.auth
      .login(new UsuarioForm(username, password, empresaSelected.id))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => void this.router.navigate([URL_TRAS_LOGIN]),
        error: (err: HttpErrorResponse) => {
          this.cargando.set(false);
          // Casos 403/404/409 de v1: se muestra `errorMessage` (`codeMessage` es solo el código).
          const cuerpo = err.error as Partial<ErrorResponse> | null;
          this.error.set(cuerpo?.errorMessage || MENSAJE_LOGIN_GENERICO);
        },
      });
  }

  protected invalido(nombre: 'username' | 'password' | 'empresaSelected'): boolean {
    const c = this.form.controls[nombre];
    return c.invalid && c.touched;
  }
}
