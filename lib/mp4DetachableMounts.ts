// /lib/mp4DetachableMounts.ts

export type Mp4DetachableMountRow = {
  part: string;   // e.g. DMP4-15H
  CD: string;
  FL: string;
  F: string;
  CB: string;
  D: string;
  ER: string;
  G: string;
  KK: string;     // thread size
  DD: string;     // D-D DIA.
};

const base = [
  // From your spec table (base part numbers)
  { part: "DMP4-15", CD: ".502", FL: "1.13", F: ".38", CB: ".75", D: "2.00", ER: ".62", G: "1.43", KK: "1/4 - 28", DD: ".28" },
  { part: "DMP4-2",  CD: ".502", FL: "1.13", F: ".38", CB: ".75", D: "2.50", ER: ".62", G: "1.84", KK: "5/16 - 24", DD: ".34" },
  { part: "DMP4-25", CD: ".502", FL: "1.13", F: ".38", CB: ".75", D: "3.00", ER: ".62", G: "2.19", KK: "5/16 - 24", DD: ".34" },
  { part: "DMP4-32", CD: ".752", FL: "1.88", F: ".63", CB: "1.25", D: "3.75", ER: ".87", G: "2.77", KK: "3/8 - 24",  DD: ".41" },
  { part: "DMP4-4",  CD: ".752", FL: "1.88", F: ".63", CB: "1.25", D: "4.50", ER: ".87", G: "3.32", KK: "3/8 - 24",  DD: ".41" },
] as const;

/**
 * Spec note: add "T" for tapped or "H" for thru hole at end of part no.
 * We expose both variants as separate rows (same dimensions).
 */
export const mp4DetachableMounts = base.flatMap((r) => {
  const mk = (suffix: "H" | "T") => ({ ...r, part: `${r.part}${suffix}` });
  return [mk("H"), mk("T")];
});
