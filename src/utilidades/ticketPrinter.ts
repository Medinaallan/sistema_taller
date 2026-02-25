export const formatCurrency = (v: any) => {
  const n = Number(v || 0);
  try {
    return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL', minimumFractionDigits: 2 }).format(n);
  } catch (e) {
    return `L.${n.toFixed(2)}`;
  }
};
import jsPDF from 'jspdf';

export const formatDate = (d: any) => {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleString();
  } catch (e) {
    return String(d);
  }
};

export function printArqueoTicket(r: any) {
  const html = `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Ticket Arqueo</title>
    <style>
      @page { size: 80mm auto; margin: 5mm; }
      html,body{margin:0;padding:0}
      body{font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; font-size:12px;}
      .ticket{width:78mm;padding:6px}
      .center{text-align:center}
      .brand{font-weight:700;margin-bottom:6px}
      .line{border-top:1px dashed #444;margin:8px 0}
      table{width:100%;border-collapse:collapse}
      td{vertical-align:top;padding:2px 0}
      .label{width:50%;font-weight:600}
      .value{text-align:right}
      .big{font-size:14px;font-weight:700}
      .green{color:#16a34a;font-weight:700}
      .right{text-align:right}
    </style>
  </head>
  <body>
    <div class="ticket">
      <div class="center brand">Detalle de Arqueo</div>
      <div class="center">Ticket - Arqueo de Caja</div>
      <div class="line"></div>
      <table>
        <tbody>
          <tr><td class="label">Arqueo ID</td><td class="value">${r.arqueo_id ?? '-'}</td></tr>
          <tr><td class="label">Responsable</td><td class="value">${r.nombre_completo ?? '-'}</td></tr>
          <tr><td class="label">Apertura</td><td class="value">${formatDate(r.fecha_apertura)}</td></tr>
          <tr><td class="label">Cierre</td><td class="value">${formatDate(r.fecha_cierre)}</td></tr>
        </tbody>
      </table>
      <div class="line"></div>
      <table>
        <tbody>
          <tr><td class="label">Monto Inicial</td><td class="value">${formatCurrency(r.monto_inicial)}</td></tr>
          <tr><td class="label">Ventas Efectivo</td><td class="value">${formatCurrency(r.monto_ventas_efectivo ?? r.ventas_efectivo ?? r.ventas ?? 0)}</td></tr>
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
      <div class="center">Gracias por usar el sistema</div>
    </div>
  </body>
  </html>`;

  // Generate PDF using jsPDF (same approach as invoices) and open as blob URL
  const ticketWidth = 80; // mm
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [ticketWidth, 297] });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 6;
  const margin = 4;
  const contentWidth = pageWidth - margin * 2;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Detalle de Arqueo', pageWidth / 2, y, { align: 'center' });
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Ticket - Arqueo de Caja', pageWidth / 2, y, { align: 'center' });
  y += 6;
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  const writeRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(label, margin, y);
    doc.text(value, pageWidth - margin, y, { align: 'right' });
    y += 5;
  };

  writeRow('Arqueo ID', String(r.arqueo_id ?? '-'));
  writeRow('Responsable', String(r.nombre_completo ?? '-'));
  writeRow('Apertura', formatDate(r.fecha_apertura));
  writeRow('Cierre', formatDate(r.fecha_cierre));
  y += 2;
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  writeRow('Monto Inicial', formatCurrency(r.monto_inicial));
  writeRow('Ventas en Efectivo', formatCurrency(r.monto_ventas_efectivo ?? r.ventas_efectivo ?? r.ventas ?? 0));
  writeRow('Otros Pagos', formatCurrency(r.monto_otros_pagos ?? r.otros_pagos ?? 0));
  writeRow('Efectivo Esperado', formatCurrency(r.monto_final_esperado ?? r.efectivo_esperado ?? r.total_esperado_en_caja ?? 0));
  writeRow('Monto Final Real', r.monto_final_real != null ? formatCurrency(r.monto_final_real) : '-');
  const diferenciaText = r.diferencia != null ? formatCurrency(r.diferencia) : '-';
  // color for diferencia
  if ((r.diferencia || 0) === 0) doc.setTextColor(22, 163, 74);
  writeRow('Diferencia', diferenciaText);
  doc.setTextColor(0, 0, 0);

  y += 2;
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFontSize(8);
  doc.text(`Estado: ${r.estado ?? '-'}`, margin, y);
  y += 6;
  doc.setFontSize(8);
  doc.text('Observaciones:', margin, y);
  y += 4;
  const obsLines = doc.splitTextToSize(String(r.observaciones ?? '-'), contentWidth);
  doc.text(obsLines, margin, y);

  // Output PDF as blob and open in new tab (same UX as factura)
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  const w = window.open(url, '_blank');
  if (w) {
    w.onload = () => {
      try { w.print(); } catch (e) {}
    };
  }
}
