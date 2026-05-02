// NEW formula aligned with Luiz's meeting notes:
// Performance Atual = AVG(historical points where included=true)
// GAP = |Benchmark - Performance Atual|  (bidirectional, always positive)
// Impacto Mensal = Volume × (GAP/100) × Σ(unit costs of identified losses)
// Impacto Anual  = Impacto Mensal × 12

export const LEAN_WASTES = [
  { id: "DEFEITO", label: "Defeito", desc: "Produtos/serviços fora da especificação", example: "Ex: refugo, retrabalho, devolução" },
  { id: "SUPERPRODUCAO", label: "Superprodução", desc: "Produzir mais ou antes do necessário", example: "Ex: lote grande que fica parado" },
  { id: "ESPERA", label: "Espera", desc: "Tempo ocioso de pessoas, máquinas ou material", example: "Ex: máquina parada aguardando MP" },
  { id: "RECURSOS", label: "Recursos", desc: "Uso ineficiente de matéria-prima, energia, mão-de-obra", example: "Ex: sobra de insumo, horas extras" },
  { id: "TRANSPORTE", label: "Transporte", desc: "Movimentação desnecessária de produtos/material", example: "Ex: perda na entrega do produto" },
  { id: "ESTOQUE", label: "Estoque", desc: "Inventário em excesso (MP, WIP, acabado)", example: "Ex: perda ao guardar material" },
  { id: "MOVIMENTACAO", label: "Movimentação", desc: "Deslocamentos desnecessários de pessoas", example: "Ex: operador caminhando até almoxarifado" },
  { id: "SUPERPROCESSAMENTO", label: "Superprocessamento", desc: "Trabalho além do necessário pelo cliente", example: "Ex: inspeção duplicada, polimento extra" },
];

export function average(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + Number(b || 0), 0) / arr.length;
}

export function computePerformanceAtual(historical, override) {
  if (override !== null && override !== undefined && override !== "") return Number(override);
  const included = (historical || []).filter((p) => p.included !== false);
  const source = included.length > 0 ? included : (historical || []);
  const vals = source.map((p) => Number(p.value || 0));
  return average(vals);
}

export function computeGap(benchmark, performance) {
  // Bidirectional — always returns absolute difference
  return Math.abs(Number(benchmark || 0) - Number(performance || 0));
}

export function computeAll({
  historical = [],
  performanceAtualOverride = null,
  valorReferencia = 0,
  volumePeriodo = 0,
  lossItems = [],
}) {
  const perf = computePerformanceAtual(historical, performanceAtualOverride);
  const ref = Number(valorReferencia || 0);
  const gap = computeGap(ref, perf);
  const gapDirection = ref >= perf ? "below_ref" : "above_ref"; // are we below or above the benchmark?
  const volume = Number(volumePeriodo || 0);

  // Σ unit costs of all loss items (specific losses identified)
  const somaPerdas = lossItems.reduce((s, it) => s + Number(it.unit_cost || 0), 0);

  // Impact formula: Volume × (GAP/100) × Σ unit costs
  const impactoMensal = volume * (gap / 100) * somaPerdas;
  const impactoAnual = impactoMensal * 12;

  // Per-item contribution (proportional to its unit cost share)
  const items = lossItems.map((it) => {
    const unit = Number(it.unit_cost || 0);
    const share = somaPerdas > 0 ? unit / somaPerdas : 0;
    const impactoItemMensal = impactoMensal * share;
    const impactoItemAnual = impactoItemMensal * 12;
    return {
      ...it,
      impacto_mensal: impactoItemMensal,
      impacto_anual: impactoItemAnual,
    };
  });

  // Aggregate by Lean category
  const perdasPorCategoria = LEAN_WASTES.reduce((acc, w) => {
    acc[w.id] = items
      .filter((i) => i.category === w.id)
      .reduce((s, i) => s + i.impacto_anual, 0);
    return acc;
  }, {});
  perdasPorCategoria["_SEM_CATEGORIA"] = items
    .filter((i) => !i.category)
    .reduce((s, i) => s + i.impacto_anual, 0);

  // Waste level — based on GAP magnitude (as % points)
  let nivel = "ok";
  if (gap > 20) nivel = "critico";
  else if (gap > 5) nivel = "atencao";

  return {
    performance_atual: perf,
    valor_referencia: ref,
    gap_eficiencia: gap,
    gap_direction: gapDirection,
    volume_periodo: volume,
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
