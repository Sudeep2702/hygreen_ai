import { toPng } from "html-to-image";

export function exportAsCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (!rows.length) {
    return;
  }

  const headers = Object.keys(rows[0]);
  const csvRows = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header] ?? "";
          const escaped = String(value).replaceAll('"', '""');
          return `"${escaped}"`;
        })
        .join(","),
    ),
  ];

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filename}.csv`);
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function exportNodeAsPng(nodeId: string, filename: string) {
  const target = document.getElementById(nodeId);
  if (!target) {
    return;
  }

  const dataUrl = await toPng(target, {
    cacheBust: true,
    backgroundColor: "#0A0C10",
    pixelRatio: 2,
  });

  const link = document.createElement("a");
  link.download = `${filename}.png`;
  link.href = dataUrl;
  link.click();
}

export async function exportNodeAsPdf(nodeId: string, filename: string) {
  const target = document.getElementById(nodeId);
  if (!target) {
    return;
  }

  const dataUrl = await toPng(target, {
    cacheBust: true,
    backgroundColor: "#0A0C10",
    pixelRatio: 2,
  });

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgProps = pdf.getImageProperties(dataUrl);

  const maxWidth = pageWidth - 20;
  const scaledHeight = (imgProps.height * maxWidth) / imgProps.width;
  const finalHeight = Math.min(scaledHeight, pageHeight - 20);

  pdf.addImage(dataUrl, "PNG", 10, 10, maxWidth, finalHeight);
  pdf.save(`${filename}.pdf`);
}
