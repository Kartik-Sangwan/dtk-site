// lib/intermediateTrunnionMounts.ts

export type IntermediateTrunnionMount = {
  part: string;
  blockSize: string;
  pintleSize: string;
};

export const intermediateTrunnionMounts: IntermediateTrunnionMount[] = [
  {
    part: "DITM-15",
    blockSize: "1 1/4 x 2 1/2",
    pintleSize: "1 x 1",
  },
  {
    part: "DITM-20",
    blockSize: "1 1/2 x 3",
    pintleSize: "1 x 1",
  },
  {
    part: "DITM-25",
    blockSize: "1 1/2 x 3 1/2",
    pintleSize: "1 x 1",
  },
  {
    part: "DITM-325",
    blockSize: "2 x 4 1/4 x 4 1/2",
    pintleSize: "1 x 1",
  },
  {
    part: "DITM-40",
    blockSize: "2 x 5 x 5 1/4",
    pintleSize: "1 x 1",
  },
  {
    part: "DITM-50",
    blockSize: "2 x 6 x 6 1/4",
    pintleSize: "1 3/8 x 1 3/8",
  },
  {
    part: "DITM-60",
    blockSize: "2 x 7 5/8 x 7 5/8",
    pintleSize: "1 3/8 x 1 3/8",
  },
];
