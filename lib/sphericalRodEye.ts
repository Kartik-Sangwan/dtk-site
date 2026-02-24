// src/lib/sphericalRodEye.ts (or /lib depending on your alias)
// Data extracted from the spec table you provided.

export type SphericalRodEyeRow = {
  part: string;
  cd: string; // "CD - .0005" column in the sheet
  A: string;
  CE: string;
  EX: string;
  ER: string;
  LE: string;
  KK: string;
  JL: string;
};

export const sphericalRodEyes: SphericalRodEyeRow[] = [
  { part: "DRES-05", cd: ".5000", A: "11/16", CE: "7/8",  EX: "7/16",  ER: "7/8",   LE: "3/4",  KK: "7/16-20", JL: "7/8" },
  { part: "DRES-07", cd: ".7500", A: "1",     CE: "1 1/4", EX: "21/32", ER: "1 1/4", LE: "1 1/16", KK: "3/4-16",  JL: "1 5/16" },
  { part: "DRES-10", cd: "1.0000", A: "1 1/2", CE: "1 7/8", EX: "7/8",  ER: "1 3/8", LE: "1 7/16", KK: "1-14",    JL: "1 1/2" },
  { part: "DRES-13", cd: "1.3750", A: "2",     CE: "2 1/8", EX: "13/16", ER: "1 13/16", LE: "1 7/8", KK: "1 1/4-12", JL: "2" },
  { part: "DRES-17", cd: "1.7500", A: "2 1/8", CE: "2 1/2", EX: "1 17/32", ER: "2 3/16", LE: "2 1/8", KK: "1 1/2-12", JL: "2 1/4" },
  { part: "DRES-20", cd: "2.0000", A: "2 7/8", CE: "2 3/4", EX: "1 3/4", ER: "2 5/8", LE: "2 1/2", KK: "1 7/8-12", JL: "2 3/4" },
];
