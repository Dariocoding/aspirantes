import type { NextConfig } from "next";

const legacyRedirects = [
  { source: "/aspirantes", destination: "/personal/aspirantes" },
  { source: "/aspirantes/:path*", destination: "/personal/aspirantes/:path*" },
  { source: "/efemerides", destination: "/personal/efemerides" },
  { source: "/efemerides/:path*", destination: "/personal/efemerides/:path*" },
  { source: "/esquelas", destination: "/personal/esquelas" },
  { source: "/esquelas/:path*", destination: "/personal/esquelas/:path*" },
  { source: "/convocatorias", destination: "/personal/convocatorias" },
  { source: "/convocatorias/:path*", destination: "/personal/convocatorias/:path*" },
  { source: "/manual", destination: "/personal/manual" },
  { source: "/manual/:path*", destination: "/personal/manual/:path*" },
  { source: "/usuarios", destination: "/sistema/usuarios" },
  { source: "/usuarios/:path*", destination: "/sistema/usuarios/:path*" },
  { source: "/auditoria", destination: "/sistema/auditoria" },
  { source: "/auditoria/:path*", destination: "/sistema/auditoria/:path*" },
] as const;

function serverActionAllowedOrigins(): string[] | undefined {
  const hosts = new Set<string>();
  for (const raw of [
    process.env.AUTH_URL,
    process.env.NEXTAUTH_URL,
    process.env.APP_URL,
    process.env.SERVER_ACTIONS_ALLOWED_ORIGINS,
  ]) {
    if (!raw?.trim()) continue;
    for (const part of raw.split(",")) {
      const value = part.trim();
      if (!value) continue;
      try {
        hosts.add(new URL(value).host);
      } catch {
        hosts.add(value.replace(/^https?:\/\//, "").replace(/\/.*$/, ""));
      }
    }
  }
  const origins = [...hosts].filter((host) => {
    const name = host.split(":")[0]?.toLowerCase() ?? "";
    return Boolean(name) && name !== "localhost" && name !== "127.0.0.1";
  });
  return origins.length ? origins : undefined;
}

const nextConfig: NextConfig = {
  // Imagen Docker mínima: solo archivos trazados (no todo node_modules).
  output: "standalone",
  serverExternalPackages: ["sharp", "@prisma/client"],
  // Solo el motor nativo y el schema; no el runtime JS (si se incluye, Turbopack traza el repo).
  outputFileTracingIncludes: {
    "/**": [
      "./src/generated/prisma/*.node",
      "./src/generated/prisma/schema.prisma",
      "./public/images/cefoa-logo.png",
      "./public/images/esquelas/**/*",
      "./public/fonts/**/*",
      "./assets/fonts/**/*",
    ],
  },
  outputFileTracingExcludes: {
    "/**": ["./prisma.config.ts", "./next.config.ts", "./next.config.mjs"],
  },
  transpilePackages: ["pdfjs-dist"],
  experimental: {
    // Fotos/PDF de cédula, título y notas. El middleware clona el body (tope 10mb
    // por defecto) y si se trunca, la Server Action responde HTML →
    // "An unexpected response was received from the server."
    serverActions: {
      bodySizeLimit: "100mb",
      allowedOrigins: serverActionAllowedOrigins(),
    },
    proxyClientMaxBodySize: "100mb",
  },

  async redirects() {
    return legacyRedirects.map(({ source, destination }) => ({
      source,
      destination,
      permanent: true,
    }));
  },
  async headers() {
    const security = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "X-DNS-Prefetch-Control", value: "on" },
    ];
    if (process.env.NODE_ENV === "production") {
      security.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }
    return [
      {
        source: "/(.*)",
        headers: security,
      },
    ];
  },
};

export default nextConfig;
