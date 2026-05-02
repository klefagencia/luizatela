import React from "react";
import { motion } from "framer-motion";
import { Plus, Trash, Stack, ListChecks } from "@phosphor-icons/react";
import { useCalculator } from "@/contexts/CalculatorContext";
import { LEAN_WASTES, formatBRLDecimal } from "@/lib/calculations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function Step3LossesCosts() {
  const { lossItems, setLossItems, result } = useCalculator();

  const updateItem = (id, patch) => {
    setLossItems(lossItems.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };
  const addItem = () => {
    setLossItems([
      ...lossItems,
      {
        id: crypto.randomUUID(),
        description: "",
        unit_cost: 0,
        category: "",
      },
    ]);
  };
  const removeItem = (id) => setLossItems(lossItems.filter((it) => it.id !== id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-primary font-bold mb-2">Etapa 03 · Perdas e Custos</div>
        <h2 className="font-display font-black text-3xl lg:text-4xl tracking-tight">Identifique perdas específicas do seu processo</h2>
        <p className="text-muted-foreground mt-3 max-w-3xl text-sm leading-relaxed">
          Use a lista dos 8 desperdícios Lean como referência e identifique as <span className="text-foreground font-semibold">perdas concretas do seu processo</span>. Evite rótulos genéricos (ex: "matéria-prima") — descreva a perda real, como <span className="text-foreground italic">"Perda na entrega do produto"</span> ou <span className="text-foreground italic">"Perda no estoque ao guardar material"</span>. Depois informe o custo unitário correspondente.
        </p>
      </div>

      {/* 8 Lean wastes reference panel */}
      <div className="bg-card border border-border rounded-xl p-5 lg:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Stack size={18} weight="duotone" className="text-primary" />
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">Referência · 8 desperdícios Lean</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {LEAN_WASTES.map((w, i) => (
            <div
              key={w.id}
              data-testid={`waste-ref-${w.id.toLowerCase()}`}
              className="bg-muted/30 border border-border/60 rounded-lg p-3"
            >
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="font-mono-num text-[10px] text-primary">{String(i + 1).padStart(2, "0")}</span>
                <h4 className="font-display font-bold text-xs uppercase tracking-tight">{w.label}</h4>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">{w.example}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Losses dynamic table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ListChecks size={16} weight="duotone" className="text-primary" />
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">Suas Perdas Identificadas</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            data-testid="add-loss-item"
            className="h-8 border-border"
          >
            <Plus size={14} weight="bold" /> Adicionar perda
          </Button>
        </div>

        {lossItems.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Nenhuma perda adicionada ainda. Clique em "Adicionar perda" para começar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground bg-muted/40">
                <tr>
                  <th className="text-left font-bold p-3 w-12">#</th>
                  <th className="text-left font-bold p-3">Descrição da Perda</th>
                  <th className="text-right font-bold p-3 w-40">Custo Unitário</th>
                  <th className="text-left font-bold p-3 w-52">Tipo Lean (opcional)</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {lossItems.map((it, idx) => (
                  <tr key={it.id} className="border-t border-border/40 hover:bg-muted/20">
                    <td className="p-3 font-mono-num text-xs text-muted-foreground">{String(idx + 1).padStart(2, "0")}</td>
                    <td className="p-2">
                      <Input
                        data-testid={`loss-desc-${idx}`}
                        value={it.description}
                        onChange={(e) => updateItem(it.id, { description: e.target.value })}
                        placeholder="Ex: Perda na entrega do produto"
                        className="bg-transparent border-transparent hover:border-border h-9 text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-mono-num">R$</span>
                        <Input
                          data-testid={`loss-unit-${idx}`}
                          type="number"
                          step="0.01"
                          value={it.unit_cost}
                          onChange={(e) => updateItem(it.id, { unit_cost: Number(e.target.value || 0) })}
                          className="bg-transparent border-transparent hover:border-border h-9 pl-9 text-right font-mono-num text-sm"
                        />
                      </div>
                    </td>
                    <td className="p-2">
                      <Select
                        value={it.category || "__none__"}
                        onValueChange={(v) => updateItem(it.id, { category: v === "__none__" ? "" : v })}
                      >
                        <SelectTrigger data-testid={`loss-cat-${idx}`} className="h-9 bg-transparent border-transparent hover:border-border text-xs">
                          <SelectValue placeholder="Não classificar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Não classificar —</SelectItem>
                          {LEAN_WASTES.map((w) => (
                            <SelectItem key={w.id} value={w.id}>{w.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(it.id)}
                        data-testid={`remove-loss-${idx}`}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-primary/40 bg-primary/5">
                  <td colSpan={2} className="p-3 text-right text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">
                    Σ Soma das perdas identificadas
                  </td>
                  <td className="p-3 text-right font-mono-num font-bold text-primary text-base" data-testid="sum-losses">
                    {formatBRLDecimal(result.soma_perdas)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-muted/30 border border-border rounded-xl p-5 text-xs text-muted-foreground leading-relaxed">
        <span className="font-bold text-foreground">Próximo passo:</span> na etapa 4 (Conversão) você informará o volume de produção mensal e veremos o <span className="text-destructive font-bold">impacto financeiro total</span> dessas perdas combinadas com o seu GAP de eficiência.
      </div>
    </motion.div>
  );
}
