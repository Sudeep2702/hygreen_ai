import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Package, Truck } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";

type PaletteItem = {
  id: string;
  label: string;
  type: "truck" | "sku" | "alert";
  to?: string;
};

export function CommandPalette({
  trucks,
  skus,
  alerts,
}: {
  trucks: string[];
  skus: string[];
  alerts: string[];
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const items = useMemo<PaletteItem[]>(() => {
    return [
      ...trucks.map((truck, index) => ({
        id: `truck-${index}`,
        label: truck,
        type: "truck" as const,
        to: "/fleet",
      })),
      ...skus.map((sku, index) => ({
        id: `sku-${index}`,
        label: sku,
        type: "sku" as const,
        to: "/transport",
      })),
      ...alerts.map((alert, index) => ({
        id: `alert-${index}`,
        label: alert,
        type: "alert" as const,
        to: "/",
      })),
    ];
  }, [alerts, skus, trucks]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="micro-hover rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground"
      >
        Search trucks, SKUs, alerts <span className="ml-2 rounded border border-white/10 px-1.5 py-0.5">Ctrl/Cmd+K</span>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search trucks, SKUs, alerts..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Search Results">
            {items.map((item) => (
              <CommandItem
                key={item.id}
                onSelect={() => {
                  if (item.to) {
                    void navigate({ to: item.to });
                  }
                  setOpen(false);
                }}
              >
                {item.type === "truck" && <Truck className="text-[var(--neon-cyan)]" />}
                {item.type === "sku" && <Package className="text-[var(--neon-green)]" />}
                {item.type === "alert" && <AlertTriangle className="text-[var(--danger)]" />}
                <span>{item.label}</span>
                <CommandShortcut>{item.type.toUpperCase()}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
