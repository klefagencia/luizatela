import React from "react";
import { Check } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export default function StepIndicator({ steps, current, onJump }) {
  return (
    <div className="w-full" data-testid="step-indicator">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
      {steps.map((s, i) => {
      const done = i < current;
      const active = i === current;
      return (
        <button
          key={s.id}
          type="button"
          onClick={() => onJump?.(i)}
          data-testid={`step-jump-${i}`}
          className={cn(
            "group relative text-left p-3 sm:p-4 lg:p-5 rounded-lg border transition-all",
            active && "bg-primary/10 border-primary",
            done && "bg-card border-border hover:border-primary/40",
            !active && !done && "bg-card border-border/60 opacity-70 hover:opacity-100"
            )}
          >
        <div className="flex items-center gap-2 sm:gap-3 mb-1.5">
        <div
          className={cn(
            "w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-mono-num font-bold border shrink-0",
            active && "bg-primary text-primary-foreground border-primary",
            done && "bg-primary/20 text-primary border-primary/40",
            !active && !done && "bg-muted text-muted-foreground border-border"
            )}
          >
          {done ? <Check size={14} weight="bold" /> : String(i + 1).padStart(2, "0")}
        </div>
        <span className={cn("text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-bold truncate",
                            active ? "text-primary" : "text-muted-foreground")}>
        Etapa {i + 1}
        </span>
        </div>
        <div className={cn(
            "font-display font-bold text-xs sm:text-sm lg:text-base leading-tight",
            active ? "text-foreground" : "text-foreground/80"
            )}>
          {s.title}
        </div>
        </button>
        );
    })}
    </div>
    </div>
    );
}
