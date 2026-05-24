"use client";

import { useEffect, useRef, useState } from "react";

/** Abre celebración solo en la transición a `ok === true` (p. ej. tras guardar con useActionState). */
export function useCelebrateOnOkTransition(ok: boolean) {
  const [celebrateOpen, setCelebrateOpen] = useState(false);
  const prevOk = useRef(ok);

  useEffect(() => {
    if (ok && !prevOk.current) {
      setCelebrateOpen(true);
    }
    prevOk.current = ok;
  }, [ok]);

  return [celebrateOpen, setCelebrateOpen] as const;
}
