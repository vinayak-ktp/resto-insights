// ============================================================
// Export Utilities — CSV, Excel, PDF
// ============================================================

import type { MetricRecord, Restaurant } from '@/types';
import { getMetricDefinition } from '@/lib/metrics/definitions';
import { formatMetricValue } from '@/lib/utils/format';

// --- CSV Export ---
export function exportToCsv(
  records: MetricRecord[],
  restaurants: Map<string, Restaurant>,
  filename: string
): void {
  const headers = ['Restaurant', 'City', 'Subzone', 'Date', 'Metric Group', 'Metric', 'Value'];
  const rows = records.map((r) => {
    const rest = restaurants.get(r.restaurantId);
    const metricDef = getMetricDefinition(r.metricKey);
    return [
      rest?.name || r.restaurantId,
      rest?.city || '',
      rest?.subzone || '',
      r.date,
      metricDef?.groupLabel || r.metricGroup,
      metricDef?.label || r.metricKey,
      r.value.toString(),
    ];
  });

  const csvContent = [headers, ...rows].map((row) =>
    row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  downloadFile(csvContent, `${filename}.csv`, 'text/csv');
}

// --- Excel Export ---
export async function exportToExcel(
  records: MetricRecord[],
  restaurants: Map<string, Restaurant>,
  filename: string
): Promise<void> {
  const XLSX = await import('xlsx');

  const data = records.map((r) => {
    const rest = restaurants.get(r.restaurantId);
    const metricDef = getMetricDefinition(r.metricKey);
    return {
      Restaurant: rest?.name || r.restaurantId,
      City: rest?.city || '',
      Subzone: rest?.subzone || '',
      Date: r.date,
      'Metric Group': metricDef?.groupLabel || r.metricGroup,
      Metric: metricDef?.label || r.metricKey,
      Value: r.value,
      'Formatted Value': metricDef ? formatMetricValue(r.value, metricDef.format) : r.value.toString(),
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Auto-width columns
  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.max(key.length, 15),
  }));
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Dashboard Data');

  // Use XLSX.write() + manual download instead of XLSX.writeFile().
  // XLSX.writeFile() uses an internal blob/saveAs mechanism that produces
  // UUID-named blob files in many browsers and Next.js environments.
  const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const xlsxBlob = new Blob([xlsxBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerDownload(xlsxBlob, `${filename}.xlsx`);
}

// --- PDF-safe value formatting ---
// jsPDF's default font (Helvetica) does NOT support Unicode characters
// like ₹ (U+20B9). These get corrupted into "&" artifacts during rendering.
// This function produces clean ASCII-only formatted values for PDF output.
function formatValueForPdf(value: number, format: string): string {
  if (isNaN(value)) return '0';

  switch (format) {
    case 'currency': {
      if (value === 0) return 'Rs.0';
      if (Math.abs(value) >= 10000000) return `Rs.${(value / 10000000).toFixed(2)}Cr`;
      if (Math.abs(value) >= 100000) return `Rs.${(value / 100000).toFixed(2)}L`;
      if (Math.abs(value) >= 1000) return `Rs.${(value / 1000).toFixed(1)}K`;
      return `Rs.${value.toFixed(0)}`;
    }
    case 'number': {
      if (value === 0) return '0';
      if (Math.abs(value) >= 10000000) return `${(value / 10000000).toFixed(2)}Cr`;
      if (Math.abs(value) >= 100000) return `${(value / 100000).toFixed(2)}L`;
      if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}K`;
      return Math.round(value).toLocaleString('en-IN');
    }
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'decimal':
      return value.toFixed(2);
    default:
      return value.toString();
  }
}

// Sanitize any remaining non-ASCII characters for jsPDF safety
function sanitizeForPdf(text: string): string {
  // Replace ₹ with Rs.
  let sanitized = text.replace(/₹/g, 'Rs.');
  // Remove any other non-ASCII characters that jsPDF can't render
  sanitized = sanitized.replace(/[^\x20-\x7E]/g, '');
  return sanitized;
}

// --- PDF Export ---
export async function exportToPdf(
  records: MetricRecord[],
  restaurants: Map<string, Restaurant>,
  filename: string,
  title: string = 'Zomato Analytics Report'
): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF('landscape', 'mm', 'a4');

  // Title
  doc.setFontSize(18);
  doc.setTextColor(8, 145, 178); // Teal
  doc.text(sanitizeForPdf(title), 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);
  doc.text(`Total Records: ${records.length}`, 14, 33);

  // Table data — use PDF-safe formatting only
  const tableData = records.map((r) => {
    const rest = restaurants.get(r.restaurantId);
    const metricDef = getMetricDefinition(r.metricKey);
    const formattedValue = metricDef
      ? formatValueForPdf(r.value, metricDef.format)
      : r.value.toFixed(2);

    return [
      sanitizeForPdf(rest?.name || r.restaurantId),
      sanitizeForPdf(rest?.city || ''),
      r.date,
      sanitizeForPdf(metricDef?.groupLabel || r.metricGroup),
      sanitizeForPdf(metricDef?.label || r.metricKey),
      formattedValue,
    ];
  });

  // Validate: ensure no cell contains '&' artifacts or non-ASCII characters
  for (const row of tableData) {
    for (let i = 0; i < row.length; i++) {
      const cell = row[i];
      // Strip any stray '&' that isn't part of a valid value
      if (typeof cell === 'string' && /[^\x20-\x7E]/.test(cell)) {
        row[i] = cell.replace(/[^\x20-\x7E]/g, '');
      }
    }
  }

  autoTable(doc, {
    head: [['Restaurant', 'City', 'Date', 'Group', 'Metric', 'Value']],
    body: tableData,
    startY: 38,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [8, 145, 178], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      5: { halign: 'right', fontStyle: 'bold' }, // Value column right-aligned
    },
  });

  // Use manual download instead of doc.save() — doc.save() produces UUID filenames
  // in some browsers because it uses an internal blob mechanism.
  // We must create a new Blob with explicit MIME type for the OS to recognise the format.
  const pdfArrayBuffer = doc.output('arraybuffer');
  const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
  triggerDownload(pdfBlob, `${filename}.pdf`);
}

// --- Robust file download helper ---
// The anchor element MUST be appended to the DOM for the 'download' attribute
// to be respected by browsers. Without this, browsers use the blob URL's UUID
// as the filename.
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  // Setting rel and target prevents some browsers from navigating to the blob URL
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  // Clean up after a longer delay to ensure the browser has fully initiated the
  // download. Too-short delays (e.g. 100ms) can cause the blob URL to be revoked
  // before the download stream starts, producing a broken/empty file.
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1500);
}

function downloadFile(content: string, filename: string, type: string): void {
  // Use clean MIME type without trailing semicolons — some browsers misparse
  // 'text/csv;charset=utf-8;' and fall back to 'application/octet-stream'
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  triggerDownload(blob, filename);
}
