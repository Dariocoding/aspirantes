import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import { Providers } from "@src/components/providers";
import "./globals.css";
import { cn } from "@src/lib/utils";

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema FANB - Gestión de Personal",
  description: "Censo de aspirantes, efemérides y esquelas institucionales.",
  icons: {
    icon: "/images/ejercito_logo.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn(urbanist.className, "h-full antialiased")}>
      <body className="min-h-full bg-slate-100 text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
