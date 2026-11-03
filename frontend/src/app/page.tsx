"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useTheme } from "next-themes";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  Check,
  CheckCircle2,
  Scissors,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const schedule = [
  { time: "09:00", name: "Lucas Martins", service: "Corte + barba", color: "bg-primary" },
  { time: "10:30", name: "André Costa", service: "Corte clássico", color: "bg-[#7f9b82]" },
  { time: "13:00", name: "Pedro Alves", service: "Barba terapia", color: "bg-[#b77857]" },
];

const features = [
  {
    number: "01",
    icon: CalendarCheck,
    title: "Agenda 24h. Até enquanto você atende.",
    description:
      "Seus clientes escolhem serviço, profissional e horário por conta própria — sem depender de uma resposta no WhatsApp.",
    tag: "Agendamento online",
    className: "md:col-span-2 md:row-span-2",
    featured: true,
  },
  {
    number: "02",
    icon: ShieldCheck,
    title: "Zero conflitos de horário.",
    description:
      "Disponibilidade sincronizada para ninguém marcar a mesma cadeira duas vezes.",
    tag: "Sem double-booking",
    className: "",
    featured: false,
  },
  {
    number: "03",
    icon: Users,
    title: "Equipe no mesmo compasso.",
    description:
      "Serviços, profissionais e jornadas de trabalho organizados num só painel.",
    tag: "Gestão de equipe",
    className: "",
    featured: false,
  },
];

const plans = [
  {
    name: "Solo",
    price: "49,90",
    description: "A cadeira é sua. A agenda também.",
    features: ["1 profissional", "Agendamento online", "Controle financeiro"],
    highlighted: false,
  },
  {
    name: "Equipe",
    price: "99,90",
    description: "Mais gente na equipe. Mais visão do negócio.",
    features: [
      "Profissionais ilimitados",
      "Relatórios avançados",
      "Suporte prioritário",
    ],
    highlighted: true,
  },
];

function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground",
        small ? "size-9" : "size-11",
      )}
    >
      <Scissors className={small ? "size-4" : "size-5"} strokeWidth={1.8} />
    </span>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[610px] animate-bounce [animation-duration:3s] [animation-iteration-count:infinite] [animation-timing-function:ease-in-out] motion-reduce:animate-none">
      <div className="absolute -inset-8 rounded-[3rem] bg-brass-500/20 blur-3xl" />
      <div className="absolute -inset-px rounded-[1.8rem] bg-gradient-to-br from-white/20 via-white/5 to-transparent" />
      <div className="relative rounded-[1.75rem] border border-white/10 bg-[#15171b]/95 p-3 shadow-2xl shadow-black/60 backdrop-blur-xl sm:p-5">
        <div className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-ink/90">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-brass-500 text-ink">
                <Scissors className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-bone">Barbearia do Zé</p>
                <p className="text-xs text-bone/50">Painel de hoje</p>
              </div>
            </div>
            <span className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              AO VIVO
            </span>
          </div>

          <div className="grid grid-cols-3 gap-px border-b border-white/10 bg-white/10">
            {[
              ["Agendamentos", "12", "+3 hoje"],
              ["Faturamento", "R$ 650", "até agora"],
              ["Ocupação", "86%", "agenda cheia"],
            ].map(([label, value, note]) => (
              <div key={label} className="bg-[#17191e] px-3 py-4 sm:px-5">
                <p className="text-[9px] uppercase tracking-[0.12em] text-bone/45 sm:text-[10px]">
                  {label}
                </p>
                <p className="mt-1 font-display text-xl font-semibold tracking-tight text-bone sm:text-2xl">
                  {value}
                </p>
                <p className="mt-1 text-[10px] text-bone/40">{note}</p>
              </div>
            ))}
          </div>

          <div className="p-4 sm:p-6">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-bone/40">
                  QUARTA-FEIRA, 18 NOV
                </p>
                <h3 className="mt-1 font-display text-xl font-semibold text-bone">
                  A agenda de hoje
                </h3>
              </div>
              <span className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-bone/55">
                Ver semana
              </span>
            </div>

            <div className="space-y-2.5">
              {schedule.map((item, index) => (
                <div
                  key={item.time}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 sm:gap-4 sm:p-4"
                >
                  <span className="w-12 shrink-0 font-mono text-xs font-semibold tabular-nums text-bone/45">
                    {item.time}
                  </span>
                  <span
                    className={cn(
                      "h-10 w-1 shrink-0 rounded-full",
                      item.color,
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-bone/90">
                      {item.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-bone/45">
                      {item.service} <span className="px-1">·</span>{" "}
                      {index === 1 ? "Marina" : "Rafael"}
                    </p>
                  </div>
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-brass-500/15 bg-brass-500/[0.08] px-4 py-3">
              <span className="text-xs text-bone/55">
                Próximo horário disponível
              </span>
              <span className="text-sm font-bold text-brass-300">14:30</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-2xl border border-white/10 bg-[#1a1c21] px-4 py-3 shadow-xl shadow-black/40 sm:flex lg:-left-10">
        <span className="flex size-10 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
          <CalendarCheck className="size-5" />
        </span>
        <span>
          <span className="block text-xs font-semibold text-bone">
            Novo horário reservado
          </span>
          <span className="mt-0.5 block text-[11px] text-bone/45">
            Confirmado automaticamente
          </span>
        </span>
        <Check className="ml-1 size-4 text-emerald-300" />
      </div>
      <div className="absolute -right-3 top-14 hidden rounded-xl border border-white/10 bg-[#1a1c21] px-4 py-3 shadow-xl shadow-black/40 lg:block lg:-right-12">
        <p className="text-[10px] uppercase tracking-[0.15em] text-bone/40">
          Sua cadeira
        </p>
        <p className="mt-1 font-display text-xl font-semibold text-bone">
          em movimento.
        </p>
      </div>
    </div>
  );
}

function BookingPreview() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-8 rounded-[3rem] bg-brass-500/15 blur-3xl" />
      <div className="relative mx-auto max-w-[340px] rotate-[-2deg] rounded-[2.4rem] border border-border bg-card p-2.5 shadow-[0_35px_90px_-28px_rgba(0,0,0,0.65)] transition-transform duration-500 hover:rotate-0">
        <div className="overflow-hidden rounded-[1.85rem] border border-border bg-background px-5 pb-6 pt-4">
          <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-muted-foreground/30" />
          <div className="flex items-center gap-3 border-b border-border pb-5">
            <BrandMark small />
            <div>
              <p className="text-sm font-semibold">Barbearia do Zé</p>
              <p className="text-xs text-muted-foreground">Escolha seu serviço</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {[
              ["Corte masculino", "30 min", "R$ 50"],
              ["Corte + barba", "50 min", "R$ 80"],
            ].map(([name, time, price], index) => (
              <div
                key={name}
                className={cn(
                  "flex items-center justify-between rounded-2xl border p-3.5",
                  index === 0
                    ? "border-primary/60 bg-primary/5"
                    : "border-border bg-card",
                )}
              >
                <span>
                  <span className="block text-sm font-semibold">{name}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {time}
                  </span>
                </span>
                <span className="text-sm font-bold">{price}</span>
              </div>
            ))}
          </div>
          <p className="mb-3 mt-6 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            Hoje, horários disponíveis
          </p>
          <div className="grid grid-cols-3 gap-2">
            {["14:30", "15:00", "16:30"].map((time, index) => (
              <span
                key={time}
                className={cn(
                  "rounded-xl border py-2.5 text-center font-mono text-xs font-semibold",
                  index === 1
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground",
                )}
              >
                {time}
              </span>
            ))}
          </div>
          <div className="mt-5 rounded-xl bg-primary py-3 text-center text-sm font-semibold text-primary-foreground">
            Reservar horário
          </div>
        </div>
      </div>
      <div className="absolute -right-2 bottom-16 flex size-14 items-center justify-center rounded-2xl border-4 border-background bg-emerald-500 text-white shadow-xl shadow-emerald-950/30 sm:-right-5">
        <Check className="size-7" strokeWidth={3} />
      </div>
      <div className="absolute -left-5 top-20 hidden rounded-xl border border-border bg-card px-4 py-3 shadow-xl sm:block">
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          Agendamento
        </p>
        <p className="mt-1 text-sm font-semibold">confirmado</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { setTheme } = useTheme();

  useEffect(() => {
    if (localStorage.getItem("theme") === null) {
      setTheme("dark");
    }
  }, [setTheme]);

  return (
    <main className="overflow-hidden bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.08] bg-ink/75 text-bone shadow-lg shadow-black/5 backdrop-blur-md">
        <nav
          aria-label="Navegação principal"
          className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        >
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="Cadeira Livre, início"
          >
            <span className="flex size-10 items-center justify-center rounded-full border border-brass-500/30 bg-brass-500/10 text-brass-300">
              <Scissors className="size-5" strokeWidth={1.8} />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight">
              cadeira<span className="text-brass-300">livre.</span>
            </span>
          </Link>

          <div className="hidden items-center gap-9 md:flex">
            <a
              href="#recursos"
              className="text-sm text-bone/60 transition-colors hover:text-brass-300"
            >
              Recursos
            </a>
            <a
              href="#planos"
              className="text-sm text-bone/60 transition-colors hover:text-brass-300"
            >
              Planos
            </a>
            <a
              href="#demonstracao"
              className="text-sm text-bone/60 transition-colors hover:text-brass-300"
            >
              Demonstração
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="[&_button]:text-bone [&_button:hover]:bg-white/10 [&_button:hover]:text-brass-300">
              <ModeToggle />
            </span>
            <Link
              href="/login"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-bone/75 transition-colors hover:text-bone sm:inline-flex"
            >
              Entrar
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative isolate scroll-mt-20 bg-ink text-bone">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brass-500/20 via-ink to-ink" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="absolute -left-48 top-1/3 size-[30rem] rounded-full bg-brass-500/[0.06] blur-[120px]" />
          <div className="pole absolute -right-24 top-28 hidden h-[30rem] w-20 rotate-12 rounded-full opacity-[0.08] blur-[1px] lg:block" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
        </div>

        <div className="mx-auto grid min-h-[760px] max-w-7xl items-center gap-16 px-4 pb-24 pt-32 sm:px-6 sm:pt-36 md:grid-cols-[0.92fr_1.08fr] md:gap-10 lg:px-8">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-brass-500/30 bg-brass-500/10 px-4 py-2 text-[10px] font-bold tracking-[0.16em] text-brass-300 sm:text-xs">
              <Sparkles className="size-3.5" />
              GESTÃO INTELIGENTE PARA BARBEARIAS
            </div>
            <h1 className="font-display text-[3.35rem] font-medium leading-[0.98] tracking-[-0.055em] sm:text-7xl lg:text-[5.35rem]">
              A agenda da
              <br />
              sua barbearia,
              <br />
              <span className="bg-gradient-to-r from-bone to-bone/70 bg-clip-text text-transparent">
                sempre
              </span>{" "}
              <span className="text-brass-300">cheia.</span>
            </h1>
            <p className="mt-8 max-w-lg text-base leading-7 text-bone/60 sm:text-lg sm:leading-8">
              Seus clientes marcam sozinhos, sua equipe trabalha alinhada e
              você ganha tempo para fazer o que sabe fazer melhor.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-13 items-center justify-center rounded-full bg-brass-500 px-7 text-base font-semibold text-ink shadow-[0_8px_35px_-10px_rgba(200,150,62,0.7)] transition-all hover:-translate-y-0.5 hover:bg-brass-300 hover:shadow-[0_12px_40px_-10px_rgba(200,150,62,0.8)]"
              >
                Começar Grátis
                <ArrowRight className="ml-2 size-4" />
              </Link>
              <a
                href="#demonstracao"
                className="inline-flex h-13 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-7 text-base font-medium text-bone transition-all hover:border-white/30 hover:bg-white/[0.08]"
              >
                Ver demonstração
                <ArrowDown className="ml-2 size-4" />
              </a>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-bone/45">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-4 text-brass-300" />
                Agenda sempre disponível
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-4 text-brass-300" />
                Simples para sua equipe
              </span>
            </div>
          </div>

          <div className="relative px-2 py-4 sm:px-8 md:px-0">
            <HeroPreview />
          </div>
        </div>
      </section>

      <section
        aria-label="Resultados da Cadeira Livre"
        className="border-b border-border bg-background"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-border px-4 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-8">
          {[
            ["+500", "barbearias em movimento"],
            ["+10k", "agendamentos organizados"],
            ["Zero", "conflitos de horário"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="flex items-center justify-center gap-4 py-7 md:py-9"
            >
              <span className="font-display text-4xl font-medium tracking-tight text-primary sm:text-5xl">
                {value}
              </span>
              <span className="max-w-32 text-xs leading-5 text-muted-foreground sm:text-sm">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section id="recursos" className="scroll-mt-24 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Menos correria. Mais cadeira ocupada.
              </p>
              <h2 className="mt-4 max-w-xl font-display text-4xl font-medium leading-tight tracking-[-0.035em] sm:text-5xl">
                A rotina flui quando a agenda também.
              </h2>
            </div>
            <p className="max-w-xl pb-1 text-base leading-7 text-muted-foreground md:justify-self-end">
              Ferramentas feitas para a rotina real da barbearia: simples para
              o cliente, claras para o profissional.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.number}
                className={cn(
                  "group relative flex min-h-72 flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-brass-500/50 hover:shadow-[0_24px_70px_-45px_rgba(200,150,62,0.55)] sm:p-9 md:min-h-64",
                  feature.className,
                )}
              >
                <div className="pointer-events-none absolute -right-8 -top-10 size-44 rounded-full bg-brass-500/[0.04] transition-transform duration-500 group-hover:scale-150 group-hover:bg-brass-500/[0.08]" />
                <div className="relative flex items-start justify-between">
                  <span className="flex size-12 items-center justify-center rounded-2xl border border-brass-500/20 bg-brass-500/10 text-primary transition-colors group-hover:bg-brass-500 group-hover:text-ink">
                    <feature.icon className="size-5" />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground/70">
                    / {feature.number}
                  </span>
                </div>
                {feature.featured && (
                  <div className="relative mt-8 flex h-24 items-end gap-2 overflow-hidden rounded-2xl border border-border/70 bg-background/80 px-5 pb-3 pt-5">
                    <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-border" />
                    {[28, 44, 35, 62, 49, 75, 58, 88, 67, 100, 79, 91].map(
                      (height, index) => (
                        <div
                          key={index}
                          className="relative flex-1 rounded-t-sm bg-gradient-to-t from-brass-500/25 to-brass-500/80 transition-opacity group-hover:opacity-100"
                          style={{ height: `${height}%` }}
                        />
                      ),
                    )}
                    <span className="absolute right-4 top-3 rounded-full border border-brass-500/20 bg-brass-500/10 px-2 py-1 text-[9px] font-semibold text-primary">
                      agenda preenchendo
                    </span>
                  </div>
                )}
                <div className="relative mt-8">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.17em] text-primary">
                    {feature.tag}
                  </p>
                  <h3
                    className={cn(
                      "max-w-lg font-display font-medium leading-tight tracking-tight",
                      feature.featured ? "text-3xl sm:text-4xl" : "text-2xl",
                    )}
                  >
                    {feature.title}
                  </h3>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="demonstracao"
        className="scroll-mt-24 border-y border-border/70 bg-card/35 py-24 sm:py-32"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 md:grid-cols-2 lg:gap-24 lg:px-8">
          <BookingPreview />

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Uma experiência melhor para todos
            </p>
            <h2 className="mt-4 font-display text-4xl font-medium leading-[1.08] tracking-[-0.04em] sm:text-5xl">
              Pare de perder dinheiro com horários vagos.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
              Sua vitrine fica aberta mesmo depois de fechar. Os clientes veem
              serviços, preços e horários livres e agendam no momento que for
              melhor para eles.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                "Serviços e preços num só lugar",
                "Horários disponíveis em tempo real",
                "Agendamento simples pelo celular",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm font-medium"
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-brass-500/10 text-primary">
                    <Check className="size-3.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/barbearia-do-ze"
              className={buttonVariants({
                variant: "outline",
                className:
                  "mt-9 h-11 rounded-full border-border px-5 transition-all hover:border-brass-500/50 hover:text-primary",
              })}
            >
              Explorar demonstração
              <ArrowUpRight className="ml-2 size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section id="planos" className="scroll-mt-24 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Cresça no seu ritmo
            </p>
            <h2 className="mt-4 font-display text-4xl font-medium tracking-[-0.04em] sm:text-5xl">
              Um plano para o seu momento.
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              Comece com o essencial. Cresça com a agenda sob controle.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl items-stretch gap-6 md:grid-cols-2">
            {plans.map((plan) =>
              plan.highlighted ? (
                <div
                  key={plan.name}
                  className="group rounded-[1.55rem] bg-gradient-to-b from-brass-500 to-brass-700 p-px transition-transform duration-300 hover:scale-[1.03]"
                >
                  <article className="relative flex h-full flex-col rounded-[1.5rem] bg-background p-7 sm:p-9">
                    <span className="absolute right-6 top-6 rounded-full bg-brass-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink sm:right-8 sm:top-8">
                      Recomendado
                    </span>
                    <p className="text-xs font-bold uppercase tracking-[0.17em] text-primary">
                      Plano {plan.name}
                    </p>
                    <h3 className="mt-3 max-w-[17rem] font-display text-2xl font-medium">
                      {plan.description}
                    </h3>
                    <div className="mt-8 flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-muted-foreground">
                        R$
                      </span>
                      <span className="font-display text-5xl font-semibold tracking-tight">
                        {plan.price}
                      </span>
                      <span className="text-sm text-muted-foreground">/ mês</span>
                    </div>
                    <div className="my-8 h-px bg-border" />
                    <ul className="mb-9 flex-1 space-y-4">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-3 text-sm"
                        >
                          <Check className="size-4 shrink-0 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/login"
                      className="inline-flex h-12 w-full items-center justify-center rounded-full bg-brass-500 text-sm font-semibold text-ink transition-colors hover:bg-brass-300"
                    >
                      Escolher plano
                      <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </article>
                </div>
              ) : (
                <article
                  key={plan.name}
                  className="group flex flex-col rounded-3xl border border-border bg-card p-7 transition-all duration-300 hover:scale-[1.03] hover:border-brass-500/40 hover:shadow-xl hover:shadow-brass-500/5 sm:p-9"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.17em] text-primary">
                    Plano {plan.name}
                  </p>
                  <h3 className="mt-3 font-display text-2xl font-medium">
                    {plan.description}
                  </h3>
                  <div className="mt-8 flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-muted-foreground">
                      R$
                    </span>
                    <span className="font-display text-5xl font-semibold tracking-tight">
                      {plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground">/ mês</span>
                  </div>
                  <div className="my-8 h-px bg-border" />
                  <ul className="mb-9 flex-1 space-y-4">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-3 text-sm"
                      >
                        <Check className="size-4 shrink-0 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/login"
                    className={buttonVariants({
                      variant: "outline",
                      size: "lg",
                      className: "h-12 w-full rounded-full",
                    })}
                  >
                    Escolher plano
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </article>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-ink px-6 py-14 text-bone sm:px-12 sm:py-20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-brass-500/20 via-ink to-ink" />
          <div className="pole absolute -right-10 -top-20 h-[150%] w-28 rotate-12 opacity-10" />
          <div className="absolute -right-24 -top-32 size-96 rounded-full border border-white/10" />
          <div className="absolute -right-10 -top-16 size-64 rounded-full border border-white/10" />
          <div className="relative z-10 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brass-300">
              O próximo horário pode ser seu
            </p>
            <h2 className="mt-4 font-display text-4xl font-medium leading-tight tracking-[-0.04em] sm:text-6xl">
              Bora deixar a agenda girando?
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-bone/60">
              Conheça o painel e veja como a Cadeira Livre pode entrar na rotina
              da sua barbearia.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex h-12 items-center rounded-full bg-brass-500 px-6 text-sm font-semibold text-ink transition-all hover:-translate-y-0.5 hover:bg-brass-300"
            >
              Começar Grátis
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-muted/50">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Scissors className="size-4" />
            </span>
            <span className="font-display text-lg font-semibold">
              cadeira<span className="text-primary">livre.</span>
            </span>
          </Link>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link
              href="/termos"
              className="transition-colors hover:text-brass-500"
            >
              Termos de Uso
            </Link>
            <Link
              href="/privacidade"
              className="transition-colors hover:text-brass-500"
            >
              Privacidade
            </Link>
            <a
              href="#recursos"
              className="transition-colors hover:text-brass-500"
            >
              Recursos
            </a>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 Cadeira Livre. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </main>
  );
}
