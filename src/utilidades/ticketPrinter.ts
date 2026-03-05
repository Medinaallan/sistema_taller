export const formatCurrency = (v: any) => {
  const n = Number(v || 0);
  try {
    return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL', minimumFractionDigits: 2 }).format(n);
  } catch (e) {
    return `L.${n.toFixed(2)}`;
  }
};
import jsPDF from 'jspdf';
import { appConfig } from '../config/config';
import companyConfigService from '../servicios/companyConfigService';

export const formatDate = (d: any) => {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleString();
  } catch (e) {
    return String(d);
  }
};

export async function printArqueoTicket(r: any, logoUrl?: string) {
  const html = `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Ticket Arqueo</title>
      <style>
      @page { size: 80mm auto; margin: 4mm; }
      html,body{margin:0;padding:0}
      body{font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; font-size:14px;color:#000}
      .ticket{width:78mm;padding:10px}
      .center{text-align:center}
      .brand{font-weight:800;font-size:18px;margin:6px 0}
      .sub{font-size:12px;color:#000;margin-bottom:6px}
      .line{border-top:1px solid #000;margin:8px 0}
      table{width:100%;border-collapse:collapse;margin-top:6px}
      td{vertical-align:top;padding:4px 0}
      .label{width:60%;font-weight:700;color:#000;font-size:12px}
      .value{text-align:right;color:#000;font-size:12px}
      .muted{color:#000}
      .green{color:#16a34a;font-weight:700}
      img.logo{display:block;max-width:100%;height:auto;margin-bottom:8px}
      .footer{font-size:12px;color:#000;margin-top:8px}
    </style>
  </head>
  <body>
    <div class="ticket">
      <div class="center">
        ${logoUrl ? `<img class="logo" src="${logoUrl}" alt="logo" />` : ''}
        <div class="brand">Detalle de Arqueo</div>
        <div class="sub">Ticket - Arqueo de Caja</div>
      </div>
      <div class="line"></div>
      <table>
        <tbody>
          <tr><td class="label">Arqueo ID</td><td class="value">${r.arqueo_id ?? '-'}</td></tr>
          <tr><td class="label">Responsable</td><td class="value">${r.nombre_completo ?? '-'}</td></tr>
          <tr><td class="label">Apertura</td><td class="value muted">${formatDate(r.fecha_apertura)}</td></tr>
          <tr><td class="label">Cierre</td><td class="value muted">${formatDate(r.fecha_cierre)}</td></tr>
        </tbody>
      </table>
      <div class="line"></div>
      <table>
        <tbody>
          <tr><td class="label">Monto Inicial</td><td class="value">${formatCurrency(r.monto_inicial)}</td></tr>
          <tr><td class="label">Ventas en Efectivo</td><td class="value">${formatCurrency(r.monto_ventas_efectivo ?? r.ventas_efectivo ?? r.ventas ?? 0)}</td></tr>
          <tr><td class="label">Otros Pagos</td><td class="value">${formatCurrency(r.monto_otros_pagos ?? r.otros_pagos ?? 0)}</td></tr>
          <tr><td class="label">Efectivo Esperado</td><td class="value">${formatCurrency(r.monto_final_esperado ?? r.efectivo_esperado ?? r.total_esperado_en_caja ?? 0)}</td></tr>
          <tr><td class="label">Monto Final Real</td><td class="value">${r.monto_final_real != null ? formatCurrency(r.monto_final_real) : '-'}</td></tr>
          <tr><td class="label">Diferencia</td><td class="value ${ (r.diferencia||0)===0 ? 'green' : '' }">${r.diferencia != null ? formatCurrency(r.diferencia) : '-'}</td></tr>
        </tbody>
      </table>
      <div class="line"></div>
      <div><strong>Estado:</strong> ${r.estado ?? '-'}</div>
      <div style="margin-top:6px"><strong>Observaciones:</strong></div>
      <div style="white-space:pre-wrap">${r.observaciones ?? '-'}</div>
      <div class="line"></div>
      <div class="center footer">Gracias por usar el sistema</div>
    </div>
  </body>
  </html>`;

  // Generate PDF using jsPDF and try to include logo if available
  const ticketWidth = 80; // mm
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [ticketWidth, 297] });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 8;
  const margin = 6;
  const contentWidth = pageWidth - margin * 2;

  // helper: ask backend to convert remote image URL to base64 (avoids CORS)
  const imageUrlToBase64 = async (url?: string): Promise<string | null> => {
    if (!url) return null;
    try {
      const apiUrl = appConfig.backendBaseUrl;
      const baseUrl = apiUrl.replace(/\/$/, '').endsWith('/api')
        ? apiUrl.replace(/\/api$/, '')
        : apiUrl.replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/api/company-config/logo-base64?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      if (data && data.success && data.data?.base64) return data.data.base64;
      return null;
    } catch (e) {
      return null;
    }
  };

  // resolve logoUrl from param or company configuration (try cache, then fetch)
  let resolvedLogoUrl = logoUrl;
  if (!resolvedLogoUrl) {
    let info = companyConfigService.getCompanyInfo();
    if (!info) {
      try { await companyConfigService.fetchCompanyInfo(); } catch (e) { /* ignore */ }
      info = companyConfigService.getCompanyInfo();
    }
    resolvedLogoUrl = info?.logoUrl || undefined;
  }

  const logoData = await imageUrlToBase64(resolvedLogoUrl);
  if (logoData) {
    try {
      // make logo much wider: use most of content width but cap to 60mm
      const imgW = Math.min(contentWidth * 0.95, 60);
      const imgH = imgW * 0.45; // wide banner-like height
      const imgX = (pageWidth - imgW) / 2;
      doc.addImage(logoData, 'PNG', imgX, y, imgW, imgH);
      y += imgH + 4;
    } catch (e) {
      // ignore image errors
    }
  }

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Detalle de Arqueo', pageWidth / 2, y, { align: 'center' });
  y += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('Ticket - Arqueo de Caja', pageWidth / 2, y, { align: 'center' });
  y += 8;
  doc.setLineWidth(0.3);
  doc.setDrawColor(0, 0, 0);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  const writeRow = (label: string, value: string, opts?: {muted?: boolean, strong?: boolean}) => {
    doc.setFont('helvetica', opts?.strong ? 'bold' : 'normal');
    doc.setFontSize(11);
    // make muted text black as requested
    if (opts?.muted) doc.setTextColor(0, 0, 0); else doc.setTextColor(0, 0, 0);
    doc.text(label, margin, y);
    doc.text(value, pageWidth - margin, y, { align: 'right' });
    y += 7;
  };

  writeRow('Arqueo ID', String(r.arqueo_id ?? '-'), { strong: true });
  writeRow('Responsable', String(r.nombre_completo ?? '-'));
  writeRow('Apertura', formatDate(r.fecha_apertura), { muted: true });
  writeRow('Cierre', formatDate(r.fecha_cierre), { muted: true });

  y += 2;
  doc.setDrawColor(0, 0, 0);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  writeRow('Monto Inicial', formatCurrency(r.monto_inicial));
  writeRow('Ventas en Efectivo', formatCurrency(r.monto_ventas_efectivo ?? r.ventas_efectivo ?? r.ventas ?? 0));
  writeRow('Otros Pagos', formatCurrency(r.monto_otros_pagos ?? r.otros_pagos ?? 0));
  writeRow('Efectivo Esperado', formatCurrency(r.monto_final_esperado ?? r.efectivo_esperado ?? r.total_esperado_en_caja ?? 0));
  writeRow('Monto Final Real', r.monto_final_real != null ? formatCurrency(r.monto_final_real) : '-');

  const diferenciaText = r.diferencia != null ? formatCurrency(r.diferencia) : '-';
  if ((r.diferencia || 0) === 0) doc.setTextColor(22, 163, 74);
  writeRow('Diferencia', diferenciaText, { strong: true });
  doc.setTextColor(0, 0, 0);

  y += 4;
  doc.setDrawColor(0, 0, 0);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`Estado: ${r.estado ?? '-'}`, margin, y);
  y += 9;
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('Observaciones:', margin, y);
  y += 6;
  const obsLines = doc.splitTextToSize(String(r.observaciones ?? '-'), contentWidth);
  doc.text(obsLines, margin, y);

  // Output PDF as blob and open in new tab (UX similar a factura)
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  const w = window.open(url, '_blank');
  if (w) {
    w.onload = () => {
      try { w.print(); } catch (e) {}
    };
  }
}
