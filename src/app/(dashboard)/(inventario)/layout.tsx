import { requireAppAccess } from "@src/lib/apps/require-app";

export default async function InventarioAppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAppAccess("inventario");
  return children;
}
