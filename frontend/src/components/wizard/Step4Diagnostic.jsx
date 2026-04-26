import React from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import {
  TrendDown, Warning, Coins, ChartPieSlice, ChartBar, Sparkle, Lightning,
} from "@phosphor-icons/react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { useCalculator } from "@/contexts/CalculatorContext";
import { LEAN_WASTES, formatBRL, formatBRLDecimal, formatPct } from "@/lib/calculations";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Step4Diagnostic() {
  const { result, historical, performanceAtualOverride, valorReferencia, volumePeriodo, revenueMonthly, selectedWastes, costItems } = useCalculator();

  const totalProducao = result.volume_periodo;
  const totalDesperdicio = result.total_perda_real_mensal > 0
    ? totalProducao * Math.min(1, Math.max(0, (result.gap_eficiencia / 100)))
    : 0;
  const efetivo = Math.max(0, totalProducao - totalDesperdicio);

  const donutData = [
    { name: "Produção efetiva", value: efetivo, color: "hsl(217.2, 91.2%, 59.8%)" },
    { name: "Desperdício", value: totalDesperdicio, color: "hsl(0, 84.2%, 60.2%)" },
  ];

  const barData = LEAN_WASTES
    .map((w) => ({
      name: w.label,
      id: w.id,
      Perda: result.perdas_por_categoria[w.id] || 0,
    }))
    .filter((d) => d.Perda > 0)
    .sort((a, b) => b.Perda - a.Perda);

  const saveSimulation = async () => {
    try {
      const payload = {
        name: `Simulação ${new Date().toLocaleDateString("pt-BR")}`,
        input: {
          historical,
          performance_atual: performanceAtualOverride !== null && performanceAtualOverride !== "" ? Number(performanceAtualOverride) : null,
          valor_referencia: Number(valorReferencia),
          volume_periodo: Number(volumePeriodo),
          revenue_monthly: Number(revenueMonthly),
          selected_wastes: selectedWastes,
          cost_items: costItems,
        },
        result: {
          performance_atual: result.performance_atual,
          valor_referencia: result.valor_referencia,
          gap_eficiencia: result.gap_eficiencia,
          volume_periodo: result.volume_periodo,
          items: result.items.map((i) => ({
            id: i.id, description: i.description, unit_cost: i.unit_cost, category: i.category,
            perda_atual: i.perda_atual, perda_referencia: i.perda_referencia,
            perda_real_mensal: i.perda_real_mensal, perda_real_anual: i.perda_real_anual,
          })),
          total_perda_atual_mensal: result.total_perda_atual_mensal,
          total_perda_referencia_mensal: result.total_perda_referencia_mensal,
          total_perda_real_mensal: result.total_perda_real_mensal,
          total_perda_real_anual: result.total_perda_real_anual,
          perdas_por_categoria: result.perdas_por_categoria,
          pct_faturamento: result.pct_faturamento,
          nivel_desperdicio: result.nivel_desperdicio,
        },
      };
      await axios.post(`${API}/simulations`, payload);
      toast.success("Simulação salva com sucesso");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar simulação");
    }
  };

  const isCritical = result.nivel_desperdicio === "critico" && result.total_perda_real_mensal > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-10"
    >
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-destructive/30 bg-destructive/10 text-destructive text-xs uppercase tracking-[0.2em] font-bold mb-5">
          <Warning size={12} weight="fill" />
          Diagnóstico
        </div>
        <h2 className="font-display font-black text-4xl lg:text-6xl tracking-tight leading-[0.95]">
          Você está perdendo
        </h2>
        <div className={`font-display font-black text-5xl lg:text-8xl mt-2 tracking-tight ${isCritical ? "critical-text text-destructive" : "text-destructive"}`}
          data-testid="result-monthly-loss">
          <CountUp
            end={result.total_perda_real_mensal}
            duration={2.4}
            separator="."
            decimal=","
            prefix="R$ "
            decimals={0}
          />
          <span className="text-2xl lg:text-3xl text-muted-foreground font-mono-num font-medium tracking-widest ml-3">/ MÊS</span>
        </div>
        <p className="text-muted-foreground mt-4 max-w-2xl text-base lg:text-lg">
          Baseado no GAP de eficiência de <span className="text-foreground font-bold font-mono-num">{formatPct(result.gap_eficiencia, 2)}</span> entre sua Performance Atual e o Valor de Referência.
        </p>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="kpi-grid">
        <div className="bg-card border border-destructive/40 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-destructive/10 rounded-full blur-3xl" />
          <Coins size={22} weight="duotone" className="text-destructive mb-3" />
          <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">Perda Anual</div>
          <div className="font-mono-num font-bold text-3xl lg:text-4xl mt-2 text-destructive" data-testid="result-annual-loss">
            <CountUp end={result.total_perda_real_anual} duration={2.4} separator="." decimal="," prefix="R$ " decimals={0} />
          </div>
          <div className="text-xs text-muted-foreground mt-2">Mensal × 12</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <TrendDown size={22} weight="duotone" className="text-primary mb-3" />
          <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">GAP de Eficiência</div>
          <div className="font-mono-num font-bold text-3xl lg:text-4xl mt-2">
            <CountUp end={result.gap_eficiencia} duration={2} decimals={2} suffix="%" />
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Atual: <span className="font-mono-num">{formatPct(result.performance_atual, 1)}</span> · Ref: <span className="font-mono-num">{formatPct(result.valor_referencia, 1)}</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <Sparkle size={22} weight="duotone" className="text-primary mb-3" />
          <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">% do Faturamento</div>
          <div className="font-mono-num font-bold text-3xl lg:text-4xl mt-2">
            {result.pct_faturamento !== null && result.pct_faturamento !== undefined ? (
              <CountUp end={result.pct_faturamento} duration={2.2} decimals={2} suffix="%" />
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {result.pct_faturamento ? `da sua receita mensal` : "Informe o faturamento"}
          </div>
        </div>
      </div>

      {/* Emotional impact strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { icon: Lightning, t: "Esse valor poderia estar no seu lucro." },
          { icon: Warning, t: "Você está deixando dinheiro na mesa todos os meses." },
          { icon: Coins, t: `Em 12 meses, isso é ${formatBRL(result.total_perda_real_anual)} jogados fora.` },
        ].map((e, i) => (
          <div key={i} className="bg-gradient-to-br from-destructive/10 to-card border border-destructive/20 rounded-xl p-5">
            <e.icon size={18} weight="duotone" className="text-destructive mb-2" />
            <p className="font-display font-bold text-base lg:text-lg leading-tight">{e.t}</p>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <ChartPieSlice size={18} weight="duotone" className="text-primary" />
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">Produção vs Desperdício</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%" cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive
                >
                  {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(222.2, 47%, 7%)",
                    border: "1px solid hsl(217.2, 32.6%, 25%)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
              <span className="text-muted-foreground">Efetiva</span>
              <span className="ml-auto font-mono-num font-bold">{efetivo.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-sm bg-destructive" />
              <span className="text-muted-foreground">Desperdício</span>
              <span className="ml-auto font-mono-num font-bold">{totalDesperdicio.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>

        {/* Bar by category */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <ChartBar size={18} weight="duotone" className="text-primary" />
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">Perda anual por categoria Lean</span>
          </div>
          <div className="h-64">
            {barData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem perdas categorizadas.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
                  <CartesianGrid stroke="hsl(217.2, 32.6%, 17.5%)" strokeDasharray="2 4" horizontal={false} />
                  <XAxis type="number" stroke="hsl(215, 20.2%, 55%)" tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" stroke="hsl(215, 20.2%, 55%)" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={110} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(222.2, 47%, 7%)",
                      border: "1px solid hsl(217.2, 32.6%, 25%)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v) => formatBRLDecimal(v)}
                  />
                  <Bar dataKey="Perda" fill="hsl(217.2, 91.2%, 59.8%)" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Detailed breakdown table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">Classificação detalhada</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground bg-muted/40">
              <tr>
                <th className="text-left font-bold p-3">Item</th>
                <th className="text-left font-bold p-3">Categoria</th>
                <th className="text-right font-bold p-3">Perda Atual</th>
                <th className="text-right font-bold p-3">Perda Referência</th>
                <th className="text-right font-bold p-3">Real Mensal</th>
                <th className="text-right font-bold p-3">Real Anual</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((it) => {
                const cat = LEAN_WASTES.find((w) => w.id === it.category);
                return (
                  <tr key={it.id} className="border-t border-border/40">
                    <td className="p-3">{it.description || <span className="text-muted-foreground italic">sem descrição</span>}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/30 text-primary text-[10px] uppercase tracking-wider font-bold">
                        {cat?.label || it.category}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono-num text-muted-foreground">{formatBRLDecimal(it.perda_atual)}</td>
                    <td className="p-3 text-right font-mono-num text-muted-foreground">{formatBRLDecimal(it.perda_referencia)}</td>
                    <td className="p-3 text-right font-mono-num">{formatBRLDecimal(it.perda_real_mensal)}</td>
                    <td className="p-3 text-right font-mono-num font-bold text-destructive">{formatBRLDecimal(it.perda_real_anual)}</td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-primary/40 bg-primary/5">
                <td colSpan={4} className="p-3 text-right text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">Totalização das Perdas</td>
                <td className="p-3 text-right font-mono-num font-bold">{formatBRLDecimal(result.total_perda_real_mensal)}</td>
                <td className="p-3 text-right font-mono-num font-black text-destructive text-base">{formatBRLDecimal(result.total_perda_real_anual)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button data-testid="save-simulation-btn" onClick={saveSimulation} className="h-12 px-6 font-bold">
          Salvar simulação
        </Button>
        <Button
          data-testid="print-btn"
          variant="outline"
          onClick={() => window.print()}
          className="h-12 px-6 font-bold border-border"
        >
          Imprimir / PDF
        </Button>
      </div>
    </motion.div>
  );
}
