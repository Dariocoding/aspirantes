/**
 * Contexto de autorización del usuario (sesión JWT o consulta en servidor).
 */
export type AuthContext = {
  roleId: string;
  roleKey: string;
  roleLabel: string;
  isSuper: boolean;
  permissions: string[];
};

export function hasPermissionInContext(ctx: AuthContext, key: string): boolean {
  if (ctx.isSuper) return true;
  return ctx.permissions.includes(key);
}
