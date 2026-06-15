import { requireAppAccess } from "@src/lib/apps/require-app";

export default async function PersonalAppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAppAccess("personal");
  return children;
}
