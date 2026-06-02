import React, { createContext, useContext, useMemo, useState } from "react";
import { computeAll } from "@/lib/calculations";

const CalculatorContext = createContext(null);

const monthLabels = [
  "Jan/24", "Fev/24", "Mar/24", "Abr/24", "Mai/24", "Jun/24",
  "Jul/24", "Ago/24", "Set/24", "Out/24", "Nov/24", "Dez/24",
];

const sampleNumerators = [510000, 520000, 515000, 525000, 530000, 522000, 519000, 528000, 521000, 524000, 532000, 526000];
const sampleDenominators = [1000000, 1010000, 980000, 1030000, 1020000, 990000, 1015000, 1005000, 985000, 1025000, 1040000, 1010000];

const defaultHistorical = monthLabels.map((label, i) => ({
  label,
  numerator: sampleNumerators[i],
  denominator: sampleDenominators[i],
  included: true,
}));

export function CalculatorProvider({ children }) {
  const [step, setStep] = useState(0);

  // Pre-step 1 — efficiency type selector
  const [efficiencyType, setEfficiencyType] = useState("CUSTO");

  // Step 1
  const [indicatorName, setIndicatorName] = useState("Custo variável");
  const [denominatorName, setDenominatorName] = useState("Faturamento");
  const [unidadeMedida, setUnidadeMedida] = useState("R$");
  const [historical, setHistorical] = useState(defaultHistorical);
  const [performanceAtualOverride, setPerformanceAtualOverride] = useState(null);

  // Step 2
  const [valorReferencia, setValorReferencia] = useState(48);

  // Step 3
  const [lossItems, setLossItems] = useState([
    { id: crypto.randomUUID(), description: "Veículo parado (diária)", unit_cost: 1600, ocorrencia_mensal: 3, category: "ESPERA" },
    { id: crypto.randomUUID(), description: "Honorário equipe parada", unit_cost: 800, ocorrencia_mensal: 3, category: "ESPERA" },
    { id: crypto.randomUUID(), description: "Hotel + alimentação extra", unit_cost: 450, ocorrencia_mensal: 3, category: "RECURSOS" },
  ]);

  // Step 4 — Meta de redução (%)
  const [metaReducaoPct, setMetaReducaoPct] = useState(30);

  const result = useMemo(
    () =>
      computeAll({
        historical,
        performanceAtualOverride,
        valorReferencia,
        lossItems,
        metaReducaoPct,
      }),
    [historical, performanceAtualOverride, valorReferencia, lossItems, metaReducaoPct]
  );

  const value = {
    step, setStep,
    efficiencyType, setEfficiencyType,
    indicatorName, setIndicatorName,
    denominatorName, setDenominatorName,
    unidadeMedida, setUnidadeMedida,
    historical, setHistorical,
    performanceAtualOverride, setPerformanceAtualOverride,
    valorReferencia, setValorReferencia,
    lossItems, setLossItems,
    metaReducaoPct, setMetaReducaoPct,
    result,
  };

  return <CalculatorContext.Provider value={value}>{children}</CalculatorContext.Provider>;
}

export function useCalculator() {
  const ctx = useContext(CalculatorContext);
  if (!ctx) throw new Error("useCalculator must be used within CalculatorProvider");
  return ctx;
}
