export type AspiranteActionState = {
  ok: boolean;
  errors: Record<string, string>;
};

export const aspiranteInitialActionState: AspiranteActionState = { ok: false, errors: {} };

export type EfemerideActionState = {
  ok: boolean;
  errors: Record<string, string>;
};

export const efemerideInitialActionState: EfemerideActionState = { ok: false, errors: {} };

export type UsuarioActionState = {
  ok: boolean;
  errors: Record<string, string>;
};

export const usuarioInitialActionState: UsuarioActionState = { ok: false, errors: {} };
