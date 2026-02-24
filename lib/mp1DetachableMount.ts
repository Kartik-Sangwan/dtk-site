// lib/mp1DetachableMount.ts

export type Mp1Row = {
  part: string;
  CD: string;
  FL: string;
  F: string;
  B: string;
  C: string;
  D: string;
  ER: string;
  G: string;
  LR: string;
  TAPPED: string;
  DD_DIA: string;
};

// Specs extracted from your MP1 spec table.
// Note: In the sheet the rows are for base part sizes (DMP1-15, DMP1-2, etc).
// Your website part numbers are DMP1-15H / DMP1-15T, etc.
// Both H and T share the same dimensions; the difference is “thru hole” vs “tapped”.
// We encode that by duplicating rows and setting TAPPED accordingly.

const base = [
  {
    basePart: "DMP1-15",
    CD: ".502",
    FL: ".75",
    F: ".38",
    B: ".76",
    C: ".50",
    D: "2.00",
    ER: ".62",
    G: "1.43",
    LR: ".62",
    TAPPED: "1/4-28",
    DD_DIA: ".28",
  },
  {
    basePart: "DMP1-2",
    CD: ".502",
    FL: ".75",
    F: ".38",
    B: ".76",
    C: ".50",
    D: "2.50",
    ER: ".62",
    G: "1.84",
    LR: ".62",
    TAPPED: "5/16-24",
    DD_DIA: ".34",
  },
  {
    basePart: "DMP1-25",
    CD: ".502",
    FL: ".75",
    F: ".38",
    B: ".76",
    C: ".50",
    D: "3.00",
    ER: ".62",
    G: "2.19",
    LR: ".62",
    TAPPED: "5/16-24",
    DD_DIA: ".34",
  },
  {
    basePart: "DMP1-32",
    CD: ".752",
    FL: "1.25",
    F: ".63",
    B: "1.26",
    C: ".62",
    D: "3.75",
    ER: ".87",
    G: "2.77",
    LR: ".87",
    TAPPED: "3/8-24",
    DD_DIA: ".41",
  },
  {
    basePart: "DMP1-4",
    CD: ".752",
    FL: "1.25",
    F: ".63",
    B: "1.26",
    C: ".62",
    D: "4.50",
    ER: ".87",
    G: "3.32",
    LR: ".87",
    TAPPED: "3/8-24",
    DD_DIA: ".41",
  },
  {
    basePart: "DMP1-5",
    CD: ".752",
    FL: "1.25",
    F: ".63",
    B: "1.26",
    C: ".62",
    D: "5.50",
    ER: ".87",
    G: "4.10",
    LR: ".87",
    TAPPED: "1/2-20",
    DD_DIA: ".53",
  },
  {
    basePart: "DMP1-6",
    CD: "1.002",
    FL: "1.50",
    F: ".75",
    B: "1.51",
    C: ".75",
    D: "6.50",
    ER: "1.25",
    G: "4.88",
    LR: "1.13",
    TAPPED: "1/2-20",
    DD_DIA: ".53",
  },
] as const;

export const mp1DetachableMounts: Mp1Row[] = base.flatMap((r) => {
  // “H” = thru hole (so “TAPPED” is effectively N/A for ordering).
  // “T” = tapped (use the tapped thread size from table).
  const H: Mp1Row = {
    part: `${r.basePart}H`,
    CD: r.CD,
    FL: r.FL,
    F: r.F,
    B: r.B,
    C: r.C,
    D: r.D,
    ER: r.ER,
    G: r.G,
    LR: r.LR,
    TAPPED: "THRU (H)",
    DD_DIA: r.DD_DIA,
  };

  const T: Mp1Row = {
    part: `${r.basePart}T`,
    CD: r.CD,
    FL: r.FL,
    F: r.F,
    B: r.B,
    C: r.C,
    D: r.D,
    ER: r.ER,
    G: r.G,
    LR: r.LR,
    TAPPED: r.TAPPED,
    DD_DIA: r.DD_DIA,
  };

  return [H, T];
});
