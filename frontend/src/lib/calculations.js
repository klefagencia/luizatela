// Universal algorithm aligned with Luiz's "Ajustes 5" doc:
// PMM (Perda Monetária Mensal) = VMP × GAP × FPM
//   - VMP = Valor Monetário Perdido por unidade da variável de interesse
//   - GAP = |Benchmark - Performance Atual| (raw — divided by 100 if unit is %)
//   - FPM = Fator de Ponderação Médio = AVG(denominator of selected months)
// Performance Atual = AVG of computed ratios (display units depending on unit being %)

export const EFFICIENCY_TYPES = [
  { id: "CUSTO", label: "Custo", desc: "fazer mais barato", color: "neutral", hex: "hsl(0, 0%, 70%)" },
  { id: "PRODUTIVIDADE", label: "Produtividade", desc: "render mais", color: "blue", hex: "hsl(217.2, 91.2%, 59.8%)" },
  { id: "QUALIDADE", label: "Qualidade", desc: "entregar produto melhor", color: "red", hex: "hsl(0, 84.2%, 60.2%)" },
  { id: "TEMPO_CICLO", label: "Tempo de Ciclo", desc: "fazer mais rápido", color: "emerald", hex: "hsl(150, 70%, 40%)" },
];

export const LEAN_WASTES = [
  { id: "DEFEITO", label: "Defeito", desc: "Produtos/serviços fora da especificação", example: "Ex: refugo, retrabalho, devolução" },
  { id: "SUPERPRODUCAO", label: "Superprodução", desc: "Produzir mais ou antes do necessário", example: "Ex: lote grande que fica parado" },
  { id: "ESPERA", label: "Espera", desc: "Tempo ocioso de pessoas, máquinas ou material", example: "Ex: máquina parada não programada / veículo parado" },
  { id: "RECURSOS", label: "Recursos", desc: "Uso ineficiente de matéria-prima, energia, mão-de-obra", example: "Ex: sobra de insumo, horas extras" },
  { id: "TRANSPORTE", label: "Transporte", desc: "Movimentação desnecessária de produtos/material", example: "Ex: perda na entrega do produto" },
  { id: "ESTOQUE", label: "Estoque", desc: "Inventário em excesso (MP, WIP, acabado)", example: "Ex: produto devolvido / desconto por fora especificação" },
  { id: "MOVIMENTACAO", label: "Movimentação", desc: "Deslocamentos desnecessários de pessoas", example: "Ex: operador caminhando até almoxarifado" },
  { id: "SUPERPROCESSAMENTO", label: "Superprocessamento", desc: "Trabalho além do necessário pelo cliente", example: "Ex: inspeção duplicada, polimento extra" },
];

export function isPercentUnit(u) {
  if (!u) return false;
  return /^%$|porc|percen/i.test(String(u));
}

export function average(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + Number(b || 0), 0) / arr.length;
}

export function getSelectedPoints(historical) {
  const included = (historical || []).filter((p) => p.included !== false);
  return included.length > 0 ? included : (historical || []);
}

// Ratio in display units (× 100 if unit is %)
export function ratioDisplay(num, den, unitIsPercent) {
  const n = Number(num || 0);
  const d = Number(den || 0);
  if (d === 0) return 0;
  const r = n / d;
  return unitIsPercent ? r * 100 : r;
}

export function computePerformanceAtual(historical, override, unitIsPercent) {
  if (override !== null && override !== undefined && override !== "") return Number(override);
  const pts = getSelectedPoints(historical);
  const vals = pts.map((p) => ratioDisplay(p.numerator, p.denominator, unitIsPercent));
  return average(vals);
}

// Fator de Ponderação Médio (FPM) = average of denominators in selected period
export function computeFPM(historical) {
  const pts = getSelectedPoints(historical);
  if (pts.length === 0) return 0;
  return pts.reduce((s, p) => s + Number(p.denominator || 0), 0) / pts.length;
}

export function computeGap(benchmark, performance) {
  return Math.abs(Number(benchmark || 0) - Number(performance || 0));
}

export function computeAll({
  historical = [],
  performanceAtualOverride = null,
  valorReferencia = 0,
  unidadeMedida = "",
  vmp = 0,
  lossItems = [],
  metaReducaoPct = 0,
}) {
  const unitIsPercent = isPercentUnit(unidadeMedida);
  const perf = computePerformanceAtual(historical, performanceAtualOverride, unitIsPercent);
  const ref = Number(valorReferencia || 0);
  const gap = computeGap(ref, perf); // in display units
  const gapNormalized = unitIsPercent ? gap / 100 : gap; // for math
  const gapDirection = ref >= perf ? "below_ref" : "above_ref";
  const fpm = computeFPM(historical);

  // PMM = VMP × GAP × FPM (universal)
  const vmpVal = Number(vmp || 0);
  const pmm = vmpVal * gapNormalized * fpm;
  const pmmAnual = pmm * 12;

  // Loss items with frequency
  const items = lossItems.map((it) => {
    const unit = Number(it.unit_cost || 0);
    const oc = Number(it.ocorrencia_mensal || 0);
    const custoMensal = unit * oc;
    return {
      ...it,
      custo_mensal: custoMensal,
      custo_anual: custoMensal * 12,
    };
  });

  const somaPerdas = items.reduce((s, i) => s + i.custo_mensal, 0);
  const impactoMensal = somaPerdas;
  const impactoAnual = impactoMensal * 12;

  // Valor recuperável: meta% × Perda Anual (PMM × 12)
  const metaPct = Math.max(0, Math.min(100, Number(metaReducaoPct || 0)));
  const valorRecuperavelAnual = (metaPct / 100) * pmmAnual;
  const valorRecuperavelMensal = valorRecuperavelAnual / 12;

  const perdasPorCategoria = LEAN_WASTES.reduce((acc, w) => {
    acc[w.id] = items
      .filter((i) => i.category === w.id)
      .reduce((s, i) => s + i.custo_anual, 0);
    return acc;
  }, {});
  perdasPorCategoria["_SEM_CATEGORIA"] = items
    .filter((i) => !i.category)
    .reduce((s, i) => s + i.custo_anual, 0);

  let nivel = "ok";
  if (unitIsPercent && gap > 20) nivel = "critico";
  else if (unitIsPercent && gap > 5) nivel = "atencao";
  else if (!unitIsPercent && gap > 0) nivel = pmm > 0 ? "atencao" : "ok"; // raw units: any gap is attention

  return {
    unit_is_percent: unitIsPercent,
    performance_atual: perf,
    valor_referencia: ref,
    gap_eficiencia: gap,
    gap_direction: gapDirection,
    fpm,
    fator_ponderacao_atual: fpm, // backward compat
    vmp: vmpVal,
    pmm,
    pmm_anual: pmmAnual,
    perda_financeira_mensal: pmm, // backward compat alias
    perda_financeira_anual: pmmAnual,
    soma_perdas: somaPerdas,
    items,
    impacto_mensal: impactoMensal,
    impacto_anual: impactoAnual,
    meta_reducao_pct: metaPct,
    valor_recuperavel_mensal: valorRecuperavelMensal,
    valor_recuperavel_anual: valorRecuperavelAnual,
    perdas_por_categoria: perdasPorCategoria,
    nivel_desperdicio: nivel,
  };
}

// Backward compat helper
export function pctOf(num, den) {
  return ratioDisplay(num, den, true);
}

export function formatBRL(n) {
  if (!isFinite(n)) n = 0;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);
}
export function formatBRLDecimal(n) {
  if (!isFinite(n)) n = 0;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(n);
}
export function formatNum(n, digits = 2) {
  if (!isFinite(n)) n = 0;
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}
export function formatPct(n, digits = 2) {
  if (!isFinite(n)) n = 0;
  return `${formatNum(n, digits)}%`;
}
// Format value with proper unit suffix
export function formatWithUnit(n, unit, digits = 2) {
  if (!isFinite(n)) n = 0;
  if (isPercentUnit(unit)) return `${formatNum(n, digits)}%`;
  return `${formatNum(n, digits)}${unit ? " " + unit : ""}`;
}
