"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface BarbershopProfile {
  name: string;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "Informe ao menos 2 caracteres.").max(120),
  address: z.string().max(300),
  phone: z.string().max(40),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: BarbershopProfile | null;
  onProfileUpdated: (profile: BarbershopProfile) => void;
}

export function ProfileDialog({
  open,
  onOpenChange,
  profile,
  onProfileUpdated,
}: ProfileDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", address: "", phone: "" },
  });

  useEffect(() => {
    if (open && profile) {
      reset({
        name: profile.name,
        address: profile.address ?? "",
        phone: profile.phone ?? "",
      });
    }
  }, [open, profile, reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSaving(true);
    try {
      const updatedProfile = await api.patch<BarbershopProfile>(
        "/api/v1/barbershops/profile",
        {
          name: values.name,
          address: values.address.trim() || null,
          phone: values.phone.trim() || null,
        },
      );
      onProfileUpdated(updatedProfile);
      toast.success("Perfil da barbearia atualizado.");
      onOpenChange(false);
    } catch (error) {
      const message =
        typeof error === "object" && error && "message" in error
          ? String(error.message)
          : "Não foi possível atualizar o perfil.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Selecione uma imagem JPG, PNG ou WEBP.");
      input.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5 MB.");
      input.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setIsUploading(true);
    try {
      const result = await api.post<{ logo_url: string }>(
        "/api/v1/barbershops/logo",
        formData,
      );
      const currentProfile =
        profile ?? (await api.get<BarbershopProfile>("/api/v1/barbershops/me"));
      onProfileUpdated({ ...currentProfile, logo_url: result.logo_url });
      toast.success("Logo atualizada com sucesso.");
    } catch (error) {
      const message =
        typeof error === "object" && error && "message" in error
          ? String(error.message)
          : "Não foi possível enviar a logo.";
      toast.error(message);
    } finally {
      setIsUploading(false);
      input.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Meu Perfil</DialogTitle>
          <DialogDescription>
            Atualize as informações e a identidade visual da sua barbearia.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4">
          <Avatar size="lg">
            {profile?.logo_url && (
              <AvatarImage src={profile.logo_url} alt={`Logo ${profile.name}`} />
            )}
            <AvatarFallback>
              {profile?.name?.charAt(0).toUpperCase() ?? "B"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <Label
              htmlFor="barbershop-logo"
              className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
            >
              {isUploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Camera className="size-4" />
              )}
              {isUploading ? "Enviando..." : "Alterar logo"}
            </Label>
            <Input
              id="barbershop-logo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={isUploading}
              onChange={handleLogoUpload}
            />
            <p className="text-xs text-muted-foreground">JPG, PNG ou WEBP (máx. 5 MB)</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nome da barbearia</Label>
            <Input id="profile-name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-address">Endereço</Label>
            <Input id="profile-address" {...register("address")} />
            {errors.address && (
              <p className="text-sm text-destructive">
                {errors.address.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-phone">Telefone</Label>
            <Input id="profile-phone" type="tel" {...register("phone")} />
            {errors.phone && (
              <p className="text-sm text-destructive">
                {errors.phone.message}
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              Salvar alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
