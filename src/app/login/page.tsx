import Image from "next/image";
import { auth } from "@src/auth";
import { CefoaCrest } from "@src/components/institution/cefoa-crest";
import { FanbFlagStripe } from "@src/components/institution/fanb-flag-stripe";
import {
  FANB_LOGIN_PHOTO_OVERLAY,
  INSTITUTION_BRANCH,
  INSTITUTION_NAME,
  INSTITUTION_PRODUCT,
  INSTITUTION_SHORT_NAME,
} from "@src/lib/branding";
import { cn } from "@src/lib/utils";
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
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className={cn("absolute inset-0", FANB_LOGIN_PHOTO_OVERLAY)} aria-hidden />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-3 pt-6 sm:max-w-lg sm:gap-4 sm:pt-8">
        <CefoaCrest size="xl" priority />
        <div className="text-center">
          <p className="font-display text-2xl font-semibold tracking-[0.32em] text-amber-100 sm:text-3xl">
            {INSTITUTION_SHORT_NAME}
          </p>
          <p className="mt-2 max-w-sm text-[11px] font-medium uppercase leading-relaxed tracking-[0.14em] text-slate-300">
            {INSTITUTION_NAME}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-amber-200/70">
            {INSTITUTION_BRANCH} · {INSTITUTION_PRODUCT}
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
