/**
 * Descarga un `Blob` como archivo, sin `file-saver`
 * (`URL.createObjectURL` + `<a download>` + `revokeObjectURL`).
 */
export function descargarArchivo(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.style.display = 'none';
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  // Se difiere para no cancelar la descarga en navegadores lentos.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Equivalente a `new Date().toLocaleDateString()` usado por v1 en los nombres de
 * archivo (depende de la configuración regional del navegador, igual que en v1).
 */
export function fechaParaNombreArchivo(fecha: Date = new Date()): string {
  return fecha.toLocaleDateString();
}
