# Imágenes de semilla — inventario

JPEG 480×480 usados por `seedInventarioImagenes` (ver `prisma/seed-inventario-imagenes.ts`).

Origen inicial: [Lorem Picsum](https://picsum.photos/) con semilla estable por archivo (`inv-{slug}`). Son fotos de referencia para desarrollo y demos; sustituya por fotos reales del producto en producción si lo necesita.

Para regenerar los archivos:

```bash
# Windows (PowerShell), desde la raíz del repo
$dir = "prisma/seed-assets/inventario"
@("arroz-blanco","harina-trigo","pasta-corta","aceite-vegetal","azucar","sal","carne-res","pollo-entero","huevos","leche-entera","cebolla","tomate","papa","frijoles-negros","atun-lata","detergente","servilletas","cafe-molido") | ForEach-Object {
  curl.exe -fsSL -o "$dir/$_.jpg" "https://picsum.photos/seed/inv-$_/480/480.jpg"
}
```
