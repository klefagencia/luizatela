import React from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import {
  TrendDown, Warning, Coins, ChartPieSlice, ChartBar, Sparkle, Lightning, Target, ArrowsClockwise,
} from "@phosphor-icons/react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { useCalculator } from "@/contexts/CalculatorContext";
import { LEAN_WASTES, formatBRL, formatBRLDecimal, formatNum } from "@/lib/calculations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
    indicatorName, denominatorName,
    lossItems,
    metaReducaoPct, setMetaReducaoPct,
    efficiencyType,
    unidadeMedida,
  } = useCalculator();

  // Donut: top-down perda vs itens identificados
  const donutData = [
    { name: "Perda top-down (Etapa 2)", value: result.perda_financeira_mensal, color: "hsl(217.2, 91.2%, 59.8%)" },
    { name: "Perdas identificadas (Etapa 3)", value: result.impacto_mensal, color: "hsl(0, 84.2%, 60.2%)" },
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
          efficiency_type: efficiencyType,
          unidade_medida: unidadeMedida,
          indicator_name: indicatorName,
          denominator_name: denominatorName,
          historical,
          performance_atual: performanceAtualOverride !== null && performanceAtualOverride !== ""
            ? Number(performanceAtualOverride) : null,
          valor_referencia: Number(valorReferencia),
          loss_items: lossItems,
          meta_reducao_pct: Number(metaReducaoPct || 0),
        },
        result: {
          performance_atual: result.performance_atual,
          valor_referencia: result.valor_referencia,
          gap_eficiencia: result.gap_eficiencia,
          gap_direction: result.gap_direction,
          fator_ponderacao_atual: result.fator_ponderacao_atual,
          perda_financeira_mensal: result.perda_financeira_mensal,
          perda_financeira_anual: result.perda_financeira_anual,
          soma_perdas: result.soma_perdas,
          items: result.items.map((i) => ({
            id: i.id, description: i.description,
            unit_cost: i.unit_cost,
            ocorrencia_mensal: Number(i.ocorrencia_mensal || 0),
            category: i.category || "",
            custo_mensal: i.custo_mensal, custo_anual: i.custo_anual,
          })),
          impacto_mensal: result.impacto_mensal,
          impacto_anual: result.impacto_anual,
          meta_reducao_pct: result.meta_reducao_pct,
          valor_recuperavel_mensal: result.valor_recuperavel_mensal,
          valor_recuperavel_anual: result.valor_recuperavel_anual,
          perdas_por_categoria: result.perdas_por_categoria,
          nivel_desperdicio: result.nivel_desperdicio,
        },
      };
      await axios.post(`${API}/simulations`, payload);
      toast.success("Simulação salva com sucesso");
    } catch (e) {
      console.error("Erro ao salvar:", e?.response?.data || e?.message || e);
      const detail = e?.response?.data?.detail;
      const msg = typeof detail === "string"
        ? detail
        : Array.isArray(detail) && detail[0]?.msg
        ? `${detail[0].loc?.join('.') || ''}: ${detail[0].msg}`
        : "Erro ao salvar simulação";
      toast.error(msg);
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
            decimals={2}
            preserveValue
          />
          <span className="text-2xl lg:text-3xl text-muted-foreground font-mono-num font-medium tracking-widest ml-3">/ MÊS</span>
        </div>
        <p className="text-muted-foreground mt-4 max-w-2xl text-base lg:text-lg">
          Soma dos custos mensais das <span className="text-foreground font-bold font-mono-num">{result.items.length}</span> perda(s) identificada(s) na Etapa 03, considerando custo unitário × ocorrência mensal.
        </p>
      </div>

      {/* Q11 · Meta de Redução + Valor Recuperável */}
      <div className="bg-gradient-to-br from-emerald-500/15 via-card to-card border-2 border-emerald-500/40 rounded-2xl p-8 lg:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(closest-side, hsla(150, 70%, 40%, 0.18), transparent 70%)" }} />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Target size={20} weight="duotone" className="text-emerald-400" />
              <Label className="text-[10px] uppercase tracking-[0.25em] font-bold text-emerald-400">
                Q11 · Meta de Redução das perdas
              </Label>
            </div>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed max-w-md">
              Quanto você acredita que consegue reduzir do desperdício identificado? Em geral, projetos Lean reduzem entre 20% e 50% no primeiro ciclo.
            </p>
            <div className="flex items-baseline gap-2 mb-4">
              <Input
                data-testid="input-meta-reducao"
                type="number"
                min="0"
                max="100"
                step="1"
                value={metaReducaoPct}
                onChange={(e) => setMetaReducaoPct(Number(e.target.value || 0))}
                className="bg-muted border-border h-16 font-mono-num font-black text-4xl lg:text-5xl w-32 text-center"
              />
              <span className="text-3xl text-emerald-400 font-mono-num font-bold">%</span>
            </div>
            <div className="slider-glow">
              <Slider
                data-testid="slider-meta-reducao"
                value={[Number(metaReducaoPct)]}
                min={0}
                max={100}
                step={1}
                onValueChange={([v]) => setMetaReducaoPct(v)}
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-mono-num text-muted-foreground">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>

          <div data-testid="valor-recuperavel-card" className="bg-card/70 border border-emerald-500/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <ArrowsClockwise size={18} weight="duotone" className="text-emerald-400" />
              <Label className="text-[10px] uppercase tracking-[0.25em] font-bold text-emerald-400">
                Você pode recuperar
              </Label>
            </div>
            <div className="font-display font-black text-4xl lg:text-6xl tracking-tight text-emerald-400 leading-none">
              <CountUp end={result.valor_recuperavel_mensal} duration={2.4} separator="." decimal="," prefix="R$ " decimals={2} preserveValue />
            </div>
            <div className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground mt-2">/ mês do seu GAP</div>

            <div className="mt-5 pt-4 border-t border-border/40 grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">Recuperação Anual</div>
                <div className="font-mono-num font-bold text-2xl mt-1 text-emerald-400">
                  <CountUp end={result.valor_recuperavel_anual} duration={2.4} separator="." decimal="," prefix="R$ " decimals={0} preserveValue />
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">Fórmula</div>
                <div className="font-mono-num text-[11px] mt-1 text-foreground leading-tight">
                  {result.meta_reducao_pct}% × Perda do GAP
                </div>
                <div className="font-mono-num text-[11px] mt-0.5 text-muted-foreground leading-tight">
                  = {result.meta_reducao_pct}% × {formatBRLDecimal(result.perda_financeira_mensal)}
                </div>
              </div>
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
            <CountUp end={result.impacto_anual} duration={2.4} separator="." decimal="," prefix="R$ " decimals={2} preserveValue />
          </div>
          <div className="text-xs text-muted-foreground mt-2">Mensal × 12</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <TrendDown size={22} weight="duotone" className="text-primary mb-3" />
          <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">GAP de Eficiência</div>
          <div className="font-mono-num font-bold text-3xl lg:text-4xl mt-2">
            <CountUp end={result.gap_eficiencia} duration={2} decimals={2} suffix=" pts" preserveValue />
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Atual: <span className="font-mono-num">{formatNum(result.performance_atual, 1)}%</span> · Ref: <span className="font-mono-num">{formatNum(result.valor_referencia, 1)}%</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <Sparkle size={22} weight="duotone" className="text-primary mb-3" />
          <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">Perda top-down (Etapa 2)</div>
          <div className="font-mono-num font-bold text-3xl lg:text-4xl mt-2">
            <CountUp end={result.perda_financeira_mensal} duration={2} decimals={2} prefix="R$ " separator="." decimal="," preserveValue />
          </div>
          <div className="text-xs text-muted-foreground mt-2">GAP × {denominatorName || "denominador"} médio</div>
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <ChartPieSlice size={18} weight="duotone" className="text-primary" />
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">Top-down vs Itemizado</span>
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
                  formatter={(v) => formatBRLDecimal(v)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 gap-1 mt-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
              <span className="text-muted-foreground">Top-down (GAP × Den.)</span>
              <span className="ml-auto font-mono-num font-bold">{formatBRLDecimal(result.perda_financeira_mensal)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm bg-destructive" />
              <span className="text-muted-foreground">Itemizado (Σ perdas)</span>
              <span className="ml-auto font-mono-num font-bold">{formatBRLDecimal(result.impacto_mensal)}</span>
            </div>
          </div>
        </div>

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

      {/* Detailed breakdown table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">Detalhamento por perda identificada</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground bg-muted/40">
              <tr>
                <th className="text-left font-bold p-3">Descrição</th>
                <th className="text-left font-bold p-3">Tipo Lean</th>
                <th className="text-right font-bold p-3">Unit.</th>
                <th className="text-right font-bold p-3">Ocor./mês</th>
                <th className="text-right font-bold p-3">Custo Mensal</th>
                <th className="text-right font-bold p-3">Custo Anual</th>
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
                    <td className="p-3 text-right font-mono-num">{Number(it.ocorrencia_mensal || 0)}</td>
                    <td className="p-3 text-right font-mono-num">{formatBRLDecimal(it.custo_mensal)}</td>
                    <td className="p-3 text-right font-mono-num font-bold text-destructive">{formatBRLDecimal(it.custo_anual)}</td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-primary/40 bg-primary/5">
                <td colSpan={4} className="p-3 text-right text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">Totalização</td>
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
