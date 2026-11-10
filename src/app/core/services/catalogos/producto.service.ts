import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { InfoResponse, Producto } from '../../models';
import { jsonHttpOptions } from '../http-options';

/** Port de `ProductoService` de v1. */
@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly empresas = `${environment.apiUrl}/empresas`;
  private readonly productos = `${environment.apiUrl}/productos`;
  private readonly empresaProductos = `${environment.apiUrl}/empresas/productos`;

  listarComboProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.productos);
  }

  /** v1 la tipa `any[]`; se asume la forma `Producto` (revisar al migrar la pantalla de factura-item). */
  listarComboProductosServicios(idEmpresa: number): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.empresas}/${idEmpresa}/productos-servicios/SRV1`);
  }

  registrarProducto(producto: Producto): Observable<InfoResponse> {
    return this.http.post<InfoResponse>(this.empresaProductos, producto, jsonHttpOptions);
  }

  actualizarProducto(producto: Producto): Observable<InfoResponse> {
    return this.http.put<InfoResponse>(`${this.empresaProductos}/${producto.id}`, producto, jsonHttpOptions);
  }
}
