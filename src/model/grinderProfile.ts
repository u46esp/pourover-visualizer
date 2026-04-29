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
    label: "Uniform grinder",
    summary: "Single normal hill from fine to coarse.",
  },
  {
    id: "bad-grinder",
    label: "Bad grinder",
    summary: "Two hills: one fine and one coarse.",
  },
  {
    id: "uniform-with-fine-spike",
    label: "Uniform + fine spike",
    summary: "Normal hill with extra fines at the fine end.",
  },
];
