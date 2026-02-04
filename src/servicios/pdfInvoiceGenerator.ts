import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from './invoicesService';
import companyConfigService from './companyConfigService';

type InvoiceFormat = 'carta' | 'ticket';

class PDFInvoiceGenerator {
  
  /**
   * Convierte una imagen URL a base64 para evitar problemas de CORS
   * Usa el backend como proxy para evitar restricciones de CORS
   */
  private async imageUrlToBase64(url: string): Promise<string | null> {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const baseUrl = apiUrl.replace(/\/$/, '').endsWith('/api') 
        ? apiUrl.replace(/\/api$/, '') 
        : apiUrl.replace(/\/$/, '');
      
      const response = await fetch(`${baseUrl}/api/company-config/logo-base64?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      if (data.success && data.data?.base64) {
        return data.data.base64;
      }
      
      console.error('Error en respuesta del servidor:', data);
      return null;
    } catch (error) {
      console.error('Error convirtiendo imagen a base64:', error);
      return null;
    }
  }

  /**
   * Obtiene la información de la empresa desde la configuración
   */
  private getEmpresaInfo() {
    const companyInfo = companyConfigService.getCompanyInfo();
    const cai = companyConfigService.getActiveCAI('01'); // CAI para facturas
    
    if (!companyInfo) {
      return {
        nombre: 'EMPRESA NO CONFIGURADA',
        rtn: '0000-0000-000000',
        direccion: 'Dirección no configurada',
        telefono: 'N/A',
        correo: 'N/A',
        cai: 'NO CONFIGURADO',
        rangoInicial: '',
        rangoFinal: '',
        fechaLimiteEmision: '',
        establecimiento: '001',
        puntoEmision: '001',
        tipoDocumento: '01',
        logoUrl: null,
        mensajePie: '¡Gracias por su preferencia!'
      };
    }
    
    return {
      nombre: companyInfo.businessName || companyInfo.nombreEmpresa || 'N/A',
      rtn: companyInfo.rtn || '0000-0000-000000',
      direccion: companyInfo.address || companyInfo.direccion || 'N/A',
      telefono: companyInfo.phone || companyInfo.telefono || 'N/A',
      correo: companyInfo.email || companyInfo.correo || 'N/A',
      cai: cai?.cai || 'NO CONFIGURADO',
      rangoInicial: cai?.rangoInicial || '',
      rangoFinal: cai?.rangoFinal || '',
      fechaLimiteEmision: cai?.fechaLimiteEmision ? new Date(cai.fechaLimiteEmision).toLocaleDateString('es-HN') : '',
      establecimiento: cai?.establecimiento || '001',
      puntoEmision: cai?.puntoEmision || '001',
      tipoDocumento: cai?.tipoDocumento || '01',
      logoUrl: companyInfo.logoUrl || null,
      mensajePie: companyInfo.mensajePieFactura || '¡Gracias por su preferencia!'
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
    let yPos = 12;

    // Obtener información de la empresa desde la configuración
    const EMPRESA_INFO = this.getEmpresaInfo();

    // ======= MÁRGENES Y ESTILO GLOBAL =======
    const marginLeft = 15;
    const marginRight = 15;
    const contentWidth = pageWidth - marginLeft - marginRight;

    // ========== ENCABEZADO EMPRESA (con número de factura a la derecha) ==========
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const nombreLineas = doc.splitTextToSize(EMPRESA_INFO.nombre, contentWidth - 60);
    doc.text(nombreLineas, marginLeft, yPos);

    // Caja de Número de Factura a la derecha
    const invBoxW = 70;
    const invBoxH = 22;
    const invBoxX = pageWidth - marginRight - invBoxW;
    doc.setDrawColor(0);
    doc.setLineWidth(0.6);
    doc.rect(invBoxX, yPos - 6, invBoxW, invBoxH);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA', invBoxX + invBoxW / 2, yPos + 2, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${invoice.numero}`, invBoxX + invBoxW / 2, yPos + 10, { align: 'center' });
    doc.setFontSize(8);
    doc.text(`${invoice.estado ? invoice.estado.toUpperCase() : ''}`, invBoxX + invBoxW / 2, yPos + 15, { align: 'center' });

    yPos += nombreLineas.length * 6 + 2;

    // Información secundaria (dirección / contacto / RTN)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const direccionLines = doc.splitTextToSize(EMPRESA_INFO.direccion, contentWidth - invBoxW - 10);
    doc.text(direccionLines, marginLeft, yPos);
    doc.text(`Tel: ${EMPRESA_INFO.telefono} | Email: ${EMPRESA_INFO.correo}`, marginLeft, yPos + direccionLines.length * 4 + 2);
    doc.setFont('helvetica', 'bold');
    doc.text(`RTN: ${EMPRESA_INFO.rtn}`, marginLeft, yPos + direccionLines.length * 4 + 8);

    yPos += Math.max(direccionLines.length * 4 + 12, 22);

    // ========== INFORMACIÓN SAR (Recuadro destacado con fondo claro) ==========
    const sarBoxX = marginLeft;
    const sarBoxWidth = contentWidth;
    const sarBoxHeight = 34;
    doc.setDrawColor(0);
    doc.setFillColor(245, 245, 245);
    doc.rect(sarBoxX, yPos, sarBoxWidth, sarBoxHeight, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setFont('helvetica', 'normal');
    doc.text(`CAI: ${EMPRESA_INFO.cai}`, sarBoxX + 4, yPos + 12);
    doc.text(`Rango Autorizado: ${EMPRESA_INFO.rangoInicial} - ${EMPRESA_INFO.rangoFinal}`, sarBoxX + 4, yPos + 17);
    doc.text(`Fecha Límite de Emisión: ${EMPRESA_INFO.fechaLimiteEmision}`, sarBoxX + 4, yPos + 22);
    doc.text('Original: Cliente | Copia: Emisor', sarBoxX + 4, yPos + 27);
    yPos += sarBoxHeight + 6;

    // ========== DATOS DE FACTURA Y CLIENTE (Dos columnas claras) ==========
    const col1X = marginLeft;
    const col2X = pageWidth / 2 + 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DE FACTURA', col1X, yPos);
    doc.text('DATOS DEL CLIENTE', col2X, yPos);
    yPos += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    // Columna 1: Datos de Factura
    doc.text(`Número: ${invoice.numero}`, col1X, yPos);
    doc.text(`Fecha: ${new Date(invoice.fecha).toLocaleString('es-HN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })}`, col1X, yPos + 5);
    doc.text(`Método de Pago: ${invoice.metodoPago || 'Efectivo'}`, col1X, yPos + 10);

    // Columna 2: Datos del Cliente
    doc.text(`Nombre: ${invoice.clientName}`, col2X, yPos);
    if (invoice.clientId) {
      doc.text(`ID Cliente: ${invoice.clientId}`, col2X, yPos + 5);
    } else {
      doc.text('RTN/Identidad: Consumidor Final', col2X, yPos + 5);
    }

    yPos += 22;

    // ========== LÍNEA SEPARADORA ==========
    doc.setDrawColor(0);
    doc.setLineWidth(0.4);
    doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
    yPos += 6;

    // ========== TABLA DE ITEMS (ajustada para carta) ==========
    const tableData = invoice.items.map((item, index) => {
      const t = (item.type || '').toString().toLowerCase();
      const typeLabel = (t === 'service' || t === 'servicio' || t.includes('serv')) ? 'Servicio' : 'Producto';
      return {
        no: (index + 1).toString(),
        desc: item.name,
        qty: item.quantity.toString(),
        price: item.price.toFixed(2),
        type: typeLabel,
        total: item.total.toFixed(2)
      };
    });

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Descripción', 'Cant.', 'Precio Unit.', 'Tipo', 'Total']],
      body: tableData.map(r => [r.no, r.desc, r.qty, `L ${r.price}`, r.type, `L ${r.total}`]),
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41,128,185], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', cellWidth: contentWidth * 0.45 },
        2: { halign: 'center', cellWidth: 18 },
        3: { halign: 'right', cellWidth: 30 },
        4: { halign: 'center', cellWidth: 25 },
        5: { halign: 'right', cellWidth: 30 }
      },
      margin: { left: marginLeft, right: marginRight }
    });

    // Obtener posición Y después de la tabla
    const finalY = (doc as any).lastAutoTable?.finalY || yPos + 40;
    yPos = finalY + 8;

    // ========== TOTALES (Alineados a la derecha con caja visible) ==========
    const totalsX = pageWidth - marginRight - 80;
    const totalsValX = pageWidth - marginRight;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    // Mostrar importes desglosados en el orden solicitado:
    // 1) Descuento/ Rebajas, 2) Importe Exento, 3) Importe Exonerado, 4) Importe Gravado 15%, 5) ISV (15%)
    const discountVal = Number(invoice.discount || 0);
    doc.text('Descuentos y Rebajas:', totalsX, yPos, { align: 'right' });
    doc.text(`${discountVal > 0 ? '- L ' + discountVal.toFixed(2) : 'L ' + discountVal.toFixed(2)}`, totalsValX, yPos, { align: 'right' });
    yPos += 6;

    const exentoVal = Number((invoice as any).exento || 0);
    const exoneradoVal = Number((invoice as any).exonerado || 0);
    const gravadoVal = Number(invoice.subtotal || 0);

    doc.text('Importe Exento:', totalsX, yPos, { align: 'right' });
    doc.text(`L ${exentoVal.toFixed(2)}`, totalsValX, yPos, { align: 'right' });
    yPos += 6;

    doc.text('Importe Exonerado:', totalsX, yPos, { align: 'right' });
    doc.text(`L ${exoneradoVal.toFixed(2)}`, totalsValX, yPos, { align: 'right' });
    yPos += 6;

    doc.text('Importe Gravado 15%:', totalsX, yPos, { align: 'right' });
    doc.text(`L ${gravadoVal.toFixed(2)}`, totalsValX, yPos, { align: 'right' });
    yPos += 6;

    doc.text('ISV (15%):', totalsX, yPos, { align: 'right' });
    doc.text(`L ${Number(invoice.tax || 0).toFixed(2)}`, totalsValX, yPos, { align: 'right' });

    yPos += 8;
    doc.setDrawColor(0);
    doc.setLineWidth(0.6);
    doc.line(totalsX - 5, yPos, totalsValX, yPos);
    yPos += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('TOTAL:', totalsX, yPos, { align: 'right' });
    doc.text(`L ${invoice.total.toFixed(2)}`, totalsValX, yPos, { align: 'right' });

    yPos += 14;

    // ========== CONVERSIÓN A LETRAS ========
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const totalEnLetras = this.numeroALetras(invoice.total);
    const letras = `Son: ${totalEnLetras} lempiras`;
    const letrasLines = doc.splitTextToSize(letras, contentWidth * 0.7);
    doc.text(letrasLines, marginLeft, yPos);

    yPos += letrasLines.length * 5 + 8;


    // ========== PIE DE PÁGINA ========
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text('¡Gracias por su preferencia!', pageWidth / 2, pageHeight - 12, { align: 'center' });
    doc.text(`Documento generado el ${new Date().toLocaleString('es-HN')}`, pageWidth / 2, pageHeight - 7, { align: 'center' });

    return doc;
  }

  /**
   * Genera factura en formato ticket (80mm de ancho) para impresoras POS
   */
  async generateTicketInvoice(invoice: Invoice): Promise<jsPDF> {
    const ticketWidth = 80; // mm
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [ticketWidth, 297]
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 6;
    const margin = 4;
    const contentWidth = pageWidth - margin * 2;

    // Obtener información de la empresa desde la configuración
    const EMPRESA_INFO = this.getEmpresaInfo();

    // ========== LOGO (si existe) ==========
    if (EMPRESA_INFO.logoUrl) {
      try {
        const logoBase64 = await this.imageUrlToBase64(EMPRESA_INFO.logoUrl);
        if (logoBase64) {
          const logoSize = 20; // mm
          const logoX = (pageWidth - logoSize) / 2;
          doc.addImage(logoBase64, 'PNG', logoX, yPos, logoSize, logoSize, undefined, 'FAST');
          yPos += logoSize + 2;
        }
      } catch (error) {
        console.error('Error agregando logo al ticket:', error);
        // Si falla, continuar sin logo
      }
    }

    // ========== ENCABEZADO ==========
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const nombreLineas = doc.splitTextToSize(EMPRESA_INFO.nombre, contentWidth);
    doc.text(nombreLineas, pageWidth / 2, yPos, { align: 'center' });
    yPos += nombreLineas.length * 5;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const direccionLines = doc.splitTextToSize(EMPRESA_INFO.direccion, contentWidth);
    doc.text(direccionLines, pageWidth / 2, yPos, { align: 'center' });
    yPos += direccionLines.length * 4 + 1;

    doc.text(`Tel: ${EMPRESA_INFO.telefono}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;

    doc.setFont('helvetica', 'bold');
    doc.text(`RTN: ${EMPRESA_INFO.rtn}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;

    // ========== SEPARADOR ==========
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 4;

    // ========== TITULO FACTURA ==========
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA', pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;

    // ========== INFORMACIÓN SAR (compacta) ==========
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`CAI: ${EMPRESA_INFO.cai}`, margin, yPos);
    doc.text(`Rango: ${EMPRESA_INFO.rangoInicial} - ${EMPRESA_INFO.rangoFinal}`, margin, yPos + 3.5);
    doc.text(`Fecha Límite: ${EMPRESA_INFO.fechaLimiteEmision}`, margin, yPos + 7);
    yPos += 11;

    // ========== DATOS (Factura / Cliente) ==========
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`No. Factura: ${invoice.numero}`, margin, yPos);
    yPos += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Fecha: ${new Date(invoice.fecha).toLocaleString('es-HN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`, margin, yPos);
    yPos += 4;
    doc.text(`Cliente: ${invoice.clientName || 'CONSUMIDOR FINAL'}`, margin, yPos);
    yPos += 4;
    if (invoice.clientId) {
      doc.text(`RTN: ${invoice.clientId}`, margin, yPos);
      yPos += 4;
    }
    doc.text(`Pago: ${invoice.metodoPago || 'Efectivo'}`, margin, yPos);
    yPos += 6;

    // ========== ENCABEZADO TABLA ==========
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const colDescX = margin;
    const colCantX = pageWidth - 48;
    const colPUnitX = pageWidth - 32;
    const colTotalX = pageWidth - margin;

    doc.text('Descripción', colDescX, yPos);
    doc.text('Cant', colCantX, yPos);
    doc.text('P.Unit', colPUnitX, yPos);
    doc.text('Total', colTotalX, yPos, { align: 'right' });
    yPos += 4;
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 3;

    // ========== ITEMS ==========
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    invoice.items.forEach((item) => {
      const descLines = doc.splitTextToSize(item.name, colCantX - colDescX - 2);
      doc.text(descLines, colDescX, yPos);
      // First line aligns quantities/prices
      doc.text(item.quantity.toString(), colCantX, yPos);
      doc.text(item.price.toFixed(2), colPUnitX, yPos);
      doc.text(item.total.toFixed(2), colTotalX, yPos, { align: 'right' });
      yPos += descLines.length * 3.8;
      if (descLines.length === 0) yPos += 4;
    });

    // ========== SEPARADOR ANTES DE TOTALES ==========
    yPos += 2;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 4;

    // ========== TOTALES ==========
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const valX = pageWidth - margin;
    const labelX = margin;

    // Mostrar totales en el orden solicitado
    const discountVal = Number(invoice.discount || 0);
    doc.text('Descuentos y Rebajas:', labelX, yPos);
    doc.text(`${discountVal > 0 ? '-L ' + discountVal.toFixed(2) : 'L ' + discountVal.toFixed(2)}`, valX, yPos, { align: 'right' });
    yPos += 4;

    const exentoVal = Number((invoice as any).exento || 0);
    const exoneradoVal = Number((invoice as any).exonerado || 0);
    const gravadoVal = Number(invoice.subtotal || 0);

    doc.text('Importe Exento:', labelX, yPos);
    doc.text(`L ${exentoVal.toFixed(2)}`, valX, yPos, { align: 'right' });
    yPos += 4;

    doc.text('Importe Exonerado:', labelX, yPos);
    doc.text(`L ${exoneradoVal.toFixed(2)}`, valX, yPos, { align: 'right' });
    yPos += 4;

    doc.text('Importe Gravado 15%:', labelX, yPos);
    doc.text(`L ${gravadoVal.toFixed(2)}`, valX, yPos, { align: 'right' });
    yPos += 4;

    doc.text('ISV (15%):', labelX, yPos);
    doc.text(`L ${Number(invoice.tax || 0).toFixed(2)}`, valX, yPos, { align: 'right' });
    yPos += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL: ', labelX, yPos);
    doc.text(`L ${invoice.total.toFixed(2)}`, valX, yPos, { align: 'right' });
    yPos += 8;

    // ========== TOTAL EN LETRAS ==========
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const totalEnLetras = this.numeroALetras(invoice.total);
    const letrasLines = doc.splitTextToSize(`Son: ${totalEnLetras} lempiras`, contentWidth);
    doc.text(letrasLines, margin, yPos);
    yPos += letrasLines.length * 3.8 + 6;

    // ========== PIE ==========
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 4;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    const mensajePieLineas = doc.splitTextToSize(EMPRESA_INFO.mensajePie, contentWidth);
    doc.text(mensajePieLineas, pageWidth / 2, yPos, { align: 'center' });
    yPos += mensajePieLineas.length * 3.5 + 1;
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
  async downloadInvoice(invoice: Invoice, format: 'carta' | 'ticket' = 'carta'): Promise<void> {
    const doc = format === 'carta' 
      ? this.generateCartaInvoice(invoice)
      : await this.generateTicketInvoice(invoice);
    
    const fileName = `Factura_${invoice.numero}_${format}.pdf`;
    doc.save(fileName);
  }

  /**
   * Abre la factura en nueva pestaña para imprimir directamente
   */
  async printInvoice(invoice: Invoice, format: InvoiceFormat = 'carta'): Promise<void> {
    const doc = format === 'carta' 
      ? this.generateCartaInvoice(invoice)
      : await this.generateTicketInvoice(invoice);
    
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
