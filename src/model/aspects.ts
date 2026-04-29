export type VisualAspectId = "flow" | "pressure" | "clogging" | "extraction" | "combined";

export interface VisualAspectDefinition {
  id: VisualAspectId;
  label: string;
  shortLabel: string;
  description: string;
}

export const VISUAL_ASPECTS: VisualAspectDefinition[] = [
  {
    id: "flow",
    label: "Water flow",
    shortLabel: "Flow",
    description:
      "Shows how pour input, water level, and bed resistance change movement through the brewer.",
  },
  {
    id: "pressure",
    label: "Water pressure",
    shortLabel: "Pressure",
    description:
      "Uses water height and resistance as a relative pressure signal, not calibrated absolute pressure.",
  },
  {
    id: "clogging",
    label: "Paper clogging",
    shortLabel: "Clogging",
    description:
      "Visualizes fines and paper resistance as a gradual flow restriction that builds over time.",
  },
  {
    id: "extraction",
    label: "Early & late extraction",
    shortLabel: "Extraction",
    description:
      "Contrasts early wetting/high-flow extraction with slower late extraction in saturated zones.",
  },
  {
    id: "combined",
    label: "Combined view",
    shortLabel: "Combined",
    description:
      "Balances all visual signals for a high-level read of the brewing system.",
  },
];

export function getVisualAspect(id: VisualAspectId): VisualAspectDefinition {
  const aspect = VISUAL_ASPECTS.find((candidate) => candidate.id === id);

  if (!aspect) {
    throw new Error(`Unknown visual aspect: ${id}`);
  }

  return aspect;
}
