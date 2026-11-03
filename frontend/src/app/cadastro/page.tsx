"use client";

import { useState } from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { ArrowLeft, ArrowRight, Check, Scissors } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const registrationSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da barbearia."),
  slug: z
    .string()
    .trim()
    .min(3, "A URL deve ter pelo menos 3 caracteres.")
    .max(80, "A URL deve ter no máximo 80 caracteres.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use letras minúsculas, números e hífens.",
    ),
  admin_email: z.string().trim().email("Informe um e-mail válido."),
  admin_password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres.")
    .max(128, "A senha deve ter no máximo 128 caracteres."),
  plan: z.enum(["solo", "equipe"]),
});

type RegistrationValues = z.infer<typeof registrationSchema>;

const plans = [
  {
    id: "solo" as const,
    title: "Solo",
    price: "R$ 49,90",
    summary: "Para uma cadeira e uma rotina mais organizada.",
    features: ["1 profissional", "Agenda online", "Link próprio"],
  },
  {
    id: "equipe" as const,
    title: "Equipe",
    price: "R$ 99,90",
    summary: "Para organizar um time de até cinco profissionais.",
    features: ["Até 5 profissionais", "Visão de faturamento", "Tudo do Solo"],
  },
];

function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-ink px-4 py-8 text-bone sm:px-6 sm:py-12" />
      }
    >
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get("plan") === "equipe" ? "equipe" : "solo";
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      slug: "",
      admin_email: "",
      admin_password: "",
      plan: initialPlan,
    },
  });

  const slugValue = useWatch({ control, name: "slug" });
  const nameField = register("name");
  const slugField = register("slug");

  const submitRegistration = async (values: RegistrationValues) => {
    setIsSubmitting(true);
    try {
      const result = await api.post<{ token: string }>(
        "/api/v1/barbershops/register",
        {
          ...values,
          name: values.name.trim(),
          slug: values.slug.trim(),
          admin_email: values.admin_email.trim().toLowerCase(),
        },
      );
      localStorage.setItem("token", result.token);
      toast.success("Barbearia cadastrada. Bem-vindo à Cadeira Livre!");
      router.replace("/dashboard");
    } catch (error: unknown) {
      const errorObj = error as { message?: string };
      toast.error(errorObj.message || "Não foi possível criar sua conta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-ink px-4 py-8 text-bone sm:px-6 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="Cadeira Livre, início"
          >
            <span className="flex size-10 items-center justify-center rounded-full border border-brass-500/40 bg-brass-500/10 text-brass-300">
              <Scissors className="size-5" aria-hidden="true" />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight">
              cadeira<span className="text-brass-300">livre.</span>
            </span>
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-bone/65 transition-colors hover:text-brass-300"
          >
            Já tenho conta
          </Link>
        </header>

        <section className="rounded-xl border border-line-dark bg-surface p-5 shadow-e2 sm:p-8">
          <div className="mb-7">
            <Link
              href="/"
              className="mb-5 inline-flex items-center gap-2 text-xs text-bone/55 transition-colors hover:text-brass-300"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Voltar ao site
            </Link>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brass-300">
              Sua barbearia, mais organizada
            </p>
            <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-bone sm:text-4xl">
              Crie sua conta
            </h1>
            <p className="mt-3 text-sm leading-6 text-bone/60">
              Cadastre sua barbearia e escolha o plano ideal para começar.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(submitRegistration)}
            className="space-y-5"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="signup-name" className="text-bone/85">
                Nome da barbearia
              </Label>
              <Input
                id="signup-name"
                autoComplete="organization"
                placeholder="Ex.: Barbearia do Zé"
                className="h-11 border-line-dark bg-ink text-bone placeholder:text-bone/35"
                {...nameField}
                onChange={(event) => {
                  void nameField.onChange(event);
                  if (!slugManuallyEdited) {
                    setValue("slug", createSlug(event.target.value), {
                      shouldValidate: true,
                    });
                  }
                }}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "signup-name-error" : undefined}
              />
              {errors.name && (
                <p id="signup-name-error" className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-slug" className="text-bone/85">
                Endereço da sua página
              </Label>
              <div className="flex min-w-0 items-center rounded-md border border-line-dark bg-ink focus-within:ring-2 focus-within:ring-brass-500/50">
                <span className="hidden shrink-0 border-r border-line-dark px-3 text-xs text-bone/45 sm:block">
                  cadeiralivre.com/
                </span>
                <Input
                  id="signup-slug"
                  autoComplete="off"
                  placeholder="barbearia-do-ze"
                  className="h-11 min-w-0 border-0 bg-transparent text-bone placeholder:text-bone/35 focus-visible:ring-0"
                  {...slugField}
                  onChange={(event) => {
                    setSlugManuallyEdited(true);
                    void slugField.onChange(event);
                  }}
                  aria-invalid={Boolean(errors.slug)}
                  aria-describedby={
                    errors.slug ? "signup-slug-error" : "signup-slug-preview"
                  }
                />
              </div>
              <p
                id={errors.slug ? "signup-slug-error" : "signup-slug-preview"}
                className={`text-xs ${
                  errors.slug ? "text-destructive" : "text-bone/50"
                }`}
              >
                {errors.slug?.message ??
                  `Sua página será: cadeiralivre.com/${slugValue || "[slug]"}`}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email" className="text-bone/85">
                E-mail do administrador
              </Label>
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="voce@barbearia.com"
                className="h-11 border-line-dark bg-ink text-bone placeholder:text-bone/35"
                {...register("admin_email")}
                aria-invalid={Boolean(errors.admin_email)}
                aria-describedby={
                  errors.admin_email ? "signup-email-error" : undefined
                }
              />
              {errors.admin_email && (
                <p id="signup-email-error" className="text-sm text-destructive">
                  {errors.admin_email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password" className="text-bone/85">
                Senha
              </Label>
              <Input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                placeholder="Pelo menos 8 caracteres"
                className="h-11 border-line-dark bg-ink text-bone placeholder:text-bone/35"
                {...register("admin_password")}
                aria-invalid={Boolean(errors.admin_password)}
                aria-describedby={
                  errors.admin_password ? "signup-password-error" : undefined
                }
              />
              {errors.admin_password && (
                <p
                  id="signup-password-error"
                  className="text-sm text-destructive"
                >
                  {errors.admin_password.message}
                </p>
              )}
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-bone/85">
                Escolha seu plano
              </legend>
              <Controller
                control={control}
                name="plan"
                render={({ field }) => (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {plans.map((plan) => (
                      <label
                        key={plan.id}
                        className={`relative block cursor-pointer rounded-lg border p-4 transition-colors focus-within:ring-2 focus-within:ring-brass-300 ${
                          field.value === plan.id
                            ? "border-brass-500 bg-brass-500/10"
                            : "border-line-dark bg-ink hover:border-brass-500/50"
                        }`}
                      >
                        <input
                          ref={field.ref}
                          type="radio"
                          name={field.name}
                          value={plan.id}
                          checked={field.value === plan.id}
                          onChange={() => field.onChange(plan.id)}
                          onBlur={field.onBlur}
                          className="sr-only"
                        />
                        <span className="flex items-start justify-between gap-3">
                          <span>
                            <span className="block font-display text-lg font-medium text-bone">
                              {plan.title}
                            </span>
                            <span className="mt-1 block text-sm font-semibold text-brass-300">
                              {plan.price}
                              <span className="font-normal text-bone/50">
                                /mês
                              </span>
                            </span>
                          </span>
                          <span
                            aria-hidden="true"
                            className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                              field.value === plan.id
                                ? "border-brass-300 bg-brass-500 text-ink"
                                : "border-line-dark text-transparent"
                            }`}
                          >
                            <Check className="size-3" />
                          </span>
                        </span>
                        <span className="mt-3 block text-xs leading-5 text-bone/55">
                          {plan.summary}
                        </span>
                        <span className="mt-3 flex flex-wrap gap-1.5">
                          {plan.features.map((feature) => (
                            <span
                              key={feature}
                              className="rounded-full border border-line-dark px-2 py-1 text-[10px] text-bone/65"
                            >
                              {feature}
                            </span>
                          ))}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              />
            </fieldset>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full bg-brass-500 text-sm font-semibold text-ink hover:bg-brass-300"
            >
              {isSubmitting ? "Criando sua conta..." : "Criar minha conta"}
              {!isSubmitting && (
                <ArrowRight className="size-4" aria-hidden="true" />
              )}
            </Button>
            <p className="text-center text-xs leading-5 text-bone/45">
              Ao continuar, você poderá acessar o painel da sua barbearia.
            </p>
          </form>
        </section>

        <p className="mt-6 text-center text-sm text-bone/55">
          Já tem cadastro?{" "}
          <Link
            href="/login"
            className="font-medium text-brass-300 underline-offset-4 hover:underline"
          >
            Já tenho conta
          </Link>
        </p>
      </div>
    </main>
  );
}
