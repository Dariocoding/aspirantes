import { auth } from "@/auth";
import { UsuariosView } from "@/components/usuarios/usuarios-view";
import { prisma } from "@/lib/prisma";
import { assignableUserRoles, isAdmin } from "@/lib/auth/roles";
import { redirect, unauthorized } from "next/navigation";

export default async function UsuariosPage() {
  const session = await auth();
  if (!session?.user) unauthorized();
  if (!isAdmin(session.user.role)) {
    redirect("/sin-permiso?motivo=administracion");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, role: true, active: true },
  });

  const assignableRoles = assignableUserRoles(session.user.role);

  return (
    <UsuariosView
      users={users}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
      assignableRoles={assignableRoles}
    />
  );
}
