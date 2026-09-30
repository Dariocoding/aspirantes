import { CensusSelectionProvider } from "@dashboard/aspirantes/_components/census-selection";

export default function AspirantesLayout({ children }: { children: React.ReactNode }) {
  return <CensusSelectionProvider>{children}</CensusSelectionProvider>;
}
