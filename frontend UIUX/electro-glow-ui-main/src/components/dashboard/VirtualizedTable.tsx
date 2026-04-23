import type { ReactNode } from "react";
import { FixedSizeList as List, type ListChildComponentProps } from "react-window";

type Column<T> = {
  key: keyof T | string;
  label: string;
  width: string;
  render: (row: T) => ReactNode;
};

export function VirtualizedTable<T extends { [key: string]: unknown }>({
  rows,
  columns,
  height = 360,
  rowHeight = 44,
}: {
  rows: T[];
  columns: Array<Column<T>>;
  height?: number;
  rowHeight?: number;
}) {
  const Row = ({ index, style }: ListChildComponentProps) => {
    const row = rows[index];
    return (
      <div
        style={style}
        className="grid items-center border-b border-white/5 px-3 text-xs hover:bg-white/4"
        data-index={index}
      >
        <div className="grid grid-cols-12 items-center gap-2">
          {columns.map((column) => (
            <div key={`${String(column.key)}-${index}`} className={column.width}>
              {column.render(row)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
      <div className="grid grid-cols-12 gap-2 border-b border-white/10 px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        {columns.map((column) => (
          <div key={String(column.key)} className={column.width}>
            {column.label}
          </div>
        ))}
      </div>
      <List height={height} itemCount={rows.length} itemSize={rowHeight} width="100%">
        {Row}
      </List>
    </div>
  );
}
