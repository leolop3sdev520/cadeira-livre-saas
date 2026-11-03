"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Calendar,
  Users,
  Contact,
  Scissors,
  LogOut,
  LayoutDashboard,
  Loader2,
  KeyRound,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { toast, Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ModeToggle } from "@/components/mode-toggle";
import { api } from "@/lib/api";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarbershopProfile,
  ProfileDialog,
} from "@/components/dashboard/profile-dialog";
import { PasswordDialog } from "@/components/dashboard/password-dialog";

const menuItems = [
  { name: "Visão Geral", href: "/dashboard", icon: LayoutDashboard },
  { name: "Agenda", href: "/dashboard/agenda", icon: Calendar },
  { name: "Serviços", href: "/dashboard/servicos", icon: Scissors },
  { name: "Equipe", href: "/dashboard/equipe", icon: Users },
  { name: "Clientes", href: "/dashboard/clientes", icon: Contact },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [barbershopProfile, setBarbershopProfile] =
    useState<BarbershopProfile | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAuthenticated(true);
      setCheckingAuth(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;

    api
      .get<BarbershopProfile>("/api/v1/barbershops/me")
      .then((profile) => {
        if (active) setBarbershopProfile(profile);
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message =
          typeof error === "object" && error && "message" in error
            ? String(error.message)
            : "Não foi possível carregar os dados da barbearia.";
        toast.error(message);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const handleLogout = () => {
    setIsLoggingOut(true);
    localStorage.removeItem("token");
    router.push("/login");
    router.refresh();
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-border bg-card flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <span className="font-display font-bold text-xl text-primary">
            Cadeira Livre
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
          >
            {isLoggingOut ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5" />
            )}
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
          <h2 className="font-semibold text-lg">Painel da Barbearia</h2>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">
                {barbershopProfile?.name ?? "Minha Barbearia"}
              </p>
              <p className="text-xs text-muted-foreground">Painel</p>
            </div>
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Abrir menu da conta"
                className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar>
                  {barbershopProfile?.logo_url && (
                    <AvatarImage
                      src={barbershopProfile.logo_url}
                      alt={`Logo ${barbershopProfile.name}`}
                    />
                  )}
                  <AvatarFallback>
                    {barbershopProfile?.name?.charAt(0).toUpperCase() ?? (
                      <Store className="size-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
                  <Store />
                  Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsPasswordOpen(true)}>
                  <KeyRound />
                  Alterar Senha
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  disabled={isLoggingOut}
                  onClick={handleLogout}
                >
                  {isLoggingOut ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <LogOut />
                  )}
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="p-6 flex-1 overflow-auto bg-background/50">
          {children}
        </div>
      </main>

        <ProfileDialog
          open={isProfileOpen}
          onOpenChange={setIsProfileOpen}
          profile={barbershopProfile}
          onProfileUpdated={setBarbershopProfile}
        />
        <PasswordDialog
          open={isPasswordOpen}
          onOpenChange={setIsPasswordOpen}
        />
        <Toaster richColors position="top-right" />
      </div>
    </TooltipProvider>
  );
}
