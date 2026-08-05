import Image from "next/image";
import Link from "next/link";
import { FanbFlagStripe } from "@src/components/institution/fanb-flag-stripe";
import { FANB_LOGIN_PHOTO_OVERLAY, INSTITUTION_LOGO_SRC } from "@src/lib/branding";
import { routes } from "@src/lib/apps/routes";
import { cn } from "@src/lib/utils";
import { ActualizarDatosClient } from "./_components/actualizar-datos-client";

export const dynamic = "force-dynamic";

const BACKGROUND_IMAGE = "/images/login-form.webp";

export default function ActualizarDatosPage() {
  return (
    <div className="relative flex min-h-screen w-full items-start justify-center overflow-hidden px-4 py-8 sm:py-10">
      <div className="fixed inset-x-0 top-0 z-30">
        <FanbFlagStripe />
      </div>

      <div className="absolute inset-0">
        <Image
          src={BACKGROUND_IMAGE}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className={cn("absolute inset-0", FANB_LOGIN_PHOTO_OVERLAY)} aria-hidden />
      </div>

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-4 pt-2 sm:gap-6 sm:pt-3">
        <Image
          src={INSTITUTION_LOGO_SRC}
          alt="Fuerza Armada Nacional Bolivariana — Gestión de Personal"
          width={280}
          height={72}
          priority
          className="h-20 w-auto object-contain drop-shadow-[0_2px_14px_rgba(0,0,0,0.5)] sm:h-28"
        />
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight text-white drop-shadow-sm sm:text-2xl">
            Actualización de datos del aspirante
          </h1>
          <p className="mt-1 text-sm text-amber-100/90">
            Portal de autoconsulta · Convocatoria activa
          </p>
        </div>

        <ActualizarDatosClient />

        <p className="text-center text-xs text-slate-200/90">
          ¿Personal autorizado?{" "}
          <Link href="/login" className="font-medium text-amber-200 underline-offset-2 hover:underline">
            Ingresar al sistema
          </Link>
          {" · "}
          <Link
            href={routes.hub}
            className="font-medium text-amber-200 underline-offset-2 hover:underline"
          >
            Inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
