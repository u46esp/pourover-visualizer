export type GrinderProfileId =
  | "uniform-grinder"
  | "bad-grinder"
  | "uniform-with-fine-spike";

export interface GrinderProfileDefinition {
  id: GrinderProfileId;
  label: string;
  summary: string;
}

export const GRINDER_PROFILES: GrinderProfileDefinition[] = [
  {
    id: "uniform-grinder",
    label: "Zero Fines",
    summary: "Right-skewed main hill with fines excluded.",
  },
  {
    id: "bad-grinder",
    label: "Typical Grinder",
    summary: "Two hills: one fine and one coarse.",
  },
  {
    id: "uniform-with-fine-spike",
    label: "Uniform",
    summary: "Right-skewed main hill with extra fines at the fine end.",
  },
];
