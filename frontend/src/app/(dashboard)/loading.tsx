import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    // O 'fixed inset-0' cobre a tela toda. O 'backdrop-blur-sm' dá o efeito de vidro embaçado.
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <p className="text-muted-foreground font-medium">
          Carregando informações...
        </p>
      </div>
    </div>
  );
}
