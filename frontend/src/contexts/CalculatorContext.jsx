import React, { createContext, useContext, useMemo, useState } from "react";
import { computeAll } from "@/lib/calculations";

const CalculatorContext = createContext(null);

const monthLabels = [
  "Jan/24", "Fev/24", "Mar/24", "Abr/24", "Mai/24", "Jun/24",
  "Jul/24", "Ago/24", "Set/24", "Out/24", "Nov/24", "Dez/24",
];

const defaultHistorical = monthLabels.map((label, i) => ({
  label,
  // Sample sequence inspired by spreadsheet (productivity %) — user can override
  value: [21.31, 19.62, 18.83, 17.80, 16.91, 18.40, 18.69, 17.64, 16.07, 16.03, 22.56, 18.55][i],
}));

export function CalculatorProvider({ children }) {
  const [step, setStep] = useState(0);
  const [historical, setHistorical] = useState(defaultHistorical);
  const [performanceAtualOverride, setPerformanceAtualOverride] = useState(null);
  const [valorReferencia, setValorReferencia] = useState(85);
  const [volumePeriodo, setVolumePeriodo] = useState(7000);
  const [revenueMonthly, setRevenueMonthly] = useState(500000);
  const [selectedWastes, setSelectedWastes] = useState(["DEFEITO", "ESPERA", "RECURSOS"]);
  const [costItems, setCostItems] = useState([
    { id: crypto.randomUUID(), description: "Matéria-prima", unit_cost: 12.5, category: "DEFEITO" },
    { id: crypto.randomUUID(), description: "Mão-de-obra direta", unit_cost: 8.0, category: "ESPERA" },
    { id: crypto.randomUUID(), description: "Energia / utilidades", unit_cost: 3.2, category: "RECURSOS" },
  ]);

  const result = useMemo(
    () =>
      computeAll({
        historical,
        performanceAtualOverride,
        valorReferencia,
        volumePeriodo,
        revenueMonthly,
        costItems,
      }),
    [historical, performanceAtualOverride, valorReferencia, volumePeriodo, revenueMonthly, costItems]
  );

  const value = {
    step, setStep,
    historical, setHistorical,
    performanceAtualOverride, setPerformanceAtualOverride,
    valorReferencia, setValorReferencia,
    volumePeriodo, setVolumePeriodo,
    revenueMonthly, setRevenueMonthly,
    selectedWastes, setSelectedWastes,
    costItems, setCostItems,
    result,
  };

  return <CalculatorContext.Provider value={value}>{children}</CalculatorContext.Provider>;
}

export function useCalculator() {
  const ctx = useContext(CalculatorContext);
  if (!ctx) throw new Error("useCalculator must be used within CalculatorProvider");
  return ctx;
}
