import React from "react";
import { motion } from "framer-motion";
import { Plus, Trash, Stack, Coins, Factory } from "@phosphor-icons/react";
import { useCalculator } from "@/contexts/CalculatorContext";
import { LEAN_WASTES, formatBRL, formatBRLDecimal } from "@/lib/calculations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function Step3Costs() {
  const {
    volumePeriodo, setVolumePeriodo,
    revenueMonthly, setRevenueMonthly,
    selectedWastes,
    costItems, setCostItems,
    result,
  } = useCalculator();

  const availableWastes = LEAN_WASTES.filter((w) => selectedWastes.includes(w.id));

  const updateItem = (id, patch) => {
    setCostItems(costItems.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };
  const addItem = () => {
    setCostItems([
      ...costItems,
      {
        id: crypto.randomUUID(),
        description: "",
        unit_cost: 0,
        category: availableWastes[0]?.id || LEAN_WASTES[0].id,
      },
    ]);
  };
  const removeItem = (id) => setCostItems(costItems.filter((it) => it.id !== id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-primary font-bold mb-2">Etapa 03 · Custos das Perdas</div>
        <h2 className="font-display font-black text-3xl lg:text-4xl tracking-tight">Volume e custos do período</h2>
        <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-relaxed">
          Informe o volume mensal de produção e os itens de custo unitários. Cada item será classificado em um dos tipos de perda Lean selecionados.
        </p>
      </div>

      {/* Volume + Faturamento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Factory size={18} weight="duotone" className="text-primary" />
            <Label className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">Volume mensal</Label>
          </div>
          <Input
            data-testid="input-volume"
            type="number"
            value={volumePeriodo}
            onChange={(e) => setVolumePeriodo(Number(e.target.value || 0))}
            className="bg-muted border-border h-12 font-mono-num text-lg"
          />
          <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider">unidades / toneladas / itens</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Coins size={18} weight="duotone" className="text-primary" />
            <Label className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">Faturamento mensal (opcional)</Label>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono-num">R$</span>
            <Input
              data-testid="input-revenue"
              type="number"
              value={revenueMonthly}
              onChange={(e) => setRevenueMonthly(Number(e.target.value || 0))}
              className="bg-muted border-border h-12 pl-10 font-mono-num text-lg"
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider">Para calcular % do faturamento</p>
        </div>

        <div className="bg-card border border-primary/40 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Stack size={18} weight="duotone" className="text-primary" />
            <Label className="text-[10px] uppercase tracking-[0.25em] font-bold text-primary">Perda mensal (preview)</Label>
          </div>
          <div className="font-mono-num font-bold text-2xl text-destructive">
            {formatBRL(result.total_perda_real_mensal)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider">{formatBRL(result.total_perda_real_anual)} / ano</p>
        </div>
      </div>

      {/* Cost items table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">Itens de Custo</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            data-testid="add-cost-item"
            disabled={availableWastes.length === 0}
            className="h-8 border-border"
          >
            <Plus size={14} weight="bold" /> Adicionar item
          </Button>
        </div>

        {availableWastes.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Volte à etapa anterior e selecione ao menos um tipo de perda.
          </div>
        ) : costItems.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Nenhum item adicionado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground bg-muted/40">
                <tr>
                  <th className="text-left font-bold p-3">Descrição</th>
                  <th className="text-right font-bold p-3 w-40">Custo Unitário</th>
                  <th className="text-left font-bold p-3 w-52">Categoria Lean</th>
                  <th className="text-right font-bold p-3 w-44">Perda Anual</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {costItems.map((it, idx) => {
                  const itemResult = result.items.find((r) => r.id === it.id);
                  return (
                    <tr key={it.id} className="border-t border-border/40 hover:bg-muted/20">
                      <td className="p-2">
                        <Input
                          data-testid={`cost-desc-${idx}`}
                          value={it.description}
                          onChange={(e) => updateItem(it.id, { description: e.target.value })}
                          placeholder="Ex: matéria-prima"
                          className="bg-transparent border-transparent hover:border-border h-9 text-sm"
                        />
                      </td>
                      <td className="p-2">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-mono-num">R$</span>
                          <Input
                            data-testid={`cost-unit-${idx}`}
                            type="number"
                            step="0.01"
                            value={it.unit_cost}
                            onChange={(e) => updateItem(it.id, { unit_cost: Number(e.target.value || 0) })}
                            className="bg-transparent border-transparent hover:border-border h-9 pl-9 text-right font-mono-num text-sm"
                          />
                        </div>
                      </td>
                      <td className="p-2">
                        <Select value={it.category} onValueChange={(v) => updateItem(it.id, { category: v })}>
                          <SelectTrigger data-testid={`cost-cat-${idx}`} className="h-9 bg-transparent border-transparent hover:border-border text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableWastes.map((w) => (
                              <SelectItem key={w.id} value={w.id}>{w.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2 text-right font-mono-num text-sm">
                        <span className={itemResult?.perda_real_anual > 0 ? "text-destructive font-bold" : "text-muted-foreground"}>
                          {formatBRLDecimal(itemResult?.perda_real_anual || 0)}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(it.id)}
                          data-testid={`remove-cost-${idx}`}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash size={14} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
