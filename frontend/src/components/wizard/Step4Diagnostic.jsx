import React from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import {
  TrendDown, Warning, Coins, ChartPieSlice, ChartBar, Sparkle, Lightning, Factory,
} from "@phosphor-icons/react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { useCalculator } from "@/contexts/CalculatorContext";
import { LEAN_WASTES, formatBRL, formatBRLDecimal, formatNum, formatPct } from "@/lib/calculations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Step4Diagnostic() {
  const {
    result,
    historical,
    performanceAtualOverride,
    valorReferencia,
    volumePeriodo,
    setVolumePeriodo,
    lossItems,
  } = useCalculator();

  const totalProducao = result.volume_periodo;
  const fracGap = Math.min(1, Math.max(0, result.gap_eficiencia / 100));
  const totalDesperdicioVol = totalProducao * fracGap;
  const efetivo = Math.max(0, totalProducao - totalDesperdicioVol);

  const donutData = [
    { name: "Produção efetiva", value: efetivo, color: "hsl(217.2, 91.2%, 59.8%)" },
    { name: "Desperdício (GAP)", value: totalDesperdicioVol, color: "hsl(0, 84.2%, 60.2%)" },
  ];

  const barData = LEAN_WASTES
    .map((w) => ({
      name: w.label,
      id: w.id,
      Perda: result.perdas_por_categoria[w.id] || 0,
    }))
    .filter((d) => d.Perda > 0)
    .sort((a, b) => b.Perda - a.Perda);

  const semCategoria = result.perdas_por_categoria["_SEM_CATEGORIA"] || 0;
  if (semCategoria > 0) {
    barData.push({ name: "Sem categoria", id: "_SEM_CATEGORIA", Perda: semCategoria });
  }

  const saveSimulation = async () => {
    try {
      const payload = {
        name: `Simulação ${new Date().toLocaleDateString("pt-BR")}`,
        input: {
          historical,
          performance_atual: performanceAtualOverride !== null && performanceAtualOverride !== ""
            ? Number(performanceAtualOverride) : null,
          valor_referencia: Number(valorReferencia),
          volume_periodo: Number(volumePeriodo),
          loss_items: lossItems,
        },
        result: {
          performance_atual: result.performance_atual,
          valor_referencia: result.valor_referencia,
          gap_eficiencia: result.gap_eficiencia,
          volume_periodo: result.volume_periodo,
          soma_perdas: result.soma_perdas,
          items: result.items.map((i) => ({
            id: i.id, description: i.description, unit_cost: i.unit_cost, category: i.category || "",
            impacto_mensal: i.impacto_mensal, impacto_anual: i.impacto_anual,
          })),
          impacto_mensal: result.impacto_mensal,
          impacto_anual: result.impacto_anual,
          perdas_por_categoria: result.perdas_por_categoria,
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

  const isCritical = result.nivel_desperdicio === "critico" && result.impacto_mensal > 0;

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
          Conversão · Impacto Financeiro
        </div>
        <h2 className="font-display font-black text-4xl lg:text-6xl tracking-tight leading-[0.95]">
          Você está perdendo
        </h2>
        <div
          className={`font-display font-black text-5xl lg:text-8xl mt-2 tracking-tight ${isCritical ? "critical-text text-destructive" : "text-destructive"}`}
          data-testid="result-monthly-loss"
        >
          <CountUp
            end={result.impacto_mensal}
            duration={2.4}
            separator="."
            decimal=","
            prefix="R$ "
            decimals={0}
          />
          <span className="text-2xl lg:text-3xl text-muted-foreground font-mono-num font-medium tracking-widest ml-3">/ MÊS</span>
        </div>
        <p className="text-muted-foreground mt-4 max-w-2xl text-base lg:text-lg">
          Baseado no seu GAP de <span className="text-foreground font-bold font-mono-num">{formatNum(result.gap_eficiencia, 2)} pts</span>, volume de <span className="text-foreground font-bold font-mono-num">{formatNum(result.volume_periodo, 0)}</span> un/mês e <span className="text-foreground font-bold font-mono-num">{formatBRLDecimal(result.soma_perdas)}</span> em perdas identificadas.
        </p>
      </div>

      {/* Volume input — the final input before seeing impact */}
      <div className="bg-card border border-primary/40 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(closest-side, hsla(217.2, 91.2%, 59.8%, 0.10), transparent 70%)" }} />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Factory size={18} weight="duotone" className="text-primary" />
              <Label className="text-[10px] uppercase tracking-[0.25em] font-bold text-primary">Volume de produção mensal</Label>
            </div>
            <Input
              data-testid="input-volume"
              type="number"
              value={volumePeriodo}
              onChange={(e) => setVolumePeriodo(Number(e.target.value || 0))}
              className="bg-muted border-border h-14 font-mono-num text-2xl"
            />
            <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider">
              Unidades produzidas ou vendidas no mês (peças, toneladas, pedidos etc.)
            </p>
          </div>
          <div className="flex-shrink-0 w-full lg:w-auto font-mono-num text-xs text-muted-foreground bg-muted/30 border border-border rounded-lg p-4">
            <div className="uppercase tracking-[0.2em] font-bold mb-2 text-[10px]">Fórmula · Conversão</div>
            <div className="text-foreground">
              <span className="text-primary">Volume</span> × <span className="text-primary">GAP%</span> × <span className="text-primary">Σ Perdas</span>
            </div>
            <div className="mt-1 text-[10px]">
              {formatNum(result.volume_periodo, 0)} × {formatNum(result.gap_eficiencia, 2)}% × {formatBRLDecimal(result.soma_perdas)}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="kpi-grid">
        <div className="bg-card border border-destructive/40 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-destructive/10 rounded-full blur-3xl" />
          <Coins size={22} weight="duotone" className="text-destructive mb-3" />
          <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">Impacto Anual</div>
          <div className="font-mono-num font-bold text-3xl lg:text-4xl mt-2 text-destructive" data-testid="result-annual-loss">
            <CountUp end={result.impacto_anual} duration={2.4} separator="." decimal="," prefix="R$ " decimals={0} />
          </div>
          <div className="text-xs text-muted-foreground mt-2">Mensal × 12</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <TrendDown size={22} weight="duotone" className="text-primary mb-3" />
          <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">GAP de Eficiência</div>
          <div className="font-mono-num font-bold text-3xl lg:text-4xl mt-2">
            <CountUp end={result.gap_eficiencia} duration={2} decimals={2} suffix=" pts" />
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Atual: <span className="font-mono-num">{formatNum(result.performance_atual, 1)}</span> · Ref: <span className="font-mono-num">{formatNum(result.valor_referencia, 1)}</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <Sparkle size={22} weight="duotone" className="text-primary mb-3" />
          <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">Σ Perdas unitárias</div>
          <div className="font-mono-num font-bold text-3xl lg:text-4xl mt-2">
            <CountUp end={result.soma_perdas} duration={2} decimals={2} prefix="R$ " separator="." decimal="," />
          </div>
          <div className="text-xs text-muted-foreground mt-2">{result.items.length} perda(s) identificada(s)</div>
        </div>
      </div>

      {/* Emotional impact strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { icon: Lightning, t: "Esse valor poderia estar no seu lucro." },
          { icon: Warning, t: "Você está sangrando dinheiro todos os meses." },
          { icon: Coins, t: `Em 12 meses, ${formatBRL(result.impacto_anual)} jogados fora.` },
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
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">Produção vs Desperdício (GAP)</span>
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
              <span className="ml-auto font-mono-num font-bold">{totalDesperdicioVol.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>

        {/* Bar by category */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <ChartBar size={18} weight="duotone" className="text-primary" />
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">Impacto anual por categoria Lean</span>
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

      {/* Detailed breakdown table (without "Perda Anual" column — now "Impacto") */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">Detalhamento por perda identificada</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground bg-muted/40">
              <tr>
                <th className="text-left font-bold p-3">Descrição da Perda</th>
                <th className="text-left font-bold p-3">Tipo Lean</th>
                <th className="text-right font-bold p-3">Custo Unitário</th>
                <th className="text-right font-bold p-3">Impacto Mensal</th>
                <th className="text-right font-bold p-3">Impacto Anual</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((it) => {
                const cat = LEAN_WASTES.find((w) => w.id === it.category);
                return (
                  <tr key={it.id} className="border-t border-border/40">
                    <td className="p-3">{it.description || <span className="text-muted-foreground italic">sem descrição</span>}</td>
                    <td className="p-3">
                      {cat ? (
                        <span className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/30 text-primary text-[10px] uppercase tracking-wider font-bold">
                          {cat.label}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[10px] uppercase tracking-wider">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono-num text-muted-foreground">{formatBRLDecimal(it.unit_cost)}</td>
                    <td className="p-3 text-right font-mono-num">{formatBRLDecimal(it.impacto_mensal)}</td>
                    <td className="p-3 text-right font-mono-num font-bold text-destructive">{formatBRLDecimal(it.impacto_anual)}</td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-primary/40 bg-primary/5">
                <td colSpan={3} className="p-3 text-right text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">Totalização</td>
                <td className="p-3 text-right font-mono-num font-bold">{formatBRLDecimal(result.impacto_mensal)}</td>
                <td className="p-3 text-right font-mono-num font-black text-destructive text-base">{formatBRLDecimal(result.impacto_anual)}</td>
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
