import { auth } from "@src/auth";
import { Sidebar } from "@dashboard/_components/layout/sidebar";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { ensureSeedData } from "@src/lib/seed";
import { unauthorized } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await ensureSeedData();

  const session = await auth();
  if (!session?.user) unauthorized();

  const sidebarUser = {
    name: session.user.name,
    email: session.user.email,
    roleLabel: session.user.roleLabel,
    auth: authContextFromSession(session),
  };

  return (
    <div className="flex min-h-screen min-w-0 flex-col bg-slate-100 text-slate-900 md:flex-row md:items-start">
      <Sidebar user={sidebarUser} />
      <main className="min-h-screen min-w-0 w-full flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
