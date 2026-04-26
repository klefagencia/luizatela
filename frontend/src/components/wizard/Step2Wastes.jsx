import React from "react";
import { motion } from "framer-motion";
import { useCalculator } from "@/contexts/CalculatorContext";
import { LEAN_WASTES } from "@/lib/calculations";
import { Check } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export default function Step2Wastes() {
  const { selectedWastes, setSelectedWastes } = useCalculator();

  const toggle = (id) => {
    setSelectedWastes(
      selectedWastes.includes(id)
        ? selectedWastes.filter((w) => w !== id)
        : [...selectedWastes, id]
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-primary font-bold mb-2">Etapa 02 · Tipos de Perdas</div>
        <h2 className="font-display font-black text-3xl lg:text-4xl tracking-tight">Quais perdas existem no seu processo?</h2>
        <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-relaxed">
          Selecione os tipos de perdas Lean que afetam seu processo. Você poderá associar cada item de custo a uma destas categorias na próxima etapa.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {LEAN_WASTES.map((w, i) => {
          const active = selectedWastes.includes(w.id);
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => toggle(w.id)}
              data-testid={`waste-card-${w.id.toLowerCase()}`}
              className={cn(
                "group text-left relative p-5 rounded-xl border transition-all hover:translate-y-[-2px]",
                active
                  ? "bg-primary/10 border-primary"
                  : "bg-card border-border opacity-70 hover:opacity-100 hover:border-primary/40"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="font-mono-num text-[10px] tracking-widest text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div
                  className={cn(
                    "w-6 h-6 rounded-md border flex items-center justify-center transition-colors",
                    active ? "bg-primary border-primary" : "bg-muted border-border"
                  )}
                >
                  {active && <Check size={14} weight="bold" className="text-primary-foreground" />}
                </div>
              </div>
              <h3 className="font-display font-black text-base uppercase tracking-tight mb-1">
                {w.label}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{w.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">Selecionados</span>
        <span className="font-mono-num font-bold text-2xl text-primary" data-testid="selected-wastes-count">
          {selectedWastes.length} <span className="text-muted-foreground text-sm">/ 8</span>
        </span>
      </div>
    </motion.div>
  );
}
