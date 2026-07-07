import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChartLineUp, SignOut } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "calc_access_granted";

export default function Header() {
  const location = useLocation();
  const onCalc = location.pathname.startsWith("/calculadora");
  let isAuthorized = false;
  try {
    isAuthorized = localStorage.getItem(STORAGE_KEY) === "true";
  } catch (e) {
    isAuthorized = false;
  }

const handleLogout = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
  window.location.href = "/calculadora";
};

return (
  <header
    data-testid="site-header"
    className="sticky top-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/40"
    >
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-3">
  <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0 min-w-0" data-testid="logo-home-link">
  <div className="w-8 h-8 rounded-md bg-primary/15 border border-primary/40 flex items-center justify-center group-hover:bg-primary/25 transition-colors shrink-0">
  <ChartLineUp size={18} weight="duotone" className="text-primary" />
  </div>
  <div className="flex flex-col leading-none min-w-0">
  <span className="font-display font-black text-sm sm:text-base tracking-tight truncate">DESPERDÍCIO.IO</span>
  <span className="hidden sm:block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Lean Cost Diagnostic</span>
  </div>
  </Link>
  <nav className="flex items-center gap-2 sm:gap-3 shrink-0">
    {!onCalc && (
      <Link to="/calculadora" data-testid="header-cta-calc">
      <Button className="h-9 sm:h-10 px-3 sm:px-5 text-sm sm:text-base font-bold">Calcular agora</Button>
      </Link>
  )}
    {onCalc && isAuthorized && (
      <button
        type="button"
        onClick={handleLogout}
        data-testid="header-logout"
        className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
      <SignOut size={16} weight="bold" />
      <span className="hidden sm:inline">Sair</span>
      </button>
  )}
  </nav>
  </div>
  </header>
  );
}
