/**
 * Servicios de exportación (Excel con exceljs y PDF con jspdf).
 *
 * Tienen su propio índice y NO se reexportan desde `core/services`: así una pantalla que
 * importa `core/services` para un servicio HTTP no arrastra exceljs/jspdf (CommonJS, cientos
 * de kB) a su chunk. Las pantallas que exportan importan de aquí:
 * `import { ExcelService, PdfService } from '../../core/services/export';`
 */
export * from './descarga';
export * from './excel.service';
export * from './pdf.service';
