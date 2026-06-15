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

const nextConfig: NextConfig = {
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
