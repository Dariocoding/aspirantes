"use client";

import { Button } from "@src/components/ui/button";

export function PrintButton() {
  return (
    <Button onClick={() => window.print()} className="bg-slate-900 hover:bg-slate-800">
      Imprimir
    </Button>
  );
}
