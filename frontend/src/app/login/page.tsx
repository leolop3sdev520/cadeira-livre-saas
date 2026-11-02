"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Lock, Mail, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("ze@barbearia.com");
  const [password, setPassword] = useState("senha123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post<{ token: string }>("/api/v1/sessions", {
        email,
        password,
      });

      // Salva o token no navegador
      localStorage.setItem("token", response.token);

      // Redireciona para o painel
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      // CORREÇÃO DO TYPESCRIPT AQUI:
      const errorObj = err as { message?: string };
      setError(errorObj?.message || "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dark min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="w-full max-w-md p-8 bg-surface border border-line-dark rounded-2xl shadow-e2">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-display text-bone">
            Cadeira Livre
          </h1>
          <p className="text-muted-foreground mt-2">
            Acesse o painel da sua barbearia
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-muted-foreground">
              E-mail
            </label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-2 border border-line-dark rounded-md h-11 pl-10 pr-3 text-bone focus:outline-none focus:border-brass-500"
                placeholder="ze@barbearia.com"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-muted-foreground">
              Senha
            </label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-2 border border-line-dark rounded-md h-11 pl-10 pr-3 text-bone focus:outline-none focus:border-brass-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <p className="text-danger-fg text-sm bg-danger-bg p-2 rounded">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-4 bg-brass-500 hover:bg-brass-300 text-ink font-bold rounded-md flex justify-center items-center"
          >
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              "Entrar no Painel"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
