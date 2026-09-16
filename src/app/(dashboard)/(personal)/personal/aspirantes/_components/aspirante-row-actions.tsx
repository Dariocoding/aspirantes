"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EllipsisVertical, FileDown, Pencil, Sparkles, Trash2, UserRound } from "lucide-react";
import { deleteAspirante } from "@src/app/actions/aspirantes";
import { aspiranteFichaTecnicaPdfUrl } from "@dashboard/aspirantes/_components/aspirante-ficha-tecnica-pdf-link";
import { Button } from "@src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@src/components/ui/dropdown-menu";
import { SuccessCelebrationDialog } from "@src/components/ui/success-celebration-dialog";
import { routes } from "@src/lib/apps/routes";

type Props = {
  aspiranteId: string;
  nombreCompleto: string;
  canWrite: boolean;
  onQuickEdit?: () => void;
};

export function AspiranteRowActions({ aspiranteId, nombreCompleto, canWrite, onQuickEdit }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [celebrateOpen, setCelebrateOpen] = useState(false);

  const perfilHref = routes.personal.aspirante(aspiranteId);
  const editarHref = `${routes.personal.aspirantesGestion}?edit=${encodeURIComponent(aspiranteId)}`;
  const pdfHref = aspiranteFichaTecnicaPdfUrl(aspiranteId);

  const onCelebrateOpenChange = useCallback((open: boolean) => {
    setCelebrateOpen(open);
  }, []);

  const onEliminar = useCallback(() => {
    const msg = `¿Eliminar del censo a «${nombreCompleto}»? Esta acción no se puede deshacer.`;
    if (!confirm(msg)) return;
    const fd = new FormData();
    fd.set("id", aspiranteId);
    startTransition(async () => {
      await deleteAspirante(fd);
      setCelebrateOpen(true);
      router.refresh();
    });
  }, [aspiranteId, nombreCompleto, router]);

  return (
    <>
      <SuccessCelebrationDialog
        open={celebrateOpen}
        onOpenChange={onCelebrateOpenChange}
        variant="deleted"
        title="Aspirante eliminado del censo"
        description="El registro se eliminó de forma permanente."
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={isPending}
          render={
            <Button
              variant="outline"
              size="icon-sm"
              className="border-slate-200 bg-white shadow-sm"
              aria-label={`Acciones de ${nombreCompleto}`}
            />
          }
        >
          <EllipsisVertical aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          <DropdownMenuGroup>
            {canWrite && onQuickEdit ? (
              <DropdownMenuItem onClick={onQuickEdit}>
                <Sparkles />
                Edición rápida
              </DropdownMenuItem>
            ) : null}
            {canWrite ? (
              <DropdownMenuItem
                nativeButton={false}
                render={<Link href={editarHref} prefetch={false} />}
              >
                <Pencil />
                Ficha completa
              </DropdownMenuItem>
            ) : null}
            {canWrite ? (
              <DropdownMenuItem variant="destructive" disabled={isPending} onClick={onEliminar}>
                <Trash2 />
                {isPending ? "Eliminando…" : "Eliminar"}
              </DropdownMenuItem>
            ) : null}
            {canWrite ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem
              nativeButton={false}
              render={<Link href={perfilHref} prefetch={false} />}
            >
              <UserRound />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem
              nativeButton={false}
              closeOnClick
              render={<a href={pdfHref} target="_blank" rel="noopener noreferrer" />}
            >
              <FileDown />
              Ficha técnica PDF
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
