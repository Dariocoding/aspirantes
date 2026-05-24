import Image from "next/image";
import { auth } from "@/auth";
import { FanbFlagStripe } from "@/components/institution/fanb-flag-stripe";
import { FANB_LOGIN_PHOTO_OVERLAY, INSTITUTION_LOGO_SRC } from "@/lib/branding";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

/** Imagen de fondo a pantalla completa (desde `public/`). */
const LOGIN_BACKGROUND_IMAGE = "/images/login-form.webp";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="relative flex min-h-screen w-full items-start justify-center overflow-hidden px-4 py-8 sm:py-10">
      <div className="fixed inset-x-0 top-0 z-30">
        <FanbFlagStripe />
      </div>

      <div className="absolute inset-0">
        <Image
          src={LOGIN_BACKGROUND_IMAGE}
          alt="Fondo de login"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className={cn("absolute inset-0", FANB_LOGIN_PHOTO_OVERLAY)} aria-hidden />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-4 pt-2 sm:max-w-lg sm:gap-6 sm:pt-3">
        <Image
          src={INSTITUTION_LOGO_SRC}
          alt="Fuerza Armada Nacional Bolivariana — Gestión de Personal"
          width={280}
          height={72}
          priority
          className="h-24 w-auto object-contain drop-shadow-[0_2px_14px_rgba(0,0,0,0.5)] sm:h-32 md:h-44"
        />
        <p className="text-center text-[10px] font-semibold uppercase leading-relaxed tracking-[0.2em] text-amber-200/90">
          Fuerza Armada Nacional Bolivariana
        </p>

        <LoginForm />
      </div>
    </div>
  );
}
