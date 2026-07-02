import React from "react";
import { motion } from "framer-motion";
import {
  Plus, Trash, ChartLineUp, Sparkle, Check, Tag, Coins, TrendUp, Star, Timer, Ruler, Info,
} from "@phosphor-icons/react";
import { useCalculator } from "@/contexts/CalculatorContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ResponsiveContainer, LineChart, Line, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { formatNum, ratioDisplay, isPercentUnit, EFFICIENCY_TYPES } from "@/lib/calculations";
import { cn } from "@/lib/utils";

const TYPE_ICONS = { CUSTO: Coins, PRODUTIVIDADE: TrendUp, QUALIDADE: Star, TEMPO_CICLO: Timer };

export default function Step1Historical() {
  const {
    efficiencyType, setEfficiencyType,
    indicatorName, setIndicatorName,
    denominatorName, setDenominatorName,
    unidadeMedida, setUnidadeMedida,
    historical, setHistorical,
    performanceAtualOverride, setPerformanceAtualOverride,
    result,
  } = useCalculator();

  const updateNumerator = (idx, v) => {
    const next = [...historical];
    next[idx] = { ...next[idx], numerator: Number(v) };
    setHistorical(next);
  };
  const updateDenominator = (idx, v) => {
    const next = [...historical];
    next[idx] = { ...next[idx], denominator: Number(v) };
    setHistorical(next);
  };
  const updateLabel = (idx, label) => {
    const next = [...historical];
    next[idx] = { ...next[idx], label };
    setHistorical(next);
  };
  const toggleIncluded = (idx) => {
    const next = [...historical];
    next[idx] = { ...next[idx], included: next[idx].included === false ? true : false };
    setHistorical(next);
  };
  const selectAll = (value) => {
    setHistorical(historical.map((p) => ({ ...p, included: value })));
  };
  const addPoint = () => {
    setHistorical([
      ...historical,
      { label: `Mês ${historical.length + 1}`, numerator: 0, denominator: 0, included: true },
    ]);
  };
  const removePoint = (idx) => {
    setHistorical(historical.filter((_, i) => i !== idx));
  };

  const isCustoOnly = efficiencyType === "CUSTO";
  const unitIsPct = isPercentUnit(unidadeMedida);

  const chartData = historical.map((p) => ({
    label: p.label,
    Eficiencia: ratioDisplay(p.numerator, p.denominator, unitIsPct),
    Performance: result.performance_atual,
    included: p.included !== false,
  }));

  const includedCount = historical.filter((p) => p.included !== false).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-primary font-bold mb-2">Etapa 01 · Avaliação Histórica</div>
        <h2 className="font-display font-black text-3xl lg:text-4xl tracking-tight">Defina seu indicador e o histórico</h2>
        <p className="text-muted-foreground mt-3 max-w-3xl text-sm leading-relaxed">
          Comece escolhendo o <span className="text-foreground font-semibold">tipo de eficiência</span>, dê nomes às variáveis e preencha mês a mês. A calculadora computa o percentual <span className="font-mono-num text-foreground">variável ÷ fator de ponderação × 100</span> e a sua <span className="text-foreground font-semibold">Performance Atual</span>.
        </p>
      </div>

      {/* PRE-Q · Efficiency type selector */}
      <div className="bg-card border border-border rounded-xl p-5 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkle size={18} weight="duotone" className="text-primary" />
            <Label className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">
              Qual tipo de eficiência será avaliado?
            </Label>
          </div>
          {!isCustoOnly && (
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-2.5 py-1">
              Modo Custo (preview)
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {EFFICIENCY_TYPES.map((t) => {
            const Icon = TYPE_ICONS[t.id] || Sparkle;
            const active = efficiencyType === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setEfficiencyType(t.id)}
                data-testid={`eff-type-${t.id.toLowerCase()}`}
                className={cn(
                  "group text-left relative p-4 rounded-lg border transition-all",
                  active
                    ? "bg-primary/10 border-primary"
                    : "bg-muted/30 border-border hover:border-primary/40"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <Icon size={22} weight="duotone" className={cn(active ? "text-primary" : "text-muted-foreground")} />
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center",
                      active ? "bg-primary border-primary" : "border-border"
                    )}
                  >
                    {active && <Check size={12} weight="bold" className="text-primary-foreground" />}
                  </div>
                </div>
                <h4 className="font-display font-bold text-sm">{t.label}</h4>
                <p className="text-[11px] text-muted-foreground italic mt-0.5">"{t.desc}"</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Q1, Q2, Q3 â Variável de interesse + Fator de ponderação + Unidade */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Tag size={16} weight="duotone" className="text-primary" />
            <Label className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">
              Variável de interesse
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground transition-colors ml-1"><Info size={14} weight="duotone" /></button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm text-left">
                  <p className="text-xs leading-relaxed">É o número que representa o processo que você quer analisar. Pode estar associado a um determinado custo (variável, fixo, etc), ou volume produzido (peça, tarefa, fluxo, etc), ou uma característica de qualidade a ser melhorada (resistência, refugo, peças de máquina, etc), ou um tempo de execução de determinada atividade que precisa ser reduzido (preparo, carregamento, expedição, etc).</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            data-testid="input-indicator-name"
            value={indicatorName}
            onChange={(e) => setIndicatorName(e.target.value)}
            placeholder="Ex: Custo variável, Refugo, Horas paradas..."
            className="bg-muted border-border h-12 text-base"
          />
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Tag size={16} weight="duotone" className="text-primary" />
            <Label className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">
              Fator de ponderação
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground transition-colors ml-1"><Info size={14} weight="duotone" /></button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm text-left">
                  <p className="text-xs leading-relaxed">Caso sua variável de interesse seja ponderável, informe qual é o denominador da equação e preencha as duas colunas com os dados dos meses. Exemplos: (1) Custo variável (R$) por Faturamento (R$) — neste caso o faturamento é o fator de ponderação e o custo variável é a variável de interesse. (2) Volume produzido (unidade, kg, tonelada, m, m2, etc) por Mês — neste caso o mês é o fator de ponderação. O volume precisa ser mensalizado. (3) Paradas de máquina (horas, nº paradas, etc) por Mês — neste caso o mês é o fator de ponderação e o número de paradas precisa ser mensalizado. (4) Tempo de carregamento (horas, minutos, segundos) por Mês — o tempo de carregamento é a variável de interesse e o tempo precisa representar valor médio do mês. Caso sua variável NÃO seja ponderável, a coluna de dados deve ser preenchida com valores mensalizados e o fator de ponderação deve ser preenchido com o número 1.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            data-testid="input-denominator-name"
            value={denominatorName}
            onChange={(e) => setDenominatorName(e.target.value)}
            placeholder="Ex: Faturamento, Produção total, Horas planejadas..."
            className="bg-muted border-border h-12 text-base"
          />
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Ruler size={16} weight="duotone" className="text-primary" />
            <Label className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">
              Unidade de medida
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground transition-colors ml-1"><Info size={14} weight="duotone" /></button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm text-left">
                  <p className="text-xs leading-relaxed">Caso sua variável de interesse seja ponderável, a unidade de medida deverá ser preenchida com "%". Caso contrário, preencha com a unidade de medida da sua variável de interesse (ex: R$, peças, horas, kg, ton).</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            data-testid="input-unit-name"
            value={unidadeMedida}
            onChange={(e) => setUnidadeMedida(e.target.value)}
            placeholder="Ex: R$, horas, un..."
            className="bg-muted border-border h-12 text-base"
          />
        </div>
      </div>

      {/* Performance Atual */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-primary/40 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Label className="text-[10px] uppercase tracking-[0.25em] font-bold text-primary">Performance Atual</Label>
              <div className="font-mono-num font-bold text-4xl mt-2 text-foreground">
                {formatNum(result.performance_atual, 2)}<span className="text-2xl text-muted-foreground ml-1">{unitIsPct ? '%' : (unidadeMedida || '')}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {performanceAtualOverride !== null && performanceAtualOverride !== ""
                  ? "Valor manual"
                  : `Média dos ${includedCount} ponto(s) selecionado(s)`}
              </p>
            </div>
            <Sparkle size={20} weight="duotone" className="text-primary" />
          </div>
          <Input
            data-testid="input-perf-override"
            type="number"
            step="0.01"
            placeholder="Sobrescrever manualmente (opcional)"
            value={performanceAtualOverride ?? ""}
            onChange={(e) => setPerformanceAtualOverride(e.target.value === "" ? null : e.target.value)}
            className="bg-muted border-border h-11 font-mono-num"
          />
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <Label className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">Q5 · Exclusão de pontos atípicos</Label>
          <p className="text-sm text-foreground mt-2 leading-relaxed">
            Quando há uma <span className="font-semibold">mudança de patamar</span> ou um <span className="font-semibold">ponto atípico</span>, desmarque a caixa na tabela para excluí-lo do cálculo da Performance Atual.
          </p>
          <div className="flex gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => selectAll(true)}
              data-testid="select-all-historical"
              className="h-8 border-border"
            >
              <Check size={14} weight="bold" /> Selecionar todos
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => selectAll(false)}
              data-testid="deselect-all-historical"
              className="h-8 border-border"
            >
              Limpar seleção
            </Button>
          </div>
        </div>
      </div>

      {/* Editable historical table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">Q4 · Histórico mês a mês</span>
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
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground bg-muted/40 sticky top-0 backdrop-blur">
              <tr>
                <th className="w-14 text-center font-bold p-3">Usar</th>
                <th className="text-left font-bold p-3 w-28">Período</th>
                <th className="text-right font-bold p-3">
                  {indicatorName || "Variável"}
                </th>
                <th className="text-right font-bold p-3">
                  {denominatorName || "Fator"}
                </th>
                <th className="text-right font-bold p-3 w-24 text-primary">{unitIsPct ? '%' : (unidadeMedida || 'Valor')}</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {historical.map((p, i) => {
                const included = p.included !== false;
                const pct = ratioDisplay(p.numerator, p.denominator, unitIsPct);
                return (
                  <tr key={i} className={`border-t border-border/40 hover:bg-muted/20 ${!included ? "opacity-50" : ""}`}>
                    <td className="p-2 text-center">
                      <Checkbox
                        data-testid={`historical-check-${i}`}
                        checked={included}
                        onCheckedChange={() => toggleIncluded(i)}
                        className="mx-auto"
                      />
                    </td>
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
                        data-testid={`historical-num-${i}`}
                        type="number"
                        step="0.01"
                        value={p.numerator}
                        onChange={(e) => updateNumerator(i, e.target.value)}
                        className="bg-transparent border-transparent hover:border-border h-9 text-right font-mono-num text-sm"
                      />
                    </td>
                    <td className="p-2 text-right">
                      <Input
                        data-testid={`historical-den-${i}`}
                        type="number"
                        step="0.01"
                        value={p.denominator}
                        onChange={(e) => updateDenominator(i, e.target.value)}
                        className="bg-transparent border-transparent hover:border-border h-9 text-right font-mono-num text-sm"
                      />
                    </td>
                    <td className="p-2 text-right font-mono-num text-sm text-primary">
                      {unitIsPct ? `${pct.toFixed(2)}%` : pct.toFixed(2)}
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart preview · após entrada de dados */}
      <div className="bg-card border border-border rounded-xl p-5 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ChartLineUp size={18} weight="duotone" className="text-primary" />
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">
              Série · {indicatorName || "Variável"} ÷ {denominatorName || "Fator"} ({unidadeMedida || "â"})
            </span>
          </div>
          <div className="text-xs font-mono-num text-muted-foreground">
            {includedCount}/{historical.length} pontos
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
              <CartesianGrid stroke="hsl(217.2, 32.6%, 17.5%)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="label" stroke="hsl(215, 20.2%, 55%)" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                stroke="hsl(215, 20.2%, 55%)"
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                domain={[(dataMin) => Math.max(0, Math.floor((dataMin ?? 0) * 0.9)), (dataMax) => Math.ceil((dataMax ?? 0) * 1.1)]}
                tickFormatter={(v) => unitIsPct ? `${v.toFixed(0)}%` : `${v.toFixed(1)}${unidadeMedida ? ' ' + unidadeMedida : ''}`}
                allowDecimals
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(222.2, 47%, 7%)",
                  border: "1px solid hsl(217.2, 32.6%, 25%)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "hsl(210, 40%, 98%)" }}
                formatter={(v) => unitIsPct ? `${Number(v).toFixed(2)}%` : `${Number(v).toFixed(2)} ${unidadeMedida || ''}`.trim()}
              />
              <Line type="linear" dataKey="Performance" stroke="hsl(150, 70%, 40%)" strokeWidth={1.5} strokeDasharray="6 4" dot={false} />
              <Line
                type="linear"
                dataKey="Eficiencia"
                stroke="hsl(217.2, 91.2%, 59.8%)"
                strokeWidth={2.5}
                dot={(dotProps) => {
                  const { cx, cy, payload, index } = dotProps;
                  const isIncluded = payload.included;
                  return (
                    <circle
                      key={index}
                      cx={cx}
                      cy={cy}
                      r={isIncluded ? 4 : 3}
                      fill={isIncluded ? "hsl(217.2, 91.2%, 59.8%)" : "hsl(222.2, 47%, 9%)"}
                      stroke="hsl(217.2, 91.2%, 59.8%)"
                      strokeWidth={1.5}
                    />
                  );
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary"></span> Pontos selecionados
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-primary bg-card"></span> Excluídos (atípicos)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-[2px] bg-emerald-500"></span> Performance Atual (média)
          </span>
        </div>
      </div>
    </motion.div>
  );
}
