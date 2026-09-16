import Image from "next/image";
import { CefoaCrest } from "@src/components/institution/cefoa-crest";
import { FanbFlagStripe } from "@src/components/institution/fanb-flag-stripe";
import {
  FANB_LOGIN_PHOTO_OVERLAY,
  INSTITUTION_SHORT_NAME,
} from "@src/lib/branding";
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

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-4 pt-6 sm:gap-5 sm:pt-8">
        <CefoaCrest size="lg" priority />
        <div className="text-center">
          <p className="font-display text-lg font-semibold tracking-[0.28em] text-amber-100">
            {INSTITUTION_SHORT_NAME}
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-white drop-shadow-sm sm:text-2xl">
            Actualización de datos del aspirante
          </h1>
          <p className="mt-1 text-sm text-amber-100/90">
            Portal de autoconsulta · Convocatoria activa
          </p>
        </div>

        <ActualizarDatosClient />
      </div>
    </div>
  );
}
