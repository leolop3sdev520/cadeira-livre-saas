import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarCheck,
  CalendarDays,
  Check,
  Clock3,
  CreditCard,
  MessageCircle,
  Scissors,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const benefits = [
  { icon: CalendarDays, label: "Agenda online 24h" },
  { icon: ArrowUpRight, label: "Link de agendamento próprio" },
  { icon: BarChart3, label: "Visão de faturamento" },
];

const painPoints = [
  {
    icon: CalendarDays,
    title: "Agenda no caderno",
    description:
      "Horários se perdem, rasuras se acumulam e ninguém sabe o que vem depois.",
  },
  {
    icon: UserRound,
    title: "Cliente que some",
    description:
      "Sem lembrete, o cliente esquece. E a cadeira fica vazia no horário.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp sem fim",
    description:
      "Responder sobre horários o dia todo tira o foco de quem está na cadeira.",
  },
  {
    icon: TrendingUp,
    title: "Dinheiro sem clareza",
    description:
      "Sem números organizados, fica difícil saber o que está dando resultado.",
  },
];

const features = [
  {
    icon: CalendarCheck,
    title: "Agenda online",
    description:
      "Deixe o cliente escolher serviço, profissional e horário, a qualquer hora.",
  },
  {
    icon: ShieldCheck,
    title: "Sem horários duplicados",
    description:
      "A disponibilidade é protegida para evitar dois agendamentos na mesma cadeira.",
  },
  {
    icon: BarChart3,
    title: "Visão de faturamento",
    description:
      "Acompanhe o faturamento e os indicadores da sua barbearia pelo painel.",
  },
  {
    icon: Users,
    title: "Cadastro de clientes",
    description:
      "Consulte o histórico e mantenha as informações importantes por perto.",
  },
  {
    icon: Scissors,
    title: "Cadastro de serviços",
    description:
      "Mantenha os serviços, preços e duração organizados na vitrine.",
  },
  {
    icon: Users,
    title: "Gestão da equipe",
    description:
      "Organize os serviços, profissionais e horários de atendimento.",
  },
];

const steps = [
  {
    number: "01",
    title: "Crie sua conta",
    description: "Cadastre sua barbearia e personalize seu espaço.",
  },
  {
    number: "02",
    title: "Configure a agenda",
    description: "Inclua os serviços, horários e profissionais.",
  },
  {
    number: "03",
    title: "Compartilhe seu link",
    description: "Envie sua vitrine para os clientes agendarem.",
  },
  {
    number: "04",
    title: "Acompanhe tudo",
    description: "Veja a rotina e os resultados no painel.",
  },
];

const plans = [
  {
    name: "Solo",
    price: "49,90",
    description: "Para quem toca a barbearia por conta própria.",
    features: [
      "1 profissional",
      "Agenda online 24h",
      "Link de agendamento próprio",
      "Cadastro de clientes",
    ],
    highlighted: false,
  },
  {
    name: "Equipe",
    price: "99,90",
    description: "Mais organização para sua equipe crescer junto.",
    features: [
      "Até 5 profissionais",
      "Tudo do Solo",
      "Visão de faturamento",
      "Zero double-booking",
    ],
    highlighted: true,
  },
];

const questions = [
  {
    question: "Como meus clientes fazem um agendamento?",
    answer:
      "Você compartilha o link da sua barbearia. O cliente escolhe o serviço, o profissional e um horário disponível, sem precisar esperar uma resposta.",
  },
  {
    question: "Preciso instalar algum programa?",
    answer:
      "Não. A Cadeira Livre funciona pelo navegador, tanto no computador quanto no celular.",
  },
  {
    question: "Posso cadastrar minha equipe?",
    answer:
      "Sim. O plano Equipe permite cadastrar até cinco profissionais, com agenda e informações organizadas no mesmo painel.",
  },
  {
    question: "Posso mudar de plano depois?",
    answer:
      "Sim. Você pode escolher o plano que combina com o momento da sua barbearia e entrar em contato com o suporte quando quiser ajustar.",
  },
];

const barbershopImage =
  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=2200&q=85";

const primaryActionClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-brass-500 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-brass-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass-300";

const secondaryActionClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-bone/35 bg-ink/35 px-6 py-3 text-sm font-semibold text-bone transition-colors hover:border-brass-300 hover:text-brass-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass-300";

function Brand() {
  return (
    <Link
      href="/"
      className="flex items-center gap-3"
      aria-label="Cadeira Livre, início"
    >
      <span className="flex size-10 items-center justify-center rounded-full border border-brass-500/40 bg-brass-500/10 text-brass-300">
        <Scissors className="size-5" aria-hidden="true" />
      </span>
      <span className="font-display text-xl font-semibold tracking-tight text-bone">
        cadeira<span className="text-brass-300">livre.</span>
      </span>
    </Link>
  );
}

function CallToActionLinks() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link href="/cadastro" className={primaryActionClass}>
        Começar Agora
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
      <a href="#demonstracao" className={secondaryActionClass}>
        Ver Demonstração
      </a>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="overflow-hidden bg-ink text-bone">
      <header className="absolute inset-x-0 top-0 z-30 border-b border-bone/10 bg-ink/75 backdrop-blur-md">
        <nav
          aria-label="Navegação principal"
          className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8"
        >
          <Brand />
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#problemas"
              className="text-sm text-bone/70 transition-colors hover:text-brass-300"
            >
              Desafios
            </a>
            <a
              href="#recursos"
              className="text-sm text-bone/70 transition-colors hover:text-brass-300"
            >
              Recursos
            </a>
            <a
              href="#planos"
              className="text-sm text-bone/70 transition-colors hover:text-brass-300"
            >
              Planos
            </a>
            <a
              href="#faq"
              className="text-sm text-bone/70 transition-colors hover:text-brass-300"
            >
              Dúvidas
            </a>
          </div>
          <Link
            href="/cadastro"
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-bone/20 px-4 text-sm font-medium text-bone transition-colors hover:border-brass-300 hover:text-brass-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass-300"
          >
            Entrar
          </Link>
        </nav>
      </header>

      <section className="relative isolate flex min-h-[min(900px,100svh)] items-center bg-ink">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url("${barbershopImage}")` }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-ink/80"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-r from-ink/95 via-ink/75 to-ink/45"
        />
        <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-36 sm:px-6 sm:pb-28 sm:pt-40 lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-brass-500/40 bg-ink/55 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-brass-300">
              <Sparkles className="size-4" aria-hidden="true" />
              Gestão feita para barbearias
            </p>
            <h1 className="font-display text-5xl font-medium leading-[1.04] tracking-tight text-bone sm:text-6xl lg:text-7xl">
              Sua barbearia mais organizada,{" "}
              <span className="text-brass-300">mais lucrativa.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-bone/75 sm:text-lg sm:leading-8">
              Organize horários, equipe e resultados em um só lugar. Deixe seus
              clientes agendarem enquanto você cuida da barbearia.
            </p>
            <div className="mt-9">
              <CallToActionLinks />
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-7 gap-y-4 text-sm text-bone/80">
              {benefits.map(({ icon: Icon, label }) => (
                <li key={label} className="inline-flex items-center gap-2.5">
                  <Icon
                    className="size-4 shrink-0 text-brass-300"
                    aria-hidden="true"
                  />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <a
          href="#problemas"
          aria-label="Conheça os desafios da gestão da barbearia"
          className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 text-xs font-medium uppercase tracking-[0.18em] text-bone/55 transition-colors hover:text-brass-300 sm:block"
        >
          Conheça a plataforma
        </a>
      </section>

      <section
        id="problemas"
        className="scroll-mt-20 border-t border-bone/10 bg-ink py-20 sm:py-28"
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 md:grid-cols-[0.85fr_1.15fr] md:items-center lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-300">
              Menos improviso. Mais controle.
            </p>
            <h2 className="mt-5 max-w-lg font-display text-4xl font-medium leading-tight tracking-tight text-bone sm:text-5xl">
              O que trava o crescimento da sua barbearia
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-bone/65">
              Quando a rotina depende de anotações e mensagens, fica difícil
              cuidar de cada cliente e enxergar o próximo passo do negócio.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {painPoints.map(({ icon: Icon, title, description }, index) => (
              <article
                key={title}
                className="rounded-lg border border-line-dark bg-surface p-5 transition-colors hover:border-brass-500/50 sm:p-6"
              >
                <span className="flex size-10 items-center justify-center rounded-md border border-brass-500/25 bg-brass-500/10 text-brass-300">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <p className="mt-5 font-mono text-xs text-brass-300/80">
                  0{index + 1}
                </p>
                <h3 className="mt-2 font-display text-xl font-medium text-bone">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-bone/60">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="recursos"
        className="scroll-mt-20 border-y border-bone/10 bg-graphite py-20 sm:py-28"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-300">
              Uma rotina mais leve começa aqui
            </p>
            <h2 className="mt-4 font-display text-4xl font-medium leading-tight text-bone sm:text-5xl">
              Tudo que acontece na barbearia, num lugar só
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-bone/65">
              Ferramentas simples para cuidar dos agendamentos, da equipe e da
              saúde financeira do negócio.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-lg border border-line-dark bg-surface p-6 transition-colors hover:border-brass-500/50 sm:p-7"
              >
                <span className="flex size-11 items-center justify-center rounded-md bg-brass-500/10 text-brass-300">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-xl font-medium text-bone">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-bone/65">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="demonstracao"
        className="scroll-mt-20 bg-ink py-20 sm:py-28"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-300">
              Gestão com visão de negócio
            </p>
            <h2 className="mt-5 max-w-xl font-display text-4xl font-medium leading-tight text-bone sm:text-5xl">
              O sistema aponta onde está o dinheiro parado
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-bone/65">
              Acompanhe os números da operação e encontre oportunidades para
              aproveitar melhor os horários e serviços da sua barbearia.
            </p>
            <ul className="mt-7 space-y-4">
              {[
                "Acompanhe o movimento do dia com clareza",
                "Entenda quais serviços geram mais receita",
                "Veja os horários e a equipe em um só painel",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-brass-300" />
                  <span className="text-bone/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div
              aria-hidden="true"
              className="absolute -inset-5 rounded-2xl bg-brass-500/10 blur-2xl"
            />
            <div className="relative rounded-xl border border-line-dark bg-surface p-4 shadow-e2 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-dark pb-4">
                <div>
                  <p className="text-xs text-bone/55">Prévia do painel</p>
                  <h3 className="mt-1 font-display text-xl font-medium text-bone">
                    Resumo da barbearia
                  </h3>
                </div>
                <span className="rounded-md border border-brass-500/25 bg-brass-500/10 px-3 py-1.5 text-xs font-medium text-brass-300">
                  Hoje
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-line-dark bg-ink p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-bone/60">
                      Agendamentos hoje
                    </span>
                    <CalendarDays
                      className="size-4 text-brass-300"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="mt-3 font-display text-3xl font-medium text-bone">
                    12
                  </p>
                  <p className="mt-1 text-xs text-bone/45">
                    Agenda organizada
                  </p>
                </div>
                <div className="rounded-lg border border-line-dark bg-ink p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-bone/60">Faturamento</span>
                    <CreditCard
                      className="size-4 text-brass-300"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="mt-3 font-display text-3xl font-medium text-bone">
                    R$ 650
                  </p>
                  <p className="mt-1 text-xs text-bone/45">
                    Exemplo de resumo diário
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-line-dark bg-ink">
                <div className="flex items-center justify-between border-b border-line-dark px-4 py-3">
                  <p className="text-sm font-medium text-bone">
                    Próximos clientes
                  </p>
                  <span className="text-xs text-bone/45">Hoje</span>
                </div>
                <ul className="divide-y divide-line-dark">
                  {[
                    ["09:00", "Lucas Martins", "Corte + barba"],
                    ["10:30", "André Costa", "Corte clássico"],
                    ["13:00", "Pedro Alves", "Barba terapia"],
                  ].map(([time, name, service]) => (
                    <li
                      key={time}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <span className="inline-flex items-center gap-1.5 text-xs tabular-nums text-bone/55">
                        <Clock3 className="size-3.5" aria-hidden="true" />
                        {time}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-bone">
                          {name}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-bone/50">
                          {service}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-3 text-right text-[11px] text-bone/40">
                Valores ilustrativos
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-bone/10 bg-graphite py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-300">
              Simples do começo ao dia a dia
            </p>
            <h2 className="mt-4 font-display text-4xl font-medium text-bone sm:text-5xl">
              Comece hoje
            </h2>
          </div>
          <div className="relative mt-14">
            <div
              aria-hidden="true"
              className="absolute left-[12%] right-[12%] top-6 hidden border-t border-dashed border-brass-500/50 lg:block"
            />
            <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {steps.map((step) => (
                <li key={step.number} className="relative">
                  <span className="relative z-10 flex size-12 items-center justify-center rounded-full border border-brass-500/60 bg-graphite font-mono text-sm font-semibold text-brass-300">
                    {step.number}
                  </span>
                  <h3 className="mt-5 font-display text-xl font-medium text-bone">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-bone/60">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section
        id="planos"
        className="scroll-mt-20 bg-ink py-20 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-300">
              Planos
            </p>
            <h2 className="mt-4 font-display text-4xl font-medium text-bone sm:text-5xl">
              Escolha o ritmo da sua barbearia
            </h2>
            <p className="mt-4 text-base leading-7 text-bone/60">
              Comece pelo que precisa hoje. A gestão fica mais simples em
              qualquer tamanho.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl items-stretch gap-5 md:grid-cols-2">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`relative flex h-full flex-col rounded-xl border bg-surface p-6 sm:p-8 ${
                  plan.highlighted
                    ? "border-brass-500 shadow-e2"
                    : "border-line-dark"
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute right-5 top-5 rounded-full bg-brass-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink sm:right-7 sm:top-7">
                    Mais Escolhido
                  </span>
                )}
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brass-300">
                  Plano {plan.name}
                </p>
                <h3 className="mt-4 max-w-xs font-display text-2xl font-medium text-bone">
                  {plan.description}
                </h3>
                <p className="mt-7 flex items-baseline gap-2">
                  <span className="text-sm text-bone/60">R$</span>
                  <span className="font-display text-5xl font-semibold tracking-tight text-bone">
                    {plan.price}
                  </span>
                  <span className="text-sm text-bone/55">/mês</span>
                </p>
                <div className="my-7 border-t border-line-dark" />
                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-bone/80"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-brass-300" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/cadastro?plan=${plan.name.toLowerCase()}`}
                  className={
                    plan.highlighted
                      ? primaryActionClass
                      : "inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-line-dark px-6 py-3 text-sm font-semibold text-bone transition-colors hover:border-brass-500 hover:text-brass-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass-300"
                  }
                >
                  Começar com {plan.name}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="scroll-mt-20 border-y border-bone/10 bg-graphite py-20 sm:py-28"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-[0.75fr_1.25fr] lg:gap-20 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-300">
              Estamos aqui para ajudar
            </p>
            <h2 className="mt-4 font-display text-4xl font-medium leading-tight text-bone sm:text-5xl">
              Perguntas frequentes
            </h2>
            <p className="mt-5 max-w-sm text-base leading-7 text-bone/60">
              Ficou com alguma dúvida? Veja respostas sobre o uso da plataforma.
            </p>
          </div>
          <Accordion className="border-t border-line-dark">
            {questions.map(({ question, answer }, index) => (
              <AccordionItem key={question} value={`faq-${index + 1}`}>
                <AccordionTrigger>{question}</AccordionTrigger>
                <AccordionContent>{answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-ink py-20 sm:py-28">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url("${barbershopImage}")` }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-ink/85"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-r from-ink/95 via-ink/80 to-ink/60"
        />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brass-300">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Mais clareza para o próximo passo
            </p>
            <h2 className="mt-5 font-display text-4xl font-medium leading-tight text-bone sm:text-5xl lg:text-6xl">
              Sua próxima semana já pode estar organizada
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-bone/70 sm:text-lg">
              Traga seus agendamentos, equipe e informações para um só lugar.
              Comece a organizar a rotina da sua barbearia.
            </p>
            <div className="mt-8">
              <CallToActionLinks />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-bone/10 bg-ink">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <Brand />
          <nav aria-label="Links institucionais" className="flex flex-wrap gap-5">
            <Link
              href="/termos"
              className="text-sm text-bone/55 transition-colors hover:text-brass-300"
            >
              Termos de Uso
            </Link>
            <Link
              href="/privacidade"
              className="text-sm text-bone/55 transition-colors hover:text-brass-300"
            >
              Privacidade
            </Link>
            <a
              href="#recursos"
              className="text-sm text-bone/55 transition-colors hover:text-brass-300"
            >
              Recursos
            </a>
          </nav>
          <p className="text-xs text-bone/45">
            © 2026 Cadeira Livre. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </main>
  );
}
