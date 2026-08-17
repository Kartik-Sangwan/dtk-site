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

const NFPA_IMAGE_VERSION = "20260817l";

function nfpaImagePaths(slug: string, order: number[] = [1, 2, 3]) {
  return order.map(
    (index) =>
      `/images/subcategories/nfpa/${slug}-${index}.jpg?v=${NFPA_IMAGE_VERSION}`,
  );
}

const NFPA_IMAGES_BY_SUB: Record<string, string[]> = {
  "alignment-coupler": nfpaImagePaths("alignment-coupler"),
  "clevis-brackets": nfpaImagePaths("clevis-brackets"),
  "eye-brackets": nfpaImagePaths("eye-brackets"),
  "intermediate-trunnion-mounts": nfpaImagePaths("intermediate-trunnion-mounts"),
  "mp1-detachable-mount": nfpaImagePaths("mp1-detachable-mount"),
  "mp2-detachable-mount": nfpaImagePaths("mp2-detachable-mount"),
  "mp4-detachable-mount": nfpaImagePaths("mp4-detachable-mount"),
  "pivot-pins-grooves": nfpaImagePaths("pivot-pins-grooves"),
  "pivot-pins-holes": nfpaImagePaths("pivot-pins-holes"),
  "rectangular-flange": nfpaImagePaths("rectangular-flange"),
  "rod-clevis": nfpaImagePaths("rod-clevis"),
  "rod-eye": nfpaImagePaths("rod-eye"),
  "spherical-clevis-bracket": nfpaImagePaths("spherical-clevis-bracket"),
  "spherical-rod-eye": nfpaImagePaths("spherical-rod-eye"),
};

const NFPA_SPECS_BY_SUB: Record<string, string> = {
  "alignment-coupler": "/specs/alignment-coupler-diagram.png",
  "clevis-brackets": "/specs/clevis-bracket-diagram.png",
  "eye-brackets": "/specs/eye-bracket-diagram.png",
  "intermediate-trunnion-mounts": "/specs/intermediate-trunnion-mount-diagram.png",
  "mp1-detachable-mount": "/specs/mp1-detachable-mount-diagram.png",
  "mp2-detachable-mount": "/specs/mp2-detachable-mount-diagram.png",
  "mp4-detachable-mount": "/specs/mp4-detachable-mount-diagram.png",
  "pivot-pins-grooves": "/specs/pivot-pin-grooves-diagram.png",
  "pivot-pins-holes": "/specs/pivot-pin-holes-diagram.png",
  "rectangular-flange": "/specs/rectangular-flange-diagram.png",
  "rod-clevis": "/specs/rod-clevis-diagram.png",
  "rod-eye": "/specs/rod-eye-diagram.png",
  "spherical-clevis-bracket": "/specs/spherical-clevis-bracket-diagram.png",
  "spherical-rod-eye": "/specs/spherical-rod-eye-diagram.png",
};

export function getNfpaProductImages(subcategory: string) {
  return NFPA_IMAGES_BY_SUB[subcategory] ?? nfpaImagePaths("alignment-coupler");
}

export function getNfpaSpecsUrl(subcategory: string) {
  return NFPA_SPECS_BY_SUB[subcategory] ?? "/specs/alignment-coupler-diagram.png";
}

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
  const images = getNfpaProductImages(subcategory);

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
    specsUrl: getNfpaSpecsUrl(subcategory),
  };
}
