export type CityDistrict = { readonly id: string; readonly name: string; readonly locked: boolean };

export const cityDistricts: readonly CityDistrict[] = [
  { id: "northwood", name: "Northwood", locked: true },
  { id: "the-heights", name: "The Heights", locked: true },
  { id: "ironwood", name: "Ironwood", locked: true },
  { id: "eastgate", name: "Eastgate", locked: true },
  { id: "westbank", name: "Westbank", locked: true },
  { id: "foundry", name: "Foundry", locked: false },
  { id: "old-town", name: "Old Town", locked: true },
  { id: "riverside", name: "Riverside", locked: true },
  { id: "the-common", name: "The Common", locked: true },
  { id: "greywater", name: "Greywater", locked: true },
  { id: "millbrook", name: "Millbrook", locked: true },
  { id: "eastmere", name: "Eastmere", locked: true },
  { id: "southpoint", name: "Southpoint", locked: true },
  { id: "lowlands", name: "Lowlands", locked: true },
  { id: "southgate", name: "Southgate", locked: true },
];
