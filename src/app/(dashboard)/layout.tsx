import { auth } from "@/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { isAdmin } from "@/lib/auth/roles";
import { ensureSeedData } from "@/lib/seed";
import { unauthorized } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await ensureSeedData();

  const session = await auth();
  if (!session?.user) unauthorized();

  const role = session.user.role;
  const sidebarAdmin = isAdmin(role);
  const sidebarUser = {
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
  };

  return (
    <div className="flex min-h-screen min-w-0 flex-col bg-slate-100 text-slate-900 md:flex-row md:items-start">
      <Sidebar isAdmin={sidebarAdmin} user={sidebarUser} />
      <main className="min-h-screen min-w-0 w-full flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
