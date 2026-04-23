import { Atom, Power, User } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [aiOn, setAiOn] = useState(true);
  return (
    <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-4 px-5 py-4 mb-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="size-10 rounded-xl bg-gradient-to-br from-[var(--neon-green)] to-[var(--neon-cyan)] grid place-items-center shadow-[0_0_20px_var(--neon-green)]">
            <Atom className="size-5 text-[var(--background)]" />
          </div>
        </div>
        <div>
          <h1 className="text-lg md:text-xl font-bold tracking-tight">
            Green Hydrogen <span className="text-glow-green">Smart System</span>
          </h1>
          <p className="text-xs text-muted-foreground">Industrial AI Energy Management</p>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[color-mix(in_oklab,var(--neon-cyan)_14%,transparent)] border border-[color-mix(in_oklab,var(--neon-cyan)_42%,transparent)]">
          <span className="pulse-status size-2 rounded-full bg-[var(--neon-cyan)]" />
          <span className="text-xs font-medium text-[var(--neon-cyan)]">Live Status: Active</span>
        </div>

        <button
          onClick={() => setAiOn(v => !v)}
          className={`micro-hover flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
            aiOn
              ? "bg-[color-mix(in_oklab,var(--neon-cyan)_15%,transparent)] border-[var(--neon-cyan)] text-[var(--neon-cyan)]"
              : "bg-muted border-border text-muted-foreground"
          }`}
        >
          <Power className="size-3.5" />
          AI Mode {aiOn ? "ON" : "OFF"}
          <span className={`relative w-8 h-4 rounded-full transition-colors ${aiOn ? "bg-[var(--neon-cyan)]" : "bg-muted-foreground/30"}`}>
            <span className={`absolute top-0.5 size-3 rounded-full bg-background transition-all ${aiOn ? "left-4" : "left-0.5"}`} />
          </span>
        </button>

        <div className="size-10 rounded-full bg-gradient-to-br from-[var(--neon-blue)] to-[var(--neon-cyan)] grid place-items-center text-sm font-bold text-background ring-2 ring-[color-mix(in_oklab,var(--neon-cyan)_40%,transparent)]">
          <User className="size-5" />
        </div>
      </div>
    </header>
  );
}
