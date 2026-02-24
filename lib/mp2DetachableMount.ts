export type Mp2Row = {
  part: string;
  CD: string;
  FL: string;
  F: string;
  B: string;
  C: string;
  D: string;
  ER: string;
  G: string;
  tapped: string;
  ddDia: string;
};

export const mp2DetachableMounts: Mp2Row[] = [
  // From the spec sheet (base rows)
  { part: "DMP2-15", CD: ".502", FL: "1.13", F: ".38", B: ".76", C: ".50", D: "2.00", ER: ".62", G: "1.43", tapped: "1/4 - 28", ddDia: ".28" },
  { part: "DMP2-2",  CD: ".502", FL: "1.13", F: ".38", B: ".76", C: ".50", D: "2.50", ER: ".62", G: "1.84", tapped: "5/16 - 24", ddDia: ".34" },
  { part: "DMP2-25", CD: ".502", FL: "1.13", F: ".38", B: ".76", C: ".50", D: "3.00", ER: ".62", G: "2.19", tapped: "5/16 - 24", ddDia: ".34" },
  { part: "DMP2-32", CD: ".752", FL: "1.88", F: ".63", B: "1.26", C: ".62", D: "3.75", ER: ".87", G: "2.77", tapped: "3/8 - 24", ddDia: ".41" },
  { part: "DMP2-4",  CD: ".752", FL: "1.88", F: ".63", B: "1.26", C: ".62", D: "4.50", ER: ".87", G: "3.32", tapped: "3/8 - 24", ddDia: ".41" },
  { part: "DMP2-5",  CD: ".752", FL: "1.88", F: ".63", B: "1.26", C: ".62", D: "5.50", ER: ".87", G: "4.10", tapped: "1/2 - 20", ddDia: ".53" },
  { part: "DMP2-6",  CD: "1.002", FL: "2.25", F: ".75", B: "1.51", C: ".75", D: "6.50", ER: "1.12", G: "4.88", tapped: "1/2 - 20", ddDia: ".53" },
];

// Your site lists both H and T variants.
// The sheet note says: add "T" for tapped or "H" for thru-hole.
// We'll generate them automatically so the UI shows the exact part numbers you listed.
export const mp2Parts: Mp2Row[] = mp2DetachableMounts.flatMap((r) => {
  const base = r.part; // e.g. DMP2-15
  return [
    { ...r, part: `${base}H` }, // thru-hole
    { ...r, part: `${base}T` }, // tapped
  ];
});
