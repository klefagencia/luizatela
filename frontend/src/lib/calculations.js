// Updated logic per Luiz's meeting (2026-05):
// - Historical points now have numerator + denominator → percentage computed
// - Performance Atual = AVG(computed % of selected points)
// - GAP bidirectional: |Benchmark - PerfAtual|
// - Step 2 "Perda Financeira Estimada" = (GAP/100) × AVG(denominator of selected points)
// - Loss items now have ocorrencia_mensal → custo_mensal_item = unit_cost × ocorrencia
// - Σ Perdas = Σ custo_mensal_item
// - Step 4 Impacto Mensal = Σ Perdas (direct), Anual = × 12

export const LEAN_WASTES = [
  { id: "DEFEITO", label: "Defeito", desc: "Produtos/serviços fora da especificação", example: "Ex: refugo, retrabalho, devolução" },
  { id: "SUPERPRODUCAO", label: "Superprodução", desc: "Produzir mais ou antes do necessário", example: "Ex: lote grande que fica parado" },
  { id: "ESPERA", label: "Espera", desc: "Tempo ocioso de pessoas, máquinas ou material", example: "Ex: veículo parado / máquina aguardando MP" },
  { id: "RECURSOS", label: "Recursos", desc: "Uso ineficiente de matéria-prima, energia, mão-de-obra", example: "Ex: sobra de insumo, horas extras" },
  { id: "TRANSPORTE", label: "Transporte", desc: "Movimentação desnecessária de produtos/material", example: "Ex: perda na entrega do produto" },
  { id: "ESTOQUE", label: "Estoque", desc: "Inventário em excesso (MP, WIP, acabado)", example: "Ex: perda ao guardar material" },
  { id: "MOVIMENTACAO", label: "Movimentação", desc: "Deslocamentos desnecessários de pessoas", example: "Ex: operador caminhando até almoxarifado" },
  { id: "SUPERPROCESSAMENTO", label: "Superprocessamento", desc: "Trabalho além do necessário pelo cliente", example: "Ex: inspeção duplicada, polimento extra" },
];

export const INDICATOR_EXAMPLES = [
  "Custo variável (R$) / Faturamento (R$)",
  "Refugo (un) / Produção total (un)",
  "Horas paradas / Horas planejadas",
  "Defeitos / Produzido",
];

export function average(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + Number(b || 0), 0) / arr.length;
}

export function pctOf(num, den) {
  const n = Number(num || 0);
  const d = Number(den || 0);
  if (d === 0) return 0;
  return (n / d) * 100;
}

export function getSelectedPoints(historical) {
  const included = (historical || []).filter((p) => p.included !== false);
  return included.length > 0 ? included : (historical || []);
}

export function computePerformanceAtual(historical, override) {
  if (override !== null && override !== undefined && override !== "") return Number(override);
  const pts = getSelectedPoints(historical);
  const pcts = pts.map((p) => pctOf(p.numerator, p.denominator));
  return average(pcts);
}

export function computeAvgDenominator(historical) {
  const pts = getSelectedPoints(historical);
  const vals = pts.map((p) => Number(p.denominator || 0));
  return average(vals);
}

export function computeGap(benchmark, performance) {
  return Math.abs(Number(benchmark || 0) - Number(performance || 0));
}

export function computeAll({
  historical = [],
  performanceAtualOverride = null,
  valorReferencia = 0,
  lossItems = [],
}) {
  const perf = computePerformanceAtual(historical, performanceAtualOverride);
  const ref = Number(valorReferencia || 0);
  const gap = computeGap(ref, perf);
  const gapDirection = ref >= perf ? "below_ref" : "above_ref";
  const avgDen = computeAvgDenominator(historical);

  // Top-down perda estimada (Step 2) — applicable when denominator has financial meaning
  const perdaFinanceiraMensal = (gap / 100) * avgDen;
  const perdaFinanceiraAnual = perdaFinanceiraMensal * 12;

  // Items now carry ocorrencia → custo mensal direto
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

  // Step 4 Impacto: now equals soma das perdas (bottom-up itemizado)
  const impactoMensal = somaPerdas;
  const impactoAnual = impactoMensal * 12;

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
  if (gap > 20) nivel = "critico";
  else if (gap > 5) nivel = "atencao";

  return {
    performance_atual: perf,
    valor_referencia: ref,
    gap_eficiencia: gap,
    gap_direction: gapDirection,
    avg_denominator: avgDen,
    perda_financeira_mensal: perdaFinanceiraMensal,
    perda_financeira_anual: perdaFinanceiraAnual,
    soma_perdas: somaPerdas,
    items,
    impacto_mensal: impactoMensal,
    impacto_anual: impactoAnual,
    perdas_por_categoria: perdasPorCategoria,
    nivel_desperdicio: nivel,
  };
}

export function formatBRL(n) {
  if (!isFinite(n)) n = 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatBRLDecimal(n) {
  if (!isFinite(n)) n = 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatNum(n, digits = 2) {
  if (!isFinite(n)) n = 0;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

export function formatPct(n, digits = 2) {
  if (!isFinite(n)) n = 0;
  return `${formatNum(n, digits)}%`;
}
