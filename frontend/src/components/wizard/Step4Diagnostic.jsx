import React from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { Target, ArrowsClockwise, Warning } from "@phosphor-icons/react";
import { useCalculator } from "@/contexts/CalculatorContext";
import { formatBRLDecimal } from "@/lib/calculations";
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
            end={result.pmm_anual}
            duration={2.4}
            separator="."
            decimal=","
            prefix="R$ "
            decimals={2}
            preserveValue
          />
          <span className="text-2xl lg:text-3xl text-muted-foreground font-mono-num font-medium tracking-widest ml-3">/ ANO</span>
        </div>
        <p className="text-muted-foreground mt-4 max-w-2xl text-base lg:text-lg">
          Perda anual = <span className="font-mono-num text-foreground">PMM × 12</span> = <span className="text-foreground font-bold font-mono-num">{formatBRLDecimal(result.pmm)}/mês × 12</span>
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
              <CountUp end={result.valor_recuperavel_anual} duration={2.4} separator="." decimal="," prefix="R$ " decimals={2} preserveValue />
            </div>
            <div className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground mt-2">/ ano do seu GAP</div>

            <div className="mt-5 pt-4 border-t border-border/40 grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">Recuperação Mensal</div>
                <div className="font-mono-num font-bold text-2xl mt-1 text-emerald-400">
                  <CountUp end={result.valor_recuperavel_mensal} duration={2.4} separator="." decimal="," prefix="R$ " decimals={2} preserveValue />
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">Fórmula</div>
                <div className="font-mono-num text-[11px] mt-1 text-foreground leading-tight">
                  {result.meta_reducao_pct}% × Perda Anual
                </div>
                <div className="font-mono-num text-[11px] mt-0.5 text-muted-foreground leading-tight">
                  = {result.meta_reducao_pct}% × {formatBRLDecimal(result.pmm_anual)}
                </div>
              </div>
            </div>
          </div>
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
