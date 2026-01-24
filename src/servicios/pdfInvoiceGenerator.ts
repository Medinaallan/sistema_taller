import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from './invoicesService';
import companyConfigService from './companyConfigService';

class PDFInvoiceGenerator {
  
  /**
   * Obtiene la información de la empresa desde la configuración
   */
  private getEmpresaInfo() {
    const companyInfo = companyConfigService.getCompanyInfo();
    const cai = companyConfigService.getActiveCAI();
    
    return {
      nombre: companyInfo.businessName,
      rtn: companyInfo.rtn,
      direccion: `${companyInfo.address}, ${companyInfo.city}, ${companyInfo.state}`,
      telefono: companyInfo.phone,
      correo: companyInfo.email,
      cai: cai?.cai || 'NO CONFIGURADO',
      rangoInicial: cai?.rangoInicial || '',
      rangoFinal: cai?.rangoFinal || '',
      fechaLimiteEmision: cai?.fechaLimiteEmision ? new Date(cai.fechaLimiteEmision).toLocaleDateString('es-HN') : ''
    };
  }

  /**
   * Genera factura en formato carta (8.5" x 11") según formato SAR Honduras
   */
  generateCartaInvoice(invoice: Invoice): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter' // 215.9mm x 279.4mm
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 15;

    // Obtener información de la empresa desde la configuración
    const EMPRESA_INFO = this.getEmpresaInfo();

    // ========== ENCABEZADO EMPRESA ==========
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(EMPRESA_INFO.nombre, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(EMPRESA_INFO.direccion, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 4;
    doc.text(`Tel: ${EMPRESA_INFO.telefono} | Email: ${EMPRESA_INFO.correo}`, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 4;
    doc.setFont('helvetica', 'bold');
    doc.text(`RTN: ${EMPRESA_INFO.rtn}`, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 8;
    
    // ========== TÍTULO FACTURA ==========
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 8;

    // ========== INFORMACIÓN SAR (Recuadro) ==========
    const sarBoxX = 15;
    const sarBoxWidth = pageWidth - 30;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.rect(sarBoxX, yPos, sarBoxWidth, 20);
    
    const sarTextY = yPos + 4;
    doc.text(`CAI: ${EMPRESA_INFO.cai}`, sarBoxX + 3, sarTextY);
    doc.text(`Rango Autorizado: ${EMPRESA_INFO.rangoInicial} - ${EMPRESA_INFO.rangoFinal}`, sarBoxX + 3, sarTextY + 4);
    doc.text(`Fecha Límite de Emisión: ${EMPRESA_INFO.fechaLimiteEmision}`, sarBoxX + 3, sarTextY + 8);
    doc.text('Original: Cliente | Copia: Emisor', sarBoxX + 3, sarTextY + 12);
    
    yPos += 24;

    // ========== DATOS DE FACTURA Y CLIENTE (Dos columnas) ==========
    const col1X = 15;
    const col2X = pageWidth / 2 + 5;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DE FACTURA', col1X, yPos);
    doc.text('DATOS DEL CLIENTE', col2X, yPos);
    
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    // Columna 1: Datos de Factura
    doc.text(`Número: ${invoice.numero}`, col1X, yPos);
    doc.text(`Fecha: ${new Date(invoice.fecha).toLocaleString('es-HN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })}`, col1X, yPos + 5);
    doc.text(`Estado: ${invoice.estado.toUpperCase()}`, col1X, yPos + 10);
    doc.text(`Método de Pago: ${invoice.metodoPago || 'Efectivo'}`, col1X, yPos + 15);
    
    // Columna 2: Datos del Cliente
    doc.text(`Nombre: ${invoice.clientName}`, col2X, yPos);
    if (invoice.clientId) {
      doc.text(`ID Cliente: ${invoice.clientId.substring(0, 15)}`, col2X, yPos + 5);
    } else {
      doc.text('RTN/Identidad: Consumidor Final', col2X, yPos + 5);
    }
    
    yPos += 25;

    // ========== LÍNEA SEPARADORA ==========
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 5;

    // ========== TABLA DE ITEMS ==========
    const tableData = invoice.items.map((item, index) => [
      (index + 1).toString(),
      item.name,
      item.quantity.toString(),
      `L ${item.price.toFixed(2)}`,
      item.type === 'service' ? 'Servicio' : 'Producto',
      `L ${item.total.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Descripción', 'Cant.', 'Precio Unit.', 'Tipo', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', cellWidth: 70 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 30 },
        4: { halign: 'center', cellWidth: 25 },
        5: { halign: 'right', cellWidth: 30 }
      },
      margin: { left: 15, right: 15 }
    });

    // Obtener posición Y después de la tabla
    const finalY = (doc as any).lastAutoTable.finalY || yPos + 40;
    yPos = finalY + 10;

    // ========== TOTALES (Alineados a la derecha) ==========
    const totalBoxX = pageWidth - 75;
    const totalBoxWidth = 60;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    doc.text('Subtotal:', totalBoxX, yPos, { align: 'right' });
    doc.text(`L ${invoice.subtotal.toFixed(2)}`, totalBoxX + totalBoxWidth, yPos, { align: 'right' });
    
    if (invoice.discount > 0) {
      yPos += 5;
      doc.text('Descuento:', totalBoxX, yPos, { align: 'right' });
      doc.text(`- L ${invoice.discount.toFixed(2)}`, totalBoxX + totalBoxWidth, yPos, { align: 'right' });
    }
    
    yPos += 5;
    doc.text('ISV (15%):', totalBoxX, yPos, { align: 'right' });
    doc.text(`L ${invoice.tax.toFixed(2)}`, totalBoxX + totalBoxWidth, yPos, { align: 'right' });
    
    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setDrawColor(0);
    doc.line(totalBoxX - 5, yPos - 2, totalBoxX + totalBoxWidth, yPos - 2);
    doc.text('TOTAL:', totalBoxX, yPos + 2, { align: 'right' });
    doc.text(`L ${invoice.total.toFixed(2)}`, totalBoxX + totalBoxWidth, yPos + 2, { align: 'right' });
    
    yPos += 10;

    // ========== CONVERSIÓN A LETRAS ==========
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const totalEnLetras = this.numeroALetras(invoice.total);
    doc.text(`Son: ${totalEnLetras} lempiras`, 15, yPos);
    
    yPos += 10;

    // ========== FIRMA Y SELLO ==========
    if (yPos + 30 < pageHeight - 20) {
      yPos = Math.max(yPos, pageHeight - 50);
      
      doc.setDrawColor(0);
      doc.line(40, yPos, 90, yPos);
      doc.line(pageWidth - 90, yPos, pageWidth - 40, yPos);
      
      yPos += 5;
      doc.setFontSize(8);
      doc.text('Firma del Cliente', 65, yPos, { align: 'center' });
      doc.text('Firma y Sello', pageWidth - 65, yPos, { align: 'center' });
    }

    // ========== PIE DE PÁGINA ==========
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text('¡Gracias por su preferencia!', pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text(`Documento generado el ${new Date().toLocaleString('es-HN')}`, pageWidth / 2, pageHeight - 6, { align: 'center' });

    return doc;
  }

  /**
   * Genera factura en formato ticket (80mm de ancho) para impresoras POS
   */
  generateTicketInvoice(invoice: Invoice): jsPDF {
    const ticketWidth = 80; // mm
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [ticketWidth, 297] // Ancho 80mm, alto variable
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 5;
    const margin = 3;
    const contentWidth = pageWidth - (margin * 2);

    // Obtener información de la empresa desde la configuración
    const EMPRESA_INFO = this.getEmpresaInfo();

    // ========== ENCABEZADO ==========
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const nombreLineas = doc.splitTextToSize(EMPRESA_INFO.nombre, contentWidth);
    doc.text(nombreLineas, pageWidth / 2, yPos, { align: 'center' });
    yPos += nombreLineas.length * 5;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(EMPRESA_INFO.direccion, pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
    
    doc.text(`Tel: ${EMPRESA_INFO.telefono}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
    
    doc.setFont('helvetica', 'bold');
    doc.text(`RTN: ${EMPRESA_INFO.rtn}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;

    // ========== LÍNEA SEPARADORA ==========
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 4;

    // ========== TÍTULO ==========
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA', pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;

    // ========== INFORMACIÓN SAR ==========
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    const caiLineas = doc.splitTextToSize(`CAI: ${EMPRESA_INFO.cai}`, contentWidth);
    doc.text(caiLineas, margin, yPos);
    yPos += caiLineas.length * 3;
    
    doc.text(`Rango: ${EMPRESA_INFO.rangoInicial} - ${EMPRESA_INFO.rangoFinal}`, margin, yPos);
    yPos += 3;
    
    doc.text(`Fecha Límite: ${EMPRESA_INFO.fechaLimiteEmision}`, margin, yPos);
    yPos += 5;

    // ========== DATOS DE FACTURA ==========
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`No. Factura: ${invoice.numero}`, margin, yPos);
    yPos += 4;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${new Date(invoice.fecha).toLocaleString('es-HN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })}`, margin, yPos);
    yPos += 4;
    
    doc.text(`Cliente: ${invoice.clientName}`, margin, yPos);
    yPos += 4;
    
    if (!invoice.clientId) {
      doc.text('RTN: Consumidor Final', margin, yPos);
      yPos += 4;
    }
    
    doc.text(`Pago: ${invoice.metodoPago || 'Efectivo'}`, margin, yPos);
    yPos += 6;

    // ========== LÍNEA SEPARADORA ==========
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 4;

    // ========== ITEMS (Tabla simple sin autoTable para mejor control) ==========
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('Descripción', margin, yPos);
    doc.text('Cant', pageWidth - 35, yPos);
    doc.text('P.Unit', pageWidth - 25, yPos);
    doc.text('Total', pageWidth - margin, yPos, { align: 'right' });
    yPos += 4;

    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 3;

    doc.setFont('helvetica', 'normal');
    invoice.items.forEach((item) => {
      // Descripción (puede ocupar múltiples líneas)
      const descLineas = doc.splitTextToSize(item.name, 40);
      doc.text(descLineas, margin, yPos);
      
      // Cantidad, Precio, Total en la misma línea que la primera línea de descripción
      doc.text(item.quantity.toString(), pageWidth - 35, yPos);
      doc.text(item.price.toFixed(2), pageWidth - 25, yPos);
      doc.text(item.total.toFixed(2), pageWidth - margin, yPos, { align: 'right' });
      
      yPos += Math.max(descLineas.length * 3, 4) + 1;
    });

    yPos += 2;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 4;

    // ========== TOTALES ==========
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    doc.text('Subtotal:', pageWidth - 30, yPos);
    doc.text(`L ${invoice.subtotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 4;
    
    if (invoice.discount > 0) {
      doc.text('Descuento:', pageWidth - 30, yPos);
      doc.text(`-L ${invoice.discount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 4;
    }
    
    doc.text('ISV (15%):', pageWidth - 30, yPos);
    doc.text(`L ${invoice.tax.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 5;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TOTAL:', pageWidth - 30, yPos);
    doc.text(`L ${invoice.total.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;

    // ========== TOTAL EN LETRAS ==========
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const totalLetras = this.numeroALetras(invoice.total);
    const letrasLineas = doc.splitTextToSize(`Son: ${totalLetras} lempiras`, contentWidth);
    doc.text(letrasLineas, margin, yPos);
    yPos += letrasLineas.length * 3 + 4;

    // ========== PIE DE PÁGINA ==========
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 4;
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text('¡Gracias por su preferencia!', pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
    
    doc.setFontSize(6);
    doc.text(`Generado: ${new Date().toLocaleString('es-HN')}`, pageWidth / 2, yPos, { align: 'center' });

    return doc;
  }

  /**
   * Convierte un número a letras en español
   */
  private numeroALetras(numero: number): string {
    const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

    if (numero === 0) return 'cero';
    if (numero === 100) return 'cien';

    let parteEntera = Math.floor(numero);
    const parteDecimal = Math.round((numero - parteEntera) * 100);

    let resultado = '';

    // Convertir parte entera
    if (parteEntera >= 1000000) {
      const millones = Math.floor(parteEntera / 1000000);
      resultado += millones === 1 ? 'un millón ' : this.numeroALetras(millones) + ' millones ';
      parteEntera = parteEntera % 1000000;
    }

    if (parteEntera >= 1000) {
      const miles = Math.floor(parteEntera / 1000);
      resultado += miles === 1 ? 'mil ' : this.numeroALetras(miles) + ' mil ';
      parteEntera = parteEntera % 1000;
    }

    if (parteEntera >= 100) {
      const cent = Math.floor(parteEntera / 100);
      resultado += centenas[cent] + ' ';
      parteEntera = parteEntera % 100;
    }

    if (parteEntera >= 20) {
      const dec = Math.floor(parteEntera / 10);
      resultado += decenas[dec];
      parteEntera = parteEntera % 10;
      if (parteEntera > 0) {
        resultado += ' y ' + unidades[parteEntera];
      }
    } else if (parteEntera >= 10) {
      resultado += especiales[parteEntera - 10];
    } else if (parteEntera > 0) {
      resultado += unidades[parteEntera];
    }

    // Agregar centavos si existen
    if (parteDecimal > 0) {
      resultado += ` con ${parteDecimal.toString().padStart(2, '0')}/100`;
    }

    return resultado.trim();
  }

  /**
   * Descarga la factura como PDF
   */
  downloadInvoice(invoice: Invoice, format: 'carta' | 'ticket' = 'carta'): void {
    const doc = format === 'carta' 
      ? this.generateCartaInvoice(invoice)
      : this.generateTicketInvoice(invoice);
    
    const fileName = `Factura_${invoice.numero}_${format}.pdf`;
    doc.save(fileName);
  }

  /**
   * Abre la factura en nueva pestaña para imprimir directamente
   */
  printInvoice(invoice: Invoice, format: 'carta' | 'ticket' = 'carta'): void {
    const doc = format === 'carta' 
      ? this.generateCartaInvoice(invoice)
      : this.generateTicketInvoice(invoice);
    
    // Abrir en nueva pestaña
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(url, '_blank');
    
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }
}

export const pdfInvoiceGenerator = new PDFInvoiceGenerator();
export default pdfInvoiceGenerator;
