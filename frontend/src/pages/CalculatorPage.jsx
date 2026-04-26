import React from "react";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import Header from "@/components/Header";
import StepIndicator from "@/components/StepIndicator";
import Step1Historical from "@/components/wizard/Step1Historical";
import Step2Wastes from "@/components/wizard/Step2Wastes";
import Step3Costs from "@/components/wizard/Step3Costs";
import Step4Diagnostic from "@/components/wizard/Step4Diagnostic";
import { useCalculator } from "@/contexts/CalculatorContext";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/calculations";

const steps = [
  { id: "historical", title: "Avaliação Histórica" },
  { id: "wastes", title: "Tipos de Perdas" },
  { id: "costs", title: "Custos & Volume" },
  { id: "diagnostic", title: "Diagnóstico" },
];

export default function CalculatorPage() {
  const { step, setStep, result } = useCalculator();

  const goNext = () => setStep(Math.min(step + 1, steps.length - 1));
  const goPrev = () => setStep(Math.max(step - 1, 0));

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      <div
        className="absolute -top-40 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(closest-side, hsla(217.2, 91.2%, 59.8%, 0.12), transparent 70%)",
        }}
      />
      <Header />

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 pb-24">
        {/* Step indicator */}
        <div className="mb-10">
          <StepIndicator steps={steps} current={step} onJump={(i) => setStep(i)} />
        </div>

        {/* Real-time perda preview pill (visible on steps 0-2) */}
        {step < 3 && (
          <div className="mb-8 inline-flex items-center gap-3 px-4 py-2.5 rounded-full border border-destructive/30 bg-destructive/5">
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">Perda anual estimada</span>
            <span className="font-mono-num font-bold text-destructive" data-testid="live-loss-pill">
              {formatBRL(result.total_perda_real_anual)}
            </span>
          </div>
        )}

        {/* Step content */}
        <div className="bg-card/60 border border-border rounded-2xl p-6 lg:p-10 backdrop-blur" data-testid="wizard-card">
          {step === 0 && <Step1Historical />}
          {step === 1 && <Step2Wastes />}
          {step === 2 && <Step3Costs />}
          {step === 3 && <Step4Diagnostic />}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={goPrev}
            disabled={step === 0}
            data-testid="prev-step-btn"
            className="h-12 px-6 border-border"
          >
            <ArrowLeft size={16} weight="bold" /> Voltar
          </Button>
          <div className="text-xs font-mono-num text-muted-foreground tracking-widest">
            {String(step + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
          </div>
          {step < steps.length - 1 ? (
            <Button type="button" onClick={goNext} data-testid="next-step-btn" className="h-12 px-6 font-bold group">
              Avançar
              <ArrowRight size={16} weight="bold" className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(0)}
              data-testid="restart-btn"
              className="h-12 px-6 border-border"
            >
              Recomeçar
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
