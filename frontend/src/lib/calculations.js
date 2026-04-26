// Faithful to the original spreadsheet's Lean Manufacturing logic.
// Performance Atual = AVG(historical productivity %)
// GAP de Eficiência = Valor de Referência - Performance Atual
// Per cost item:
//   Perda Atual    = Volume × Custo Unitário × (1 - PerfAtual/100)
//   Perda Refer.   = Volume × Custo Unitário × (1 - Ref/100)
//   Perda Mensal   = Perda Atual - Perda Referência
//   Perda Anual    = Mensal × 12

export const LEAN_WASTES = [
  { id: "DEFEITO", label: "Defeito", desc: "Produtos/serviços fora da especificação" },
  { id: "SUPERPRODUCAO", label: "Superprodução", desc: "Produzir mais ou antes do necessário" },
  { id: "ESPERA", label: "Espera", desc: "Tempo ocioso de pessoas, máquinas ou material" },
  { id: "RECURSOS", label: "Recursos", desc: "Uso ineficiente de matéria-prima, energia, mão-de-obra" },
  { id: "TRANSPORTE", label: "Transporte", desc: "Movimentação desnecessária de produtos/material" },
  { id: "ESTOQUE", label: "Estoque", desc: "Inventário em excesso (matéria-prima, WIP, acabado)" },
  { id: "MOVIMENTACAO", label: "Movimentação", desc: "Deslocamentos desnecessários de pessoas" },
  { id: "SUPERPROCESSAMENTO", label: "Superprocessamento", desc: "Trabalho além do necessário pelo cliente" },
];

export function average(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + Number(b || 0), 0) / arr.length;
}

export function computePerformanceAtual(historical, override) {
  if (override !== null && override !== undefined && override !== "") return Number(override);
  const vals = (historical || []).map((p) => Number(p.value || 0));
  return average(vals);
}

export function computeAll({
  historical = [],
  performanceAtualOverride = null,
  valorReferencia = 0,
  volumePeriodo = 0,
  revenueMonthly = 0,
  costItems = [],
}) {
  const perf = computePerformanceAtual(historical, performanceAtualOverride);
  const ref = Number(valorReferencia || 0);
  const gap = ref - perf;
  const volume = Number(volumePeriodo || 0);

  const items = costItems.map((it) => {
    const unit = Number(it.unit_cost || 0);
    const perdaAtual = volume * unit * Math.max(0, 1 - perf / 100);
    const perdaRef = volume * unit * Math.max(0, 1 - ref / 100);
    const perdaMensal = Math.max(0, perdaAtual - perdaRef);
    const perdaAnual = perdaMensal * 12;
    return {
      ...it,
      perda_atual: perdaAtual,
      perda_referencia: perdaRef,
      perda_real_mensal: perdaMensal,
      perda_real_anual: perdaAnual,
    };
  });

  const totalAtual = items.reduce((s, i) => s + i.perda_atual, 0);
  const totalRef = items.reduce((s, i) => s + i.perda_referencia, 0);
  const totalMensal = Math.max(0, totalAtual - totalRef);
  const totalAnual = totalMensal * 12;

  const perdasPorCategoria = LEAN_WASTES.reduce((acc, w) => {
    acc[w.id] = items
      .filter((i) => i.category === w.id)
      .reduce((s, i) => s + i.perda_real_anual, 0);
    return acc;
  }, {});

  let pctFaturamento = null;
  if (revenueMonthly && revenueMonthly > 0) {
    pctFaturamento = (totalMensal / revenueMonthly) * 100;
  }

  let nivel = "ok";
  if (gap > 20) nivel = "critico";
  else if (gap > 5) nivel = "atencao";

  return {
    performance_atual: perf,
    valor_referencia: ref,
    gap_eficiencia: gap,
    volume_periodo: volume,
    items,
    total_perda_atual_mensal: totalAtual,
    total_perda_referencia_mensal: totalRef,
    total_perda_real_mensal: totalMensal,
    total_perda_real_anual: totalAnual,
    perdas_por_categoria: perdasPorCategoria,
    pct_faturamento: pctFaturamento,
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

export function formatPct(n, digits = 2) {
  if (!isFinite(n)) n = 0;
  return `${n.toFixed(digits).replace(".", ",")}%`;
}
