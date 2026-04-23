import { Download, FileImage } from "lucide-react";
import { exportAsCsv, exportNodeAsPng } from "@/lib/export";

type PanelActionsProps = {
  panelId: string;
  csvName: string;
  pngName: string;
  rows: Array<Record<string, unknown>>;
};

export function PanelActions({ panelId, csvName, pngName, rows }: PanelActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => exportAsCsv(csvName, rows)}
        className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-medium text-foreground/90 transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
      >
        <Download className="size-3" /> CSV
      </button>
      <button
        onClick={() => {
          void exportNodeAsPng(panelId, pngName);
        }}
        className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-medium text-foreground/90 transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
      >
        <FileImage className="size-3" /> PNG
      </button>
    </div>
  );
}
