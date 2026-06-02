// Calculation logic — aligned with Luiz Barbosa's full meeting roadmap.
// Page 1: Variável de interesse (numerator) + Fator de ponderação (denominator)
//         Performance Atual = AVG(% of selected points)
// Page 2: GAP = |Benchmark - PerfAtual|
//         Perda Financeira = (GAP/100) × Fator de Ponderação do ÚLTIMO mês selecionado
// Page 3: Loss items {unit_cost × ocorrencia_mensal} → custo mensal
//         Σ Perdas = Σ custo mensal
// Page 4: Impacto = Σ Perdas
//         Valor Recuperável = (meta_reducao_pct / 100) × Perda Financeira (mensal e anual)

export const EFFICIENCY_TYPES = [
  { id: "CUSTO", label: "Custo", desc: "fazer mais barato", icon: "Coins" },
  { id: "PRODUTIVIDADE", label: "Produtividade", desc: "render mais", icon: "TrendUp" },
  { id: "QUALIDADE", label: "Qualidade", desc: "entregar produto melhor", icon: "Sparkle" },
  { id: "TEMPO_CICLO", label: "Tempo de Ciclo", desc: "fazer mais rápido", icon: "Timer" },
];

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

// Returns the denominator of the LAST included point (Luiz's spec: "último mês apontado")
export function lastDenominator(historical) {
  const pts = getSelectedPoints(historical);
  if (pts.length === 0) return 0;
  return Number(pts[pts.length - 1].denominator || 0);
}

export function computeGap(benchmark, performance) {
  return Math.abs(Number(benchmark || 0) - Number(performance || 0));
}

export function computeAll({
  historical = [],
  performanceAtualOverride = null,
  valorReferencia = 0,
  lossItems = [],
  metaReducaoPct = 0,
}) {
  const perf = computePerformanceAtual(historical, performanceAtualOverride);
  const ref = Number(valorReferencia || 0);
  const gap = computeGap(ref, perf);
  const gapDirection = ref >= perf ? "below_ref" : "above_ref";
  const fatorPonderacaoAtual = lastDenominator(historical);

  // Perda Financeira based on LAST month's denominator
  const perdaFinanceiraMensal = (gap / 100) * fatorPonderacaoAtual;
  const perdaFinanceiraAnual = perdaFinanceiraMensal * 12;

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

  // Valor recuperável: meta% × Perda Financeira do GAP
  const metaPct = Math.max(0, Math.min(100, Number(metaReducaoPct || 0)));
  const valorRecuperavelMensal = (metaPct / 100) * perdaFinanceiraMensal;
  const valorRecuperavelAnual = valorRecuperavelMensal * 12;

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
    fator_ponderacao_atual: fatorPonderacaoAtual,
    perda_financeira_mensal: perdaFinanceiraMensal,
    perda_financeira_anual: perdaFinanceiraAnual,
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
