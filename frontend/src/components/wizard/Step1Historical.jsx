import React from "react";
import { motion } from "framer-motion";
import { Plus, Trash, ChartLineUp, Sparkle } from "@phosphor-icons/react";
import { useCalculator } from "@/contexts/CalculatorContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  ResponsiveContainer, LineChart, Line, ReferenceLine, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { formatPct } from "@/lib/calculations";

export default function Step1Historical() {
  const {
    historical, setHistorical,
    performanceAtualOverride, setPerformanceAtualOverride,
    valorReferencia, setValorReferencia,
    result,
  } = useCalculator();

  const updatePoint = (idx, value) => {
    const next = [...historical];
    next[idx] = { ...next[idx], value: Number(value) };
    setHistorical(next);
  };

  const updateLabel = (idx, label) => {
    const next = [...historical];
    next[idx] = { ...next[idx], label };
    setHistorical(next);
  };

  const addPoint = () => {
    setHistorical([...historical, { label: `Mês ${historical.length + 1}`, value: 0 }]);
  };

  const removePoint = (idx) => {
    setHistorical(historical.filter((_, i) => i !== idx));
  };

  const chartData = historical.map((p) => ({
    label: p.label,
    Produtividade: Number(p.value || 0),
    Referencia: Number(valorReferencia || 0),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-primary font-bold mb-2">Etapa 01 · Avaliação Histórica</div>
        <h2 className="font-display font-black text-3xl lg:text-4xl tracking-tight">Sua produtividade ao longo do tempo</h2>
        <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-relaxed">
          Insira os dados históricos de produtividade (%) do seu processo. A média será sua <span className="text-foreground font-semibold">Performance Atual</span>. Em seguida defina o <span className="text-foreground font-semibold">Valor de Referência</span> ideal para calcular o GAP de eficiência.
        </p>
      </div>

      {/* Chart preview */}
      <div className="bg-card border border-border rounded-xl p-5 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ChartLineUp size={18} weight="duotone" className="text-primary" />
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">Série Temporal</span>
          </div>
          <div className="text-xs font-mono-num text-muted-foreground">
            {historical.length} pontos
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="hsl(217.2, 32.6%, 17.5%)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="label" stroke="hsl(215, 20.2%, 55%)" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis stroke="hsl(215, 20.2%, 55%)" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(222.2, 47%, 7%)",
                  border: "1px solid hsl(217.2, 32.6%, 25%)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "hsl(210, 40%, 98%)" }}
              />
              <Line
                type="monotone"
                dataKey="Referencia"
                stroke="hsl(150, 70%, 40%)"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Produtividade"
                stroke="hsl(217.2, 91.2%, 59.8%)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "hsl(217.2, 91.2%, 59.8%)" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Atual + Referência */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Label className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">Performance Atual</Label>
              <div className="font-mono-num font-bold text-4xl mt-2 text-foreground">
                {formatPct(result.performance_atual, 2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {performanceAtualOverride ? "Valor manual" : "Calculado: média da série acima"}
              </p>
            </div>
            <Sparkle size={20} weight="duotone" className="text-primary" />
          </div>
          <Input
            data-testid="input-perf-override"
            type="number"
            step="0.01"
            placeholder="Sobrescrever (opcional)"
            value={performanceAtualOverride ?? ""}
            onChange={(e) => setPerformanceAtualOverride(e.target.value === "" ? null : e.target.value)}
            className="bg-muted border-border h-11 font-mono-num"
          />
        </div>

        <div className="bg-card border border-primary/40 rounded-xl p-6">
          <Label className="text-[10px] uppercase tracking-[0.25em] font-bold text-primary">Valor de Referência (%)</Label>
          <div className="flex items-baseline gap-3 mt-2">
            <div className="font-mono-num font-bold text-4xl text-primary">{Number(valorReferencia || 0).toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">%</div>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 mb-5">Performance ideal do seu processo</p>
          <div className="slider-glow">
            <Slider
              data-testid="slider-referencia"
              value={[Number(valorReferencia)]}
              min={0}
              max={100}
              step={0.5}
              onValueChange={([v]) => setValorReferencia(v)}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-mono-num text-muted-foreground">
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
        </div>
      </div>

      {/* GAP banner */}
      <div className={`rounded-xl border p-5 flex items-center justify-between ${
        result.nivel_desperdicio === "critico" ? "bg-destructive/10 border-destructive/40" :
        result.nivel_desperdicio === "atencao" ? "bg-yellow-500/10 border-yellow-500/40" :
        "bg-emerald-500/10 border-emerald-500/40"
      }`} data-testid="gap-banner">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">GAP de Eficiência</div>
          <div className="font-mono-num font-bold text-3xl mt-1">{formatPct(result.gap_eficiencia, 2)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase font-bold tracking-wider mb-1">
            {result.nivel_desperdicio === "critico" ? "Crítico" :
             result.nivel_desperdicio === "atencao" ? "Atenção" : "OK"}
          </div>
          <div className="text-xs text-muted-foreground">
            {result.nivel_desperdicio === "critico" && "GAP > 20% — alto desperdício"}
            {result.nivel_desperdicio === "atencao" && "GAP entre 5%-20%"}
            {result.nivel_desperdicio === "ok" && "GAP ≤ 5% — saudável"}
          </div>
        </div>
      </div>

      {/* Editable historical table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">Editar Pontos</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPoint}
            data-testid="add-historical-point"
            className="h-8 border-border"
          >
            <Plus size={14} weight="bold" /> Adicionar mês
          </Button>
        </div>
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground bg-muted/40 sticky top-0 backdrop-blur">
              <tr>
                <th className="text-left font-bold p-3 w-1/2">Período</th>
                <th className="text-right font-bold p-3">Produtividade (%)</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {historical.map((p, i) => (
                <tr key={i} className="border-t border-border/40 hover:bg-muted/20">
                  <td className="p-2">
                    <Input
                      data-testid={`historical-label-${i}`}
                      value={p.label}
                      onChange={(e) => updateLabel(i, e.target.value)}
                      className="bg-transparent border-transparent hover:border-border h-9 text-sm"
                    />
                  </td>
                  <td className="p-2 text-right">
                    <Input
                      data-testid={`historical-value-${i}`}
                      type="number"
                      step="0.01"
                      value={p.value}
                      onChange={(e) => updatePoint(i, e.target.value)}
                      className="bg-transparent border-transparent hover:border-border h-9 text-right font-mono-num text-sm"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePoint(i)}
                      data-testid={`remove-historical-${i}`}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
