import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";

import ProductTableClient from "@/components/ProductTableClient";
import { alignmentCouplers } from "@/lib/alignmentCoupler";
import { clevisBrackets } from "@/lib/clevisBrackets";
import { eyeBrackets } from "@/lib/eyeBrackets";
import { findInventoryRowsByPartNos } from "@/lib/inventory";
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

import AlignmentCouplerFamily from "@/components/AlignmentCouplerFamily";
import ClevisBracketFamily from "@/components/ClevisBracketFamily";
import EyeBracketFamily from "@/components/EyeBracketFamily";
import IntermediateTrunnionMountFamily from "@/components/IntermediateTrunnionMountFamily";
import Mp1DetachableMountFamily from "@/components/Mp1DetachableMountFamily";
import Mp2DetachableMountFamily from "@/components/Mp2DetachableMountFamily";
import Mp4DetachableMountFamily from "@/components/Mp4DetachableMountFamily";
import PivotPinsGroovesFamily from "@/components/PivotPinsGroovesFamily";
import PivotPinsHolesFamily from "@/components/PivotPinsHolesFamily";
import RectangularFlangeFamily from "@/components/RectangularFlangeFamily";
import RodClevisFamily from "@/components/RodClevisFamily";
import RodEyeFamily from "@/components/RodEyeFamily";
import SphericalClevisBracketFamily from "@/components/SphericalClevisBracketFamily";
import SphericalRodEyeFamily from "@/components/SphericalRodEyeFamily";

const nfpaSubs = [
  { slug: "alignment-coupler", name: "Alignment Coupler" },
  { slug: "clevis-brackets", name: "Clevis Brackets" },
  { slug: "eye-brackets", name: "Eye Brackets" },
  { slug: "intermediate-trunnion-mounts", name: "Intermediate Trunnion Mounts" },
  { slug: "mp1-detachable-mount", name: "MP1 Detachable Mount" },
  { slug: "mp2-detachable-mount", name: "MP2 Detachable Mount" },
  { slug: "mp4-detachable-mount", name: "MP4 Detachable Mount" },
  { slug: "pivot-pins-grooves", name: "Pivot Pins - Grooves" },
  { slug: "pivot-pins-holes", name: "Pivot Pins - Holes" },
  { slug: "rectangular-flange", name: "Rectangular Flange" },
  { slug: "rod-clevis", name: "Rod Clevis" },
  { slug: "rod-eye", name: "Rod Eye" },
  { slug: "spherical-clevis-bracket", name: "Spherical Clevis Bracket" },
  { slug: "spherical-rod-eye", name: "Spherical Rod Eye" },
] as const;

type Part = { partNo: string; image?: string };

const samplePartsBySlug: Record<string, Part[]> = {
  // Only used for any subcategory that DOES NOT have a family component.
  // (You can keep this empty if everything is a family page.)
};

type FamilyProps = { subcategory: string; priceByPartNo?: Record<string, number> };

const familyComponents: Record<string, ComponentType<FamilyProps>> = {
  "alignment-coupler": AlignmentCouplerFamily,
  "clevis-brackets": ClevisBracketFamily,
  "eye-brackets": EyeBracketFamily,
  "intermediate-trunnion-mounts": IntermediateTrunnionMountFamily,
  "mp1-detachable-mount": Mp1DetachableMountFamily,
  "mp2-detachable-mount": Mp2DetachableMountFamily,
  "mp4-detachable-mount": Mp4DetachableMountFamily,
  "pivot-pins-grooves": PivotPinsGroovesFamily,
  "pivot-pins-holes": PivotPinsHolesFamily,
  "rectangular-flange": RectangularFlangeFamily,
  "rod-clevis": RodClevisFamily,
  "rod-eye": RodEyeFamily,
  "spherical-clevis-bracket": SphericalClevisBracketFamily,
  "spherical-rod-eye": SphericalRodEyeFamily,
};

export default async function NfpaSubcategoryPage({
  params,
}: {
  params: Promise<{ subcategory: string }>;
}) {
  const { subcategory } = await params;

  const sub = nfpaSubs.find((x) => x.slug === subcategory);
  if (!sub) notFound();

  const Family = familyComponents[subcategory];
  const parts = Family ? [] : (samplePartsBySlug[subcategory] ?? []);
  const familyPricesByPartNo: Record<string, number> = {};
  const partsPriceByPartNo: Record<string, number> = {};
  const familyPartNosBySubcategory: Record<string, string[]> = {
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

  const familyPartNos = familyPartNosBySubcategory[subcategory] ?? [];
  if (familyPartNos.length > 0) {
    const inventoryRows = await findInventoryRowsByPartNos(familyPartNos);
    for (const partNo of familyPartNos) {
      const row = inventoryRows[partNo];
      if (row) familyPricesByPartNo[partNo] = row.price;
    }
  }

  if (parts.length > 0) {
    const inventoryRows = await findInventoryRowsByPartNos(parts.map((p) => p.partNo));
    for (const part of parts) {
      const row = inventoryRows[part.partNo];
      if (row) partsPriceByPartNo[part.partNo] = row.price;
    }
  }

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex items-baseline justify-between gap-6">
          <div>
            <div className="text-sm text-gray-600">Products / NFPA Mounts</div>
            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              NFPA Mounts <span className="text-gray-400">→</span> {sub.name}
            </h1>
          </div>

          <Link
            href="/products/nfpa"
            className="text-sm font-semibold text-gray-900 hover:underline"
          >
            ← NFPA categories
          </Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
            <div className="px-2 pb-2 text-sm font-semibold text-gray-900">
              NFPA Subcategories
            </div>

            <nav className="mt-2 space-y-1">
              {nfpaSubs.map((s) => {
                const active = s.slug === subcategory;
                return (
                  <Link
                    key={s.slug}
                    href={`/products/nfpa/${s.slug}`}
                    className={[
                      "block rounded-lg px-3 py-2 text-sm",
                      active
                        ? "bg-slate-100 font-semibold text-gray-900"
                        : "text-gray-700 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {s.name}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Right panel */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            {Family ? (
              <Family subcategory={subcategory} priceByPartNo={familyPricesByPartNo} />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Parts</h2>
                  <div className="text-sm text-gray-600">{parts.length} part(s)</div>
                </div>

                <div className="mt-4">
                  <ProductTableClient
                    parts={parts}
                    subcategory={subcategory}
                    priceByPartNo={partsPriceByPartNo}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
