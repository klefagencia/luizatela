import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChartLineUp } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export default function Header() {
  const location = useLocation();
  const onCalc = location.pathname.startsWith("/calculadora");
  return (
    <header
      data-testid="site-header"
      className="sticky top-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/40"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group" data-testid="logo-home-link">
          <div className="w-8 h-8 rounded-md bg-primary/15 border border-primary/40 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
            <ChartLineUp size={18} weight="duotone" className="text-primary" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display font-black text-base tracking-tight">DESPERDÍCIO.IO</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Lean Cost Diagnostic</span>
          </div>
        </Link>
        <nav className="flex items-center gap-3">
          {!onCalc && (
            <Link to="/calculadora" data-testid="header-cta-calc">
              <Button className="h-10 px-5 font-bold">Calcular agora</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
