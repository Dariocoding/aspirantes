import { requireAppAccess } from "@src/lib/apps/require-app";

export default async function SistemaAppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAppAccess("sistema");
  return children;
}
