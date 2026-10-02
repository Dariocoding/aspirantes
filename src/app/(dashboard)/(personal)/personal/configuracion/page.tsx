import { ConfiguracionView } from "./_components/configuracion-view";
import { auth } from "@src/auth";
import { listPersonalConfigCards } from "@src/lib/apps/registry";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { unauthorized } from "next/navigation";

export default async function ConfiguracionPage() {
  const session = await auth();
  if (!session?.user) unauthorized();

  const cards = listPersonalConfigCards(authContextFromSession(session));

  return <ConfiguracionView cards={cards} />;
}
