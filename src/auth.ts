import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { headers } from "next/headers";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@src/lib/prisma";
import {
  clearLoginFailures,
  clientKeyFromHeaders,
  isLoginIpLocked,
  recordLoginFailure,
} from "@src/lib/auth/login-attempts";
import { loadAuthContextForUser } from "@src/lib/auth/rbac";
import { loginSchema } from "@src/lib/validators/auth";
import { authConfig } from "@src/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Tipos del cliente en `src/generated/prisma` vs. los que espera el adaptador.
  adapter: PrismaAdapter(prisma as Parameters<typeof PrismaAdapter>[0]),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Correo" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const h = await headers();
        const ip = clientKeyFromHeaders(h);

        if (isLoginIpLocked(ip)) {
          return null;
        }

        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          recordLoginFailure(ip);
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            active: true,
          },
        });

        if (!user?.passwordHash || !user.active) {
          recordLoginFailure(ip);
          return null;
        }

        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) {
          recordLoginFailure(ip);
          return null;
        }

        const authCtx = await loadAuthContextForUser(user.id);
        if (!authCtx) return null;

        clearLoginFailures(ip);
        return {
          id: user.id,
          email: user.email ?? "",
          name: user.name ?? "",
          roleId: authCtx.roleId,
          roleKey: authCtx.roleKey,
          roleLabel: authCtx.roleLabel,
          isSuper: authCtx.isSuper,
          permissions: authCtx.permissions,
        };
      },
    }),
  ],
});
