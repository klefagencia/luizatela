import React from "react";
import { motion } from "framer-motion";
import { Target, Sparkle, TrendUp, TrendDown } from "@phosphor-icons/react";
import { useCalculator } from "@/contexts/CalculatorContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { formatNum } from "@/lib/calculations";

export default function Step2Benchmark() {
  const {
    valorReferencia, setValorReferencia,
    result,
  } = useCalculator();

  const isBelow = result.gap_direction === "below_ref";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-primary font-bold mb-2">Etapa 02 · Benchmark</div>
        <h2 className="font-display font-black text-3xl lg:text-4xl tracking-tight">Qual é o valor de referência ideal?</h2>
        <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-relaxed">
          Pesquise e descubra qual é o <span className="text-foreground font-semibold">valor de referência da sua performance ideal</span> — pode ser uma meta interna, um competidor ou um padrão de mercado. O <span className="text-foreground font-semibold">GAP de Eficiência</span> será calculado automaticamente.
        </p>
      </div>

      {/* Benchmark input card */}
      <div className="bg-card border border-primary/40 rounded-2xl p-8 lg:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(closest-side, hsla(217.2, 91.2%, 59.8%, 0.12), transparent 70%)" }} />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Target size={20} weight="duotone" className="text-primary" />
            <Label className="text-[10px] uppercase tracking-[0.25em] font-bold text-primary">
              Valor de referência (Benchmark)
            </Label>
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-end gap-6 lg:gap-10">
            <div className="flex-1 w-full">
              <Input
                data-testid="input-benchmark"
                type="number"
                step="0.01"
                value={valorReferencia}
                onChange={(e) => setValorReferencia(Number(e.target.value || 0))}
                className="bg-muted border-border h-20 font-mono-num font-bold text-5xl lg:text-6xl text-center"
              />
              <div className="slider-glow mt-5">
                <Slider
                  data-testid="slider-benchmark"
                  value={[Number(valorReferencia)]}
                  min={0}
                  max={200}
                  step={0.5}
                  onValueChange={([v]) => setValorReferencia(v)}
                />
              </div>
              <div className="flex justify-between mt-2 text-[10px] font-mono-num text-muted-foreground">
                <span>0</span><span>100</span><span>200</span>
              </div>
            </div>

            <div className="flex-shrink-0 w-full lg:w-auto">
              <div className="bg-muted/40 border border-border rounded-xl p-5 min-w-[200px]">
                <Label className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">Performance Atual</Label>
                <div className="font-mono-num font-bold text-2xl lg:text-3xl mt-1.5 text-foreground">
                  {formatNum(result.performance_atual, 2)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">definida na etapa 01</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GAP result */}
      <div
        data-testid="gap-result"
        className={`rounded-2xl border-2 p-8 lg:p-10 relative overflow-hidden ${
          result.nivel_desperdicio === "critico"
            ? "border-destructive/60 bg-destructive/5"
            : result.nivel_desperdicio === "atencao"
            ? "border-yellow-500/50 bg-yellow-500/5"
            : "border-emerald-500/50 bg-emerald-500/5"
        }`}
      >
        <div className="flex items-start justify-between flex-wrap gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              {isBelow ? (
                <TrendDown size={18} weight="duotone" className="text-destructive" />
              ) : (
                <TrendUp size={18} weight="duotone" className="text-emerald-400" />
              )}
              <Label className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">
                Seu GAP de Eficiência
              </Label>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-display font-black text-5xl lg:text-7xl tracking-tight">
                {formatNum(result.gap_eficiencia, 2)}
              </span>
              <span className="text-2xl text-muted-foreground font-mono-num">pts</span>
            </div>
            <p className="text-sm text-muted-foreground mt-3 max-w-md">
              {isBelow ? (
                <>Sua performance atual está <span className="text-destructive font-bold">{formatNum(result.gap_eficiencia, 2)}</span> pontos <span className="text-destructive font-bold">abaixo</span> do benchmark.</>
              ) : (
                <>Sua performance atual está <span className="text-emerald-400 font-bold">{formatNum(result.gap_eficiencia, 2)}</span> pontos <span className="text-emerald-400 font-bold">acima</span> do benchmark.</>
              )}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Sparkle size={18} weight="duotone" className="text-primary" />
            <div className="text-xs uppercase tracking-[0.2em] font-bold">
              {result.nivel_desperdicio === "critico" ? (
                <span className="text-destructive">Nível: Crítico</span>
              ) : result.nivel_desperdicio === "atencao" ? (
                <span className="text-yellow-400">Nível: Atenção</span>
              ) : (
                <span className="text-emerald-400">Nível: OK</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground text-right max-w-[240px]">
              {result.nivel_desperdicio === "critico" && "GAP > 20 — alto potencial de ganho"}
              {result.nivel_desperdicio === "atencao" && "GAP entre 5 e 20 — há espaço para melhoria"}
              {result.nivel_desperdicio === "ok" && "GAP ≤ 5 — operação saudável"}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/40 grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">Benchmark</div>
            <div className="font-mono-num font-bold text-xl mt-1">{formatNum(result.valor_referencia, 2)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">Performance Atual</div>
            <div className="font-mono-num font-bold text-xl mt-1">{formatNum(result.performance_atual, 2)}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
