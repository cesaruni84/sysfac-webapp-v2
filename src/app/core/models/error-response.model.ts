import type { Factoria } from './factoria.model';

export interface ErrorResponse {
  codeMessage: string;
  errorMessage: string;
}

export interface InfoResponse {
  codeMessage: string;
  alertMessage: string;
}

export interface FiltrosGuiasLiq {
  origen: Factoria;
  destino: Factoria;
  fechaIni: Date;
  fechaFin: Date;
}
