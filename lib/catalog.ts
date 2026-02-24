// lib/catalog.ts
export type Product = {
  id: string;
  category: "nfpa" | "iso";
  subcategory: string;   // e.g. "alignment-coupler"
  partNo: string;        // e.g. "DAC-250F"
  name: string;
  price: number;         // dummy
  stock: number;         // dummy
  images: string[];      // public/ paths
  description?: string;
  specsUrl?: string;     // optional: link to spec image/pdf
};

const DEFAULT_IMAGES_BY_SUB: Record<string, string[]> = {
  "alignment-coupler": ["/products/alignment-coupler.png"],
  "clevis-brackets": ["/products/clevis-bracket.png"],
  "eye-brackets": ["/products/eye-bracket.png"],
  "intermediate-trunnion-mounts": ["/products/clevis-bracket.png"],
  "mp1-detachable-mount": ["/products/clevis-bracket.png"],
  "mp2-detachable-mount": ["/products/clevis-bracket.png"],
  "mp4-detachable-mount": ["/products/clevis-bracket.png"],
  "pivot-pins-grooves": ["/products/clevis-bracket.png"],
  "pivot-pins-holes": ["/products/clevis-bracket.png"],
  "rectangular-flange": ["/products/eye-bracket.png"],
  "rod-clevis": ["/products/clevis-bracket.png"],
  "rod-eye": ["/products/eye-bracket.png"],
  "spherical-clevis-bracket": ["/products/clevis-bracket.png"],
  "spherical-rod-eye": ["/products/eye-bracket.png"],
};

function stablePrice(partNo: string) {
  // deterministic dummy price based on string
  let h = 0;
  for (let i = 0; i < partNo.length; i++) h = (h * 31 + partNo.charCodeAt(i)) >>> 0;
  return Number((15 + (h % 8500) / 100).toFixed(2)); // $15.00 .. $100.00-ish
}

function stableStock(partNo: string) {
  let h = 0;
  for (let i = 0; i < partNo.length; i++) h = (h * 17 + partNo.charCodeAt(i)) >>> 0;
  return 0 + (h % 120); // 0..119
}

export function getDummyProductNfpa(subcategory: string, partNo: string): Product {
  const images = DEFAULT_IMAGES_BY_SUB[subcategory] ?? ["/products/alignment-coupler.png"];

  return {
    id: `nfpa:${subcategory}:${partNo}`,
    category: "nfpa",
    subcategory,
    partNo,
    name: partNo,
    price: stablePrice(partNo),
    stock: stableStock(partNo),
    images,
    description:
      "DTK Industrial Components — placeholder product details. Final pricing and live inventory will be enabled once the database and cart checkout are wired.",
    specsUrl: `/specs/${subcategory}-diagram.png`, // optional convention
  };
}
