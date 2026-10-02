// Shared highway projection math used by every gameplay layer.
export type Geo = { cx: number; hw: number; topY: number; bottomY: number; laneW: number; span: number };
export const P_NEAR = 0.12; // lane width at the vanishing point as a fraction of the bottom width
export const laneFrac = (lane: number) => (lane + 0.5) / 4 - 0.5;
