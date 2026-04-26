import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Lightning, ChartBar, Coins, Warning,
  Factory, Stack, Target,
} from "@phosphor-icons/react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { LEAN_WASTES } from "@/lib/calculations";

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background grid + gradient */}
      <div className="absolute inset-0 grid-bg pointer-events-none opacity-60" />
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(closest-side, hsla(217.2, 91.2%, 59.8%, 0.18), transparent 70%)",
        }}
      />

      <Header />

      <main className="relative z-10">
        {/* HERO */}
        <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-28 lg:pt-28 lg:pb-36">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs uppercase tracking-[0.2em] font-bold mb-8">
              <Lightning size={12} weight="fill" />
              Diagnóstico Lean · Tempo real
            </div>
            <h1
              data-testid="hero-title"
              className="font-display font-black text-5xl sm:text-6xl lg:text-7xl tracking-[-0.03em] leading-[0.95] mb-6"
            >
              Quanto dinheiro você está
              <br />
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-primary via-blue-400 to-blue-200 bg-clip-text text-transparent">
                  perdendo sem perceber?
                </span>
              </span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-10 font-light">
              Descubra com alguns dados o impacto financeiro real do desperdício no seu negócio — baseado nos
              <span className="text-foreground font-medium"> 8 tipos de perda do Lean Manufacturing</span>.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/calculadora" data-testid="hero-cta-button">
                <Button className="h-14 px-8 text-base font-bold group">
                  Calcular agora
                  <ArrowRight size={20} weight="bold" className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#como-funciona" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 font-medium" data-testid="hero-link-how">
                Como funciona
                <ArrowRight size={14} />
              </a>
            </div>
          </motion.div>

          {/* Stats Strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-px bg-border/40 border border-border/40 rounded-xl overflow-hidden"
          >
            {[
              { k: "GAP", v: "Eficiência", icon: Target },
              { k: "8", v: "Tipos de Perda", icon: Stack },
              { k: "R$", v: "Perda Anual", icon: Coins },
              { k: "%", v: "Faturamento", icon: ChartBar },
            ].map((s, i) => (
              <div key={i} className="bg-card p-6 lg:p-8">
                <s.icon size={20} weight="duotone" className="text-primary mb-3" />
                <div className="font-display font-black text-3xl lg:text-4xl tracking-tight">{s.k}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1">{s.v}</div>
              </div>
            ))}
          </motion.div>
        </section>

        {/* COMO FUNCIONA */}
        <section id="como-funciona" className="max-w-7xl mx-auto px-6 lg:px-10 pb-28">
          <div className="mb-16 max-w-2xl">
            <div className="text-xs uppercase tracking-[0.25em] text-primary font-bold mb-3">Metodologia</div>
            <h2 className="font-display font-black text-4xl lg:text-5xl tracking-tight leading-[1.05]">
              Da planilha técnica<br />ao diagnóstico visual.
            </h2>
            <p className="text-muted-foreground mt-5 text-base leading-relaxed">
              A calculadora segue fielmente a lógica de avaliação de perdas Lean: avaliação histórica de produtividade, GAP de eficiência, custos por item e classificação nos 8 tipos de perda.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { n: "01", t: "Avaliação Histórica", d: "Insira a série temporal de produtividade (%) e calcule a Performance Atual.", icon: ChartBar },
              { n: "02", t: "Performance vs Referência", d: "Defina o valor de referência ideal e veja o GAP de eficiência em tempo real.", icon: Target },
              { n: "03", t: "Custos & Perdas", d: "Adicione itens de custo, volume de produção e classifique nos 8 tipos Lean.", icon: Factory },
              { n: "04", t: "Diagnóstico", d: "Veja a perda mensal, anual e o % do seu faturamento jogado fora.", icon: Warning },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/40 transition-colors group"
              >
                <div className="flex items-start justify-between mb-6">
                  <span className="font-mono-num text-xs text-muted-foreground tracking-widest">{step.n}</span>
                  <step.icon size={22} weight="duotone" className="text-primary group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{step.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.d}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* QUEM CRIOU A CALCULADORA */}
        <section id="autor" className="max-w-7xl mx-auto px-6 lg:px-10 pb-28">
          <div className="bg-card border border-border rounded-2xl p-8 lg:p-12 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(closest-side, hsla(217.2, 91.2%, 59.8%, 0.10), transparent 70%)" }} />
            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-10 lg:gap-14 items-center relative z-10">
              {/* Photo card */}
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-[320px] mx-auto lg:mx-0"
              >
                <div className="relative rounded-2xl overflow-hidden border border-border bg-muted aspect-[4/5] shadow-2xl">
                  <img
                    src="https://customer-assets.emergentagent.com/job_loss-impact-calc/artifacts/piv7qetq_luiz-atela.jpeg"
                    alt="Luiz Atela — Consultor especialista"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    data-testid="luiz-photo"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
                </div>
                {/* Badge */}
                <div
                  data-testid="luiz-badge"
                  className="absolute -bottom-4 -left-4 bg-emerald-500 text-emerald-950 px-4 py-3 rounded-xl shadow-xl border-2 border-background"
                >
                  <div className="flex items-center gap-2">
                    <Medal size={18} weight="fill" />
                    <div className="leading-tight">
                      <div className="font-display font-black text-sm">25 Anos</div>
                      <div className="text-[10px] uppercase tracking-widest font-bold">de Consultoria</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Bio */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="text-xs uppercase tracking-[0.25em] text-emerald-400 font-bold mb-3">
                  Quem criou a calculadora
                </div>
                <h2
                  data-testid="luiz-name"
                  className="font-display font-black text-5xl lg:text-6xl tracking-tight leading-[0.95] mb-6"
                >
                  Luiz Atela
                </h2>
                <p className="text-muted-foreground text-base lg:text-lg leading-relaxed max-w-2xl mb-6">
                  Consultor especialista em <span className="text-foreground font-semibold">excelência operacional</span> com <span className="text-foreground font-bold">mais de 25 anos</span> ajudando empresas a eliminar desperdícios e multiplicar a lucratividade. Certificado <span className="text-foreground font-semibold">Green Belt</span> e <span className="text-foreground font-semibold">Black Belt</span>, com histórico comprovado em mais de <span className="text-foreground font-bold font-mono-num">300 projetos</span> de otimização.
                </p>
                <div className="flex flex-wrap gap-3 mt-6">
                  {[
                    { icon: CheckCircle, t: "Green Belt" },
                    { icon: CheckCircle, t: "Black Belt" },
                    { icon: CheckCircle, t: "300+ projetos" },
                    { icon: CheckCircle, t: "25+ anos" },
                  ].map((c, i) => (
                    <div
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold"
                    >
                      <c.icon size={14} weight="fill" />
                      {c.t}
                    </div>
                  ))}
                </div>
                <a
                  href="https://luizatela.aksgestao.com/calculadora/"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="luiz-cta-link"
                  className="inline-flex items-center gap-2 mt-8 h-12 px-6 rounded-md bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-sm transition-all hover:translate-y-[-2px] hover:shadow-lg group"
                >
                  Conheça o trabalho do Luiz Atela
                  <ArrowRight size={18} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                </a>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 8 LEAN WASTES */}
        <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-28">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-primary font-bold mb-3">Lean Manufacturing</div>
              <h2 className="font-display font-black text-4xl lg:text-5xl tracking-tight">Os 8 tipos de perda.</h2>
            </div>
            <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
              Toda ineficiência do seu processo se enquadra em uma destas categorias. Identificá-las é o primeiro passo para eliminá-las.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {LEAN_WASTES.map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="bg-card border border-border rounded-lg p-5 hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="font-mono-num text-xs text-primary">{String(i + 1).padStart(2, "0")}</span>
                  <h4 className="font-display font-bold text-base uppercase tracking-tight">{w.label}</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{w.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-28">
          <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-10 lg:p-16">
            <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="max-w-xl">
                <h3 className="font-display font-black text-3xl lg:text-5xl tracking-tight leading-tight mb-4">
                  Pronto para o<br />
                  <span className="text-primary">tapa na cara financeiro?</span>
                </h3>
                <p className="text-muted-foreground">Em alguns minutos você descobre quanto seu negócio está perdendo.</p>
              </div>
              <Link to="/calculadora" data-testid="footer-cta-button">
                <Button className="h-14 px-8 text-base font-bold group">
                  Iniciar diagnóstico
                  <ArrowRight size={20} weight="bold" className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-border/40 py-8">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between text-xs text-muted-foreground">
            <span>© 2026 Desperdício.io</span>
            <span className="font-mono-num tracking-widest uppercase">Lean · Six Sigma · Diagnostic</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
