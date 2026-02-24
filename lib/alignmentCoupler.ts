export type AlignmentCouplerSpec = {
  part: string;
  A: string;
  B: string;
  C: string;
  D: string;
  E: string;
  F: string;
  O: string;
  H: string;
  maxPullAtYield: number;
};

export const alignmentCouplers: AlignmentCouplerSpec[] = [
  { part: "DAC-250F",  A: "1/4-28",   B: "7/8",  C: "1 1/4",  D: "1/4",   E: "5/8",  F: ".245",  O: "3/16", H: "13/16", maxPullAtYield: 4000 },
  { part: "DAC-312F",  A: "5/16-24",  B: "7/8",  C: "1 1/4",  D: "1/4",   E: "5/8",  F: ".308",  O: "1/4",  H: "13/16", maxPullAtYield: 4000 },
  { part: "DAC-375C",  A: "3/8-16",   B: "7/8",  C: "1 1/4",  D: "1/4",   E: "5/8",  F: ".369",  O: "5/16", H: "13/16", maxPullAtYield: 5000 },
  { part: "DAC-375F",  A: "3/8-24",   B: "7/8",  C: "1 1/4",  D: "1/4",   E: "5/8",  F: ".370",  O: "5/16", H: "13/16", maxPullAtYield: 5000 },

  { part: "DAC-437F",  A: "7/16-20",  B: "1 1/4",C: "2",      D: "1/2",   E: "3/4",  F: "5/8",   O: "9/16", H: "1 1/8",  maxPullAtYield: 10000 },
  { part: "DAC-500C",  A: "1/2-13",   B: "1 1/4",C: "2",      D: "1/2",   E: "3/4",  F: "5/8",   O: "9/16", H: "1 1/8",  maxPullAtYield: 14000 },
  { part: "DAC-500F",  A: "1/2-20",   B: "1 1/4",C: "2",      D: "1/2",   E: "3/4",  F: "5/8",   O: "9/16", H: "1 1/8",  maxPullAtYield: 14000 },
  { part: "DAC-625F",  A: "5/8-16",   B: "1 1/4",C: "2",      D: "1/2",   E: "3/4",  F: "5/8",   O: "1/2",  H: "1 1/8",  maxPullAtYield: 14000 },

  { part: "DAC-750C",  A: "3/4-10",   B: "1 3/4",C: "2 5/16", D: "5/16",  E: "1 1/8",F: "31/32", O: "7/8",  H: "1 1/2",  maxPullAtYield: 34000 },
  { part: "DAC-750F",  A: "3/4-16",   B: "1 3/4",C: "2 5/16", D: "5/16",  E: "1 1/8",F: "31/32", O: "7/8",  H: "1 1/2",  maxPullAtYield: 34000 },
  { part: "DAC-875F",  A: "7/8-14",   B: "1 3/4",C: "2 5/16", D: "5/16",  E: "1 1/8",F: "31/32", O: "7/8",  H: "1 1/2",  maxPullAtYield: 34000 },

  { part: "DAC-1000C", A: "1-18",     B: "2 1/2",C: "2 15/16",D: "1/2",   E: "1 5/8",F: "1 3/8", O: "1 1/4",H: "2 1/4",  maxPullAtYield: 64000 },
  { part: "DAC-1000F", A: "1-14",     B: "2 1/2",C: "2 15/16",D: "1/2",   E: "1 5/8",F: "1 3/8", O: "1 1/4",H: "2 1/4",  maxPullAtYield: 64000 },
  { part: "DAC-1250F", A: "1 1/4-12", B: "2 1/2",C: "2 15/16",D: "1/2",   E: "1 5/8",F: "1 3/8", O: "1 1/4",H: "2 1/4",  maxPullAtYield: 64000 },
  { part: "DAC-1375F", A: "1 3/8-12", B: "2 1/2",C: "2 15/16",D: "1/2",   E: "1 5/8",F: "1 3/8", O: "1 1/4",H: "2 1/4",  maxPullAtYield: 64000 },

  { part: "DAC-1500F", A: "1 1/2-12", B: "3 1/4",C: "4 3/8",  D: "13/16", E: "2 1/4",F: "1 3/4", O: "1 1/2",H: "3",      maxPullAtYield: 120000 },
  { part: "DAC-1750F", A: "1 3/4-12", B: "3 1/4",C: "4 3/8",  D: "13/16", E: "2 1/4",F: "1 3/4", O: "1 1/2",H: "3",      maxPullAtYield: 120000 },
  { part: "DAC-1875F", A: "1 7/8-12", B: "3 1/4",C: "5 7/16", D: "1 1/16",E: "3",    F: "2 1/4", O: "1 7/8",H: "3 1/2",  maxPullAtYield: 240000 },
  { part: "DAC-2000F", A: "2-12",     B: "3 1/4",C: "5 7/16", D: "1 1/16",E: "3",    F: "2 1/4", O: "1 7/8",H: "3 1/2",  maxPullAtYield: 240000 },
];
