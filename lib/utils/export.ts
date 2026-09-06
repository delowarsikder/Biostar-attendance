"use client";

import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExportOptions {
  filename: string;
  sheetName?: string;
  columns: ExportColumn[];
  data: Record<string, unknown>[];
  title?: string;
  subtitle?: string;
}

/**
 * Export data to Excel (.xlsx)
 */
export function exportToExcel(options: ExportOptions) {
  const { filename, sheetName = "Sheet1", columns, data } = options;

  const worksheetData = [
    columns.map((col) => col.header),
    ...data.map((row) => columns.map((col) => row[col.key] ?? "")),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  const colWidths = columns.map((col) => ({ wch: col.width ?? 15 }));
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Export data to PDF
 */
export function exportToPDF(options: ExportOptions) {
  const { filename, columns, data, title, subtitle } = options;

  const doc = new jsPDF({
    orientation: columns.length > 7 ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });

  let yPos = 15;

  if (title) {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, yPos);
    yPos += 8;
  }

  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 14, yPos);
    yPos += 6;
  }

  const headers = columns.map((col) => col.header);
  const rows = data.map((row) => columns.map((col) => String(row[col.key] ?? "")));

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: yPos,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 10, right: 10 },
    columnStyles: columns.reduce(
      (acc, col, index) => {
        if (col.width) {
          acc[index] = { cellWidth: col.width };
        }
        return acc;
      },
      {} as Record<number, { cellWidth: number }>
    ),
  });

  doc.save(`${filename}.pdf`);
}

/**
 * Format date for export
 */
export function formatExportDate(date: string): string {
  return date.replace(/-/g, "");
}

/**
 * Generate filename with date
 */
export function generateExportFilename(base: string, date: string, type: "excel" | "pdf"): string {
  const formattedDate = formatExportDate(date);
  return `${base}_${formattedDate}.${type}`;
}