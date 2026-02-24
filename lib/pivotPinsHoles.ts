// lib/pivotPinsHoles.ts

export type PivotPinHole = {
  part: string;
  CD: string;
  A: string;
  B: string;
  C: string;
  D: string;
};

export const pivotPinsHoles: PivotPinHole[] = [
  { part: "DP-05H", CD: ".500", A: "2.281", B: "1.938", C: ".172", D: ".106" },
  { part: "DP-07H", CD: ".750", A: "3.094", B: "2.719", C: ".188", D: ".140" },
  { part: "DP-10H", CD: "1.000", A: "3.594", B: "3.219", C: ".188", D: ".140" },
  { part: "DP-13H", CD: "1.375", A: "4.656", B: "4.250", C: ".203", D: ".173" },
  { part: "DP-17H", CD: "1.750", A: "5.656", B: "5.250", C: ".203", D: ".173" },
  { part: "DP-20H", CD: "2.000", A: "5.719", B: "5.281", C: ".219", D: ".204" },
  { part: "DP-25H", CD: "2.500", A: "6.781", B: "6.313", C: ".234", D: ".219" },
  { part: "DP-30H", CD: "3.000", A: "6.844", B: "6.344", C: ".250", D: ".250" },
  { part: "DP-35H", CD: "3.500", A: "8.969", B: "8.406", C: ".282", D: ".312" },
  { part: "DP-40H", CD: "4.000", A: "9.969", B: "9.409", C: ".282", D: ".312" },
];
