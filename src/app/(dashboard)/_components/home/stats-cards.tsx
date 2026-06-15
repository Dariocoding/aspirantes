import { Card, CardContent, CardHeader, CardTitle } from "@src/components/ui/card";

type StatsCardsProps = {
  total: number;
  masculinos: number;
  femeninos: number;
  edadPromedio: number;
};

export function StatsCards({ total, masculinos, femeninos, edadPromedio }: StatsCardsProps) {
  const cards = [
    { title: "Total de Personal", value: total },
    { title: "Hombres", value: masculinos },
    { title: "Mujeres", value: femeninos },
    { title: "Edad Promedio", value: edadPromedio.toFixed(1) },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((item) => (
        <Card key={item.title} className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">{item.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
