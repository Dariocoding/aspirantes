import type { NextAuthConfig } from "next-auth";

/**
 * Configuración compatible con Edge (middleware): sin Prisma ni adaptador.
 * La instancia completa en `auth.ts` añade proveedor Credentials y PrismaAdapter.
 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      if (path.startsWith("/login") || path.startsWith("/api/auth")) {
        return true;
      }
      return !!auth?.user;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roleId = user.roleId;
        token.roleKey = user.roleKey;
        token.roleLabel = user.roleLabel;
        token.isSuper = user.isSuper;
        token.permissions = user.permissions;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.roleId = token.roleId as string;
        session.user.roleKey = token.roleKey as string;
        session.user.roleLabel = token.roleLabel as string;
        session.user.isSuper = Boolean(token.isSuper);
        session.user.permissions = (token.permissions as string[]) ?? [];
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
