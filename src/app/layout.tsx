import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@src/components/providers";
import "./globals.css";
import { cn } from "@src/lib/utils";

const urbanist = localFont({
  src: "./fonts/urbanist-latin-wght-normal.woff2",
  variable: "--font-urbanist",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "C.E.F.O.A. — Gestión de personal",
  description:
    "Sistema de gestión de personal del Curso de Especialización para la Formación de Oficiales de Armas.",
  icons: {
    icon: "/images/cefoa-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={cn(urbanist.className, urbanist.variable, "h-full antialiased")}
    >
      <body className="min-h-full bg-slate-100 text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
