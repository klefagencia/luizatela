import React, { useEffect } from "react";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import Header from "@/components/Header";
import StepIndicator from "@/components/StepIndicator";
import Step1Historical from "@/components/wizard/Step1Historical";
import Step2Benchmark from "@/components/wizard/Step2Wastes";
import Step3LossesCosts from "@/components/wizard/Step3Costs";
import Step4Diagnostic from "@/components/wizard/Step4Diagnostic";
import { useCalculator } from "@/contexts/CalculatorContext";
import { Button } from "@/components/ui/button";

const steps = [
  { id: "historical", title: "Avaliação Histórica" },
  { id: "benchmark", title: "Benchmark" },
  { id: "wastes", title: "Desperdícios" },
  { id: "conversion", title: "Conversão" },
];

export default function CalculatorPage() {
  const { step, setStep } = useCalculator();

  // Scroll to top whenever step changes (smooth UX between etapas)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

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

        {/* Step content */}
        <div className="bg-card/60 border border-border rounded-2xl p-4 sm:p-6 lg:p-10 backdrop-blur" data-testid="wizard-card">
          {step === 0 && <Step1Historical />}
          {step === 1 && <Step2Benchmark />}
          {step === 2 && <Step3LossesCosts />}
          {step === 3 && <Step4Diagnostic />}
        </div>

        {/* Navigation */}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={goPrev}
            disabled={step === 0}
            data-testid="prev-step-btn"
                    className="h-11 sm:h-12 px-4 sm:px-6 border-border"
          >
            <ArrowLeft size={16} weight="bold" /> Voltar
          </Button>
          <div className="text-xs font-mono-num text-muted-foreground tracking-widest">
            {String(step + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
          </div>
          {step < steps.length - 1 ? (
            <Button type="button" onClick={goNext} data-testid="next-step-btn" className="h-11 sm:h-12 px-4 sm:px-6 font-bold group">
              Avançar
              <ArrowRight size={16} weight="bold" className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(0)}
              data-testid="restart-btn"
                        className="h-11 sm:h-12 px-4 sm:px-6 border-border"
            >
              Recomeçar
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
