export type InventarioStats = {
  totalItems: number;
  activos: number;
  stockBajo: number;
  sinStock: number;
  movimientosHoy: number;
  ultimoMovimiento: Date | null;
};

export type InventarioStockAlertItem = {
  id: string;
  nombre: string;
  unidad: string;
  stockActual: number;
  stockMinimo: number | null;
};
