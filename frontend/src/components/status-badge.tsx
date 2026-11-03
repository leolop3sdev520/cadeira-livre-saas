import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  isActive: boolean;
}

export function StatusBadge({ isActive }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border",
        isActive
          ? "bg-emerald-100 text-emerald-800 border-emerald-200" // Verde para Ativo
          : "bg-red-100 text-red-800 border-red-200", // Vermelho para Inativo
      )}
    >
      {isActive ? "Ativo" : "Inativo"}
    </span>
  );
}
