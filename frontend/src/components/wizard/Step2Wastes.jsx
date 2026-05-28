import React from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { Target, Sparkle, TrendUp, TrendDown, Coins, Warning } from "@phosphor-icons/react";
import { useCalculator } from "@/contexts/CalculatorContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { formatNum, formatBRL, formatBRLDecimal } from "@/lib/calculations";

export default function Step2Benchmark() {
  const {
    valorReferencia, setValorReferencia,
    indicatorName, denominatorName,
    result,
  } = useCalculator();

  const isBelow = result.gap_direction === "below_ref";
  const temPerdaFinanceira = result.perda_financeira_mensal > 0 && result.avg_denominator > 0;

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
          Pesquise e descubra qual é o <span className="text-foreground font-semibold">valor de referência da sua performance ideal</span> — pode ser uma meta interna, um competidor ou um padrão de mercado. O <span className="text-foreground font-semibold">GAP de Eficiência</span> e a <span className="text-foreground font-semibold">Perda Financeira estimada</span> aparecem automaticamente.
        </p>
      </div>

      {/* Benchmark input */}
      <div className="bg-card border border-primary/40 rounded-2xl p-8 lg:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(closest-side, hsla(217.2, 91.2%, 59.8%, 0.12), transparent 70%)" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Target size={20} weight="duotone" className="text-primary" />
            <Label className="text-[10px] uppercase tracking-[0.25em] font-bold text-primary">
              Valor de referência (Benchmark) — em %
            </Label>
          </div>
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
            <span>0%</span><span>100%</span><span>200%</span>
          </div>
        </div>
      </div>

      {/* GAP card */}
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
        <div className="flex flex-col">
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

        <div className="mt-8 pt-6 border-t border-border/40 grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">Benchmark</div>
            <div className="font-mono-num font-bold text-xl mt-1">{formatNum(result.valor_referencia, 2)}%</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">Performance Atual</div>
            <div className="font-mono-num font-bold text-xl mt-1">{formatNum(result.performance_atual, 2)}%</div>
          </div>
        </div>
      </div>

      {/* Perda Financeira Estimada — top-down based on GAP × denominator */}
      <div
        data-testid="perda-financeira-card"
        className="rounded-2xl border-2 border-destructive/40 bg-gradient-to-br from-destructive/10 via-card to-card p-8 lg:p-10 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(closest-side, hsla(0, 84.2%, 60.2%, 0.18), transparent 70%)" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Coins size={20} weight="duotone" className="text-destructive" />
            <Label className="text-[10px] uppercase tracking-[0.25em] font-bold text-destructive">
              Perda Financeira Estimada
            </Label>
          </div>

          {!temPerdaFinanceira ? (
            <div className="flex items-start gap-3 bg-muted/40 border border-border rounded-lg p-4">
              <Warning size={18} weight="duotone" className="text-yellow-400 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Preencha os valores de <span className="text-foreground font-semibold">{denominatorName || "denominador"}</span> na Etapa 01 para que a calculadora estime sua perda financeira mensal.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="font-display font-black text-5xl lg:text-7xl tracking-tight text-destructive font-mono-num">
                  <CountUp end={result.perda_financeira_mensal} duration={2.4} separator="." decimal="," prefix="R$ " decimals={2} preserveValue />
                </span>
                <span className="text-2xl text-muted-foreground font-mono-num tracking-widest">/ MÊS</span>
              </div>
              <p className="text-sm text-muted-foreground mt-4 max-w-2xl leading-relaxed">
                Aplicando o GAP de <span className="text-foreground font-bold font-mono-num">{formatNum(result.gap_eficiencia, 2)} pts</span> sobre a média mensal de <span className="text-foreground font-semibold">{denominatorName || "denominador"}</span> (<span className="text-foreground font-bold font-mono-num">{formatBRLDecimal(result.avg_denominator)}</span>) — esse já é o impacto direto do seu indicador, independente da identificação detalhada das perdas.
              </p>

              <div className="mt-6 pt-5 border-t border-border/40 grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">Mensal</div>
                  <div className="font-mono-num font-bold text-base mt-1 text-destructive">{formatBRLDecimal(result.perda_financeira_mensal)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">Anual</div>
                  <div className="font-mono-num font-bold text-base mt-1 text-destructive">{formatBRL(result.perda_financeira_anual)}</div>
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">Fórmula</div>
                  <div className="font-mono-num text-xs mt-1 text-foreground">(GAP ÷ 100) × {denominatorName || "Den."} médio</div>
                </div>
              </div>
            </>
          )}
        </div>
        <Sparkle size={20} weight="duotone" className="text-destructive/40 absolute top-6 right-6" />
      </div>
    </motion.div>
  );
}
