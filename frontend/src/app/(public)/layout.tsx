import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { Toaster } from "sonner";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="font-display text-lg font-bold text-primary"
          >
            Cadeira Livre
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Painel do Barbeiro
            </Link>
            <ModeToggle />
          </nav>
        </div>
      </header>
      {children}
      <Toaster richColors position="top-right" />
    </div>
  );
}
