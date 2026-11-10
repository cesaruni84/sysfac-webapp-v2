import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Documento, InfoResponse } from '../../models';
import { jsonHttpOptions } from '../http-options';

/** Port de `ItemFacturaService` de v1. */
@Injectable({ providedIn: 'root' })
export class ItemFacturaService {
  private readonly http = inject(HttpClient);
  private readonly empresas = `${environment.apiUrl}/empresas/`;

  /**
   * v1: `GET empresas/{idCodigo}/clientes` (ignora `idTipoItem`; parece código muerto
   * copiado de clientes). Se conserva tal cual para mantener el contrato.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- firma de v1 conservada
  listarItemsParaFactura(idCodigo: number, _idTipoItem?: number): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.empresas}${idCodigo}/clientes`);
  }

  registrarDocumentoElectronico(documento: Documento, idEmpresa: number): Observable<InfoResponse> {
    return this.http.post<InfoResponse>(`${this.empresas}${idEmpresa}/documentos`, documento, jsonHttpOptions);
  }

  actualizarDocumentoElectronico(documento: Documento, idEmpresa: number): Observable<InfoResponse> {
    return this.http.put<InfoResponse>(
      `${this.empresas}${idEmpresa}/documentos/${documento.id}`,
      documento,
      jsonHttpOptions,
    );
  }

  anularDocumentoElectronico(documento: Documento, idEmpresa: number): Observable<InfoResponse> {
    return this.http.put<InfoResponse>(
      `${this.empresas}${idEmpresa}/documentos/${documento.id}/extorno`,
      documento,
      jsonHttpOptions,
    );
  }

  cancelarDocumentoElectronico(documento: Documento, idEmpresa: number): Observable<InfoResponse> {
    return this.http.put<InfoResponse>(
      `${this.empresas}${idEmpresa}/documentos/${documento.id}/cancelacion`,
      documento,
      jsonHttpOptions,
    );
  }

  listarDocumentosPorFiltro(
    idEmpresa: number,
    serie: string,
    secuencia: string,
    tipoDocumento: number,
    idCliente: number,
    idEstado: number,
    fechaIni: string,
    fechaFin: string,
  ): Observable<Documento[]> {
    const params = new HttpParams()
      .set('nroSerie', serie.toString())
      .set('nroSecuencia', secuencia.toString())
      .set('tipoDocumento', tipoDocumento.toString())
      .set('cliente', idCliente.toString())
      .set('estado', idEstado.toString())
      .set('fechaIni', fechaIni.toString())
      .set('fechaFin', fechaFin.toString());
    return this.http.get<Documento[]>(`${this.empresas}${idEmpresa}/documentos/SRV2`, { params });
  }

  listarDocumentosConErrores(
    idEmpresa: number,
    subTipoDocumento: string,
    fechaIni: string,
    fechaFin: string,
  ): Observable<Documento[]> {
    const params = new HttpParams()
      .set('subTipoDocumento', subTipoDocumento.toString())
      .set('fechaIni', fechaIni.toString())
      .set('fechaFin', fechaFin.toString());
    return this.http.get<Documento[]>(`${this.empresas}${idEmpresa}/documentos/error`, { params });
  }

  obtenerDocumentPorSerie(
    idEmpresa: number,
    tipoDocumento: number,
    serieDoc: string,
    secuenciaDoc: string,
  ): Observable<Documento> {
    const params = new HttpParams()
      .set('tipoDocumento', tipoDocumento.toString())
      .set('nroSerie', serieDoc.toString())
      .set('nroSecuencia', secuenciaDoc.toString());
    return this.http.get<Documento>(`${this.empresas}${idEmpresa}/documentos/SRV1`, { params });
  }

  /** v1 la lee como InfoResponse (`codeMessage === 'MFA1001'`). */
  validarDocumentPorSerie(
    idEmpresa: number,
    tipoDocumento: number,
    serieDoc: string,
    secuenciaDoc: string,
  ): Observable<InfoResponse> {
    const params = new HttpParams()
      .set('tipoDocumento', tipoDocumento.toString())
      .set('nroSerie', serieDoc.toString())
      .set('nroSecuencia', secuenciaDoc.toString());
    return this.http.get<InfoResponse>(`${this.empresas}${idEmpresa}/documentos/SRV5`, { params });
  }
}
