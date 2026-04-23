import { motion } from "framer-motion";
import { Activity, Factory, Gauge, Leaf, Map, Menu, Route, Truck } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CommandPalette } from "@/components/dashboard/CommandPalette";
import { cn } from "@/lib/utils";

const navLinks = [
  { to: "/", label: "Home", icon: Gauge },
  { to: "/production", label: "Production", icon: Factory },
  { to: "/demand", label: "Demand", icon: Activity },
  { to: "/transport", label: "Transport", icon: Route },
  { to: "/impact", label: "Impact", icon: Leaf },
  { to: "/fleet", label: "Fleet Tracker", icon: Map },
] as const;

export function AppShell({ children, title }: { children: React.ReactNode; title: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const paletteData = useMemo(
    () => ({
      trucks: ["TRK-001", "TRK-018", "TRK-034", "TRK-052", "TRK-060"],
      skus: ["SKU-H2-101", "SKU-FC-221", "SKU-PEM-415", "SKU-CMP-502"],
      alerts: ["Pressure spike in M-014", "Delay risk on Mumbai-Delhi", "Fuel stop required TRK-029"],
    }),
    [],
  );

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-[1700px] gap-4">
        <motion.aside
          animate={{ width: collapsed ? 88 : 248 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="glass-card hidden h-[calc(100vh-3rem)] shrink-0 flex-col overflow-hidden p-3 lg:flex"
        >
          <div className="mb-4 flex items-center justify-between px-2">
            {!collapsed && <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Operations Grid</p>}
            <button
              onClick={() => setCollapsed((prev) => !prev)}
              className="micro-hover rounded-md border border-white/10 bg-white/5 p-2"
            >
              <Menu className="size-4" />
            </button>
          </div>

          <nav className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "micro-hover group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition",
                  pathname === link.to && "bg-[color-mix(in_oklab,var(--neon-cyan)_22%,transparent)] text-[var(--neon-cyan)]",
                )}
              >
                <link.icon className="size-4" />
                {!collapsed && <span>{link.label}</span>}
              </Link>
            ))}
          </nav>

          <div className="mt-auto rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Truck className="size-3 text-[var(--neon-cyan)]" />
              {!collapsed && <span>47 Active Routes</span>}
            </div>
          </div>
        </motion.aside>

        <main className="min-w-0 flex-1">
          <header className="glass-card mb-4 flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
              <p className="text-xs text-muted-foreground">Hydrogen command center</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_oklab,var(--neon-cyan)_45%,transparent)] bg-[color-mix(in_oklab,var(--neon-cyan)_15%,transparent)] px-3 py-1">
                <span className="pulse-status size-2 rounded-full bg-[var(--neon-cyan)]" />
                <span className="text-[11px] uppercase tracking-wider text-[var(--neon-cyan)]">Live telemetry</span>
              </div>
              <CommandPalette trucks={paletteData.trucks} skus={paletteData.skus} alerts={paletteData.alerts} />
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
