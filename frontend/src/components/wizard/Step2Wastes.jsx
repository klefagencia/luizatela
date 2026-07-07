import React from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { Target, Sparkle, TrendUp, TrendDown, Coins, Money, Warning } from "@phosphor-icons/react";
import { useCalculator } from "@/contexts/CalculatorContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { formatNum, formatBRL, formatBRLDecimal, isPercentUnit } from "@/lib/calculations";

export default function Step2Benchmark() {
  const {
    valorReferencia, setValorReferencia,
    vmp, setVmp,
    indicatorName, denominatorName, unidadeMedida,
    result,
  } = useCalculator();

  const isBelow = result.gap_direction === "below_ref";
  const unitIsPct = isPercentUnit(unidadeMedida);
  const unitDisplay = unitIsPct ? "%" : (unidadeMedida || "");
  const temPMM = result.pmm > 0 && result.fpm > 0;

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
          Pesquise e descubra qual é o <span className="text-foreground font-semibold">valor de referência da sua performance ideal</span> â pode ser uma meta interna, um competidor ou um padrão de mercado.
        </p>
      </div>

      {/* Q6 · Benchmark input â respects user's unit */}
      <div className="bg-card border border-primary/40 rounded-2xl p-8 lg:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(closest-side, hsla(217.2, 91.2%, 59.8%, 0.12), transparent 70%)" }} />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={20} weight="duotone" className="text-primary" />
              <Label className="text-[10px] uppercase tracking-[0.25em] font-bold text-primary">
                Q6 · Valor de referência (Benchmark)
              </Label>
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground bg-muted/60 border border-border rounded-full px-2.5 py-1">
              unidade: <span className="text-foreground font-mono-num">{unitDisplay || "â"}</span>
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <Input
              data-testid="input-benchmark"
              type="number"
              step="0.01"
              value={valorReferencia}
              onChange={(e) => setValorReferencia(Number(e.target.value || 0))}
              className="bg-muted border-border h-20 font-mono-num font-bold text-3xl sm:text-4xl lg:text-6xl text-center flex-1"
            />
            {unitDisplay && (
              <span className="font-mono-num text-2xl lg:text-3xl text-muted-foreground font-bold">{unitDisplay}</span>
            )}
          </div>
          <div className="slider-glow mt-5">
            <Slider
              data-testid="slider-benchmark"
              value={[Number(valorReferencia)]}
              min={0}
              max={unitIsPct ? 200 : Math.max(200, Number(valorReferencia) * 2)}
              step={unitIsPct ? 0.5 : 1}
              onValueChange={([v]) => setValorReferencia(v)}
            />
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
                      <span className="font-display font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight">
              {formatNum(result.gap_eficiencia, 2)}
            </span>
            <span className="text-2xl text-muted-foreground font-mono-num">{unitIsPct ? "pts" : unitDisplay}</span>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border/40 grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">Benchmark</div>
            <div className="font-mono-num font-bold text-xl mt-1">{formatNum(result.valor_referencia, 2)}{unitIsPct ? "%" : ` ${unitDisplay}`}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">Performance Atual</div>
            <div className="font-mono-num font-bold text-xl mt-1">{formatNum(result.performance_atual, 2)}{unitIsPct ? "%" : ` ${unitDisplay}`}</div>
          </div>
        </div>
      </div>

      {/* VMP input */}
      <div className="bg-card border border-border rounded-2xl p-6 lg:p-8">
        <div className="flex items-center gap-2 mb-3">
          <Money size={18} weight="duotone" className="text-primary" />
          <Label className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">
            VMP · Valor Monetário Perdido por unidade de <span className="text-foreground">{indicatorName || "variável"}</span>
          </Label>
        </div>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed max-w-3xl">
          Quanto você perde em <span className="text-foreground font-semibold">R$</span> para cada unidade da sua variável de interesse?
          <span className="block mt-1.5 text-xs italic">
            Ex: Custo (variável já em R$) â <span className="text-foreground font-mono-num">R$ 1,00</span> · Produtividade â <span className="text-foreground font-mono-num">R$ 50/ton</span> · Qualidade â <span className="text-foreground font-mono-num">R$ 280/ton</span> · Tempo de Ciclo â <span className="text-foreground font-mono-num">R$ 420/atendimento</span>
          </span>
        </p>
        <div className="flex items-baseline gap-3 max-w-md">
          <span className="text-muted-foreground font-mono-num text-2xl">R$</span>
          <Input
            data-testid="input-vmp"
            type="number"
            step="0.01"
            min="0"
            value={vmp}
            onChange={(e) => setVmp(Number(e.target.value || 0))}
            className="bg-muted border-border h-14 font-mono-num font-bold text-2xl flex-1"
          />
          <span className="text-muted-foreground text-xs uppercase tracking-widest">/ {unitIsPct ? "unidade da variável" : (unidadeMedida || "unidade")}</span>
        </div>
      </div>

      {/* PMM · Perda Monetária Mensal â top-down */}
      <div
        data-testid="pmm-card"
        className="rounded-2xl border-2 border-destructive/40 bg-gradient-to-br from-destructive/10 via-card to-card p-8 lg:p-10 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(closest-side, hsla(0, 84.2%, 60.2%, 0.18), transparent 70%)" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Coins size={20} weight="duotone" className="text-destructive" />
            <Label className="text-[10px] uppercase tracking-[0.25em] font-bold text-destructive">
              PMM
            </Label>
          </div>

          {!temPMM ? (
            <div className="flex items-start gap-3 bg-muted/40 border border-border rounded-lg p-4">
              <Warning size={18} weight="duotone" className="text-yellow-400 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Preencha os valores de <span className="text-foreground font-semibold">{denominatorName || "fator de ponderação"}</span> na Etapa 01 e informe o <span className="text-foreground font-semibold">VMP</span> acima para que a calculadora estime sua perda mensal.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-3 flex-wrap">
                        <span className="font-display font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight text-destructive font-mono-num">
                  <CountUp end={result.pmm} duration={2.4} separator="." decimal="," prefix="R$ " decimals={2} preserveValue />
                </span>
                <span className="text-2xl text-muted-foreground font-mono-num tracking-widest">/ MÊS</span>
              </div>
              <p className="text-sm text-muted-foreground mt-4 max-w-3xl leading-relaxed">
                <span className="font-mono-num text-foreground">PMM = VMP × GAP × FPM</span> = <span className="text-foreground font-bold font-mono-num">{formatBRLDecimal(result.vmp)}</span> × <span className="text-foreground font-bold font-mono-num">{formatNum(result.gap_eficiencia, 2)}{unitIsPct ? "%" : ` ${unitDisplay}`}</span> × <span className="text-foreground font-bold font-mono-num">{formatNum(result.fpm, 2)}</span>
              </p>
              <div className="mt-6 pt-5 border-t border-border/40 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">PMM</div>
                  <div className="font-mono-num font-bold text-base mt-1 text-destructive">{formatBRLDecimal(result.pmm)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">FPM (média)</div>
                  <div className="font-mono-num font-bold text-base mt-1">{formatNum(result.fpm, 2)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">VMP</div>
                  <div className="font-mono-num font-bold text-base mt-1">{formatBRLDecimal(result.vmp)}</div>
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
