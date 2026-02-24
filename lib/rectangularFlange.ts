export type RectangularFlangeRow = {
  part: string;
  UF: string;
  TF: string;
  FB: string;
  E: string;
  R: string;
  F: string;
  AA: string;
  TAPPED: string;
};

export const rectangularFlanges: RectangularFlangeRow[] = [
  { part: "DF-15", UF: "3 3/8", TF: "2 3/4",  FB: "5/16", E: "2",     R: "1.43", F: "3/8", AA: "2.02", TAPPED: "1/4-28" },
  { part: "DF-20", UF: "4 1/8", TF: "3 3/8",  FB: "3/8",  E: "2 1/2", R: "1.84", F: "3/8", AA: "2.60", TAPPED: "5/16-24" },
  { part: "DF-25", UF: "4 5/8", TF: "3 7/8",  FB: "3/8",  E: "3",     R: "2.19", F: "3/8", AA: "3.10", TAPPED: "5/16-24" },
  { part: "DF-325", UF: "5 1/2", TF: "4 11/16", FB: "7/16", E: "3 3/4", R: "2.76", F: "5/8", AA: "3.90", TAPPED: "3/8-24" },
  { part: "DF-40", UF: "6 1/4", TF: "5 7/16", FB: "7/16", E: "4 1/2", R: "3.32", F: "5/8", AA: "4.70", TAPPED: "3/8-24" },
  { part: "DF-50", UF: "7 5/8", TF: "6 5/8",  FB: "9/16", E: "5 1/2", R: "4.1",  F: "5/8", AA: "5.79", TAPPED: "1/2-20" },
  { part: "DF-60", UF: "8 5/8", TF: "7 5/8",  FB: "9/16", E: "6 1/2", R: "4.88", F: "3/4", AA: "6.90", TAPPED: "1/2-20" },
];
