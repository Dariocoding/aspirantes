export type ConvocatoriaActionState = {
  ok: boolean;
  errors: Record<string, string>;
};

export const convocatoriaInitialActionState: ConvocatoriaActionState = {
  ok: false,
  errors: {},
};
