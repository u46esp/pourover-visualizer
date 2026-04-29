export type BrewMethodId = "pourover" | "aeropress" | "french-press" | "moka-pot";

export interface BrewMethodDefinition {
  id: BrewMethodId;
  label: string;
  summary: string;
  enabled: boolean;
}

export const BREW_METHODS: BrewMethodDefinition[] = [
  {
    id: "pourover",
    label: "Pourover",
    summary: "Gravity-fed percolation through a paper filter and coffee bed.",
    enabled: true,
  },
  {
    id: "aeropress",
    label: "Aeropress",
    summary: "Immersion plus plunger pressure through a small filter.",
    enabled: false,
  },
  {
    id: "french-press",
    label: "French Press",
    summary: "Full immersion extraction followed by mesh filtration.",
    enabled: false,
  },
  {
    id: "moka-pot",
    label: "Moka Pot",
    summary: "Pressure-driven percolation from a heated lower chamber.",
    enabled: false,
  },
];

export function getBrewMethod(id: BrewMethodId): BrewMethodDefinition {
  const method = BREW_METHODS.find((candidate) => candidate.id === id);

  if (!method) {
    throw new Error(`Unknown brew method: ${id}`);
  }

  return method;
}
