import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import AddToCartCard from "@/components/AddToCartCard";
import RecommendedProductsCarousel from "@/components/RecommendedProductsCarousel";
import { getDummyProductNfpa } from "@/lib/catalog";
import { alignmentCouplers } from "@/lib/alignmentCoupler";
import { clevisBrackets } from "@/lib/clevisBrackets";
import { eyeBrackets } from "@/lib/eyeBrackets";
import { findInventoryRowByPartNo, findInventoryRowsByPartNos } from "@/lib/inventory";
import { intermediateTrunnionMounts } from "@/lib/intermediateTrunnionMounts";
import { mp1DetachableMounts } from "@/lib/mp1DetachableMount";
import { mp2Parts } from "@/lib/mp2DetachableMount";
import { mp4DetachableMounts } from "@/lib/mp4DetachableMounts";
import { pivotPinsGrooves } from "@/lib/pivotPinsGrooves";
import { pivotPinsHoles } from "@/lib/pivotPinsHoles";
import { rectangularFlanges } from "@/lib/rectangularFlange";
import { rodClevis } from "@/lib/rodClevis";
import { rodEyes } from "@/lib/rodEye";
import { sphericalClevisBrackets } from "@/lib/sphericalClevisBracket";
import { sphericalRodEyes } from "@/lib/sphericalRodEye";

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

const partNosBySubcategory: Record<string, string[]> = {
  "alignment-coupler": alignmentCouplers.map((r) => r.part),
  "clevis-brackets": clevisBrackets.map((r) => r.part),
  "eye-brackets": eyeBrackets.map((r) => r.part),
  "intermediate-trunnion-mounts": intermediateTrunnionMounts.map((r) => r.part),
  "mp1-detachable-mount": mp1DetachableMounts.map((r) => r.part),
  "mp2-detachable-mount": mp2Parts.map((r) => r.part),
  "mp4-detachable-mount": mp4DetachableMounts.map((r) => r.part),
  "pivot-pins-grooves": pivotPinsGrooves.map((r) => r.part),
  "pivot-pins-holes": pivotPinsHoles.map((r) => r.part),
  "rectangular-flange": rectangularFlanges.map((r) => r.part),
  "rod-clevis": rodClevis.map((r) => r.part),
  "rod-eye": rodEyes.map((r) => r.part),
  "spherical-clevis-bracket": sphericalClevisBrackets.map((r) => r.part),
  "spherical-rod-eye": sphericalRodEyes.map((r) => r.part),
};

function pickRecommended(partNos: string[], current: string, count = 12) {
  if (!partNos.length) return [];
  const startIdx = Math.max(0, partNos.findIndex((p) => p === current));

  const ordered: string[] = [];
  for (let i = 1; i <= partNos.length; i++) {
    const idx = (startIdx + i) % partNos.length;
    const p = partNos[idx];
    if (p !== current) ordered.push(p);
    if (ordered.length >= count) break;
  }
  return ordered;
}

export default async function Page({
  params,
}: {
  params: Promise<{ subcategory: string; partNo: string }>;
}) {
  const { subcategory, partNo } = await params;
  const decodedPartNo = decodeURIComponent(partNo);
  const subParts = partNosBySubcategory[subcategory];
  if (!subParts) notFound();
  if (!subParts.includes(decodedPartNo)) notFound();

  const inventoryRow = await findInventoryRowByPartNo(decodedPartNo);
  const product = {
    ...getDummyProductNfpa(subcategory, decodedPartNo),
    price: inventoryRow?.price ?? 0,
    stock: inventoryRow?.qtyOnHand ?? 0,
    description:
      inventoryRow?.description ??
      "Price and stock are pulled from inventory.csv where available.",
  };

  const recommendedPartNos = pickRecommended(subParts, decodedPartNo, 12);
  const recRows = await findInventoryRowsByPartNos(recommendedPartNos);

  const recommendedItems = recommendedPartNos.map((p) => {
    const dummy = getDummyProductNfpa(subcategory, p);
    const inv = recRows[p];
    return {
      partNo: p,
      name: dummy.name || p,
      price: inv?.price ?? 0,
      image: dummy.images[0],
      href: `/products/nfpa/${subcategory}/${encodeURIComponent(p)}`,
    };
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl border border-slate-400 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 p-5 shadow-sm md:p-6">
          <div className="text-sm text-slate-100">
            <Link href="/products/nfpa" className="hover:underline">
              Products / NFPA Mounts
            </Link>{" "}
            <span className="text-slate-300">→</span>{" "}
            <Link href={`/products/nfpa/${subcategory}`} className="hover:underline">
              {titleFromSlug(subcategory)}
            </Link>{" "}
            <span className="text-slate-300">→</span> {product.partNo}
          </div>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white">{product.partNo}</h1>
              <p className="mt-1 text-sm text-slate-100">{product.description}</p>
            </div>

            <div className="inline-flex items-center rounded-full border border-slate-300 bg-slate-500/40 px-3 py-1 text-xs font-semibold text-white">
              {titleFromSlug(subcategory)}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm md:p-6">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
              <Image
                src={product.images[0]}
                alt={product.partNo}
                fill
                className="object-contain p-6"
                priority
              />
            </div>

            {product.images.length > 1 && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {product.images.map((src, i) => (
                  <div
                    key={`${src}-${i}`}
                    className="relative h-20 overflow-hidden rounded-lg border border-slate-200 bg-white"
                  >
                    <Image src={src} alt={`${product.partNo} ${i + 1}`} fill className="object-contain p-2" />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/products/nfpa/${subcategory}`}
                className="inline-flex rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-slate-50"
              >
                ← Back to list
              </Link>

              {product.specsUrl && (
                <a
                  href={product.specsUrl}
                  target="_blank"
                  className="inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Open spec sheet
                </a>
              )}
            </div>
          </div>

          <AddToCartCard product={product} />
        </div>

        <div className="mt-8">
          <RecommendedProductsCarousel items={recommendedItems} />
        </div>
      </section>
    </main>
  );
}
