// app/api/inventory/route.ts
import { NextResponse } from "next/server";
import { readInventory, type InventoryRow } from "@/lib/inventory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function contains(hay: string, needle: string) {
  return hay.toLowerCase().includes(needle.toLowerCase());
}

function isPrivilegedRequest(req: Request) {
  const configured = process.env.INVENTORY_CUST1_ACCESS_CODE?.trim() ?? "";
  if (!configured) return false;
  const provided = (req.headers.get("x-inventory-access-code") ?? "").trim();
  return provided.length > 0 && provided === configured;
}

function isPublicPart(item: string) {
  return item.startsWith("D");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const field = (url.searchParams.get("field") ?? "any").trim(); // any|item|customer|desc
  const privileged = isPrivilegedRequest(req);

  let rows: InventoryRow[] = [];
  try {
    rows = await readInventory();
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to read inventory.csv";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
  
  if (q.length === 0) {
    return NextResponse.json({ ok: true, privileged, count: 0, items: [] });
  }

  const visibleRows = privileged ? rows : rows.filter((r) => isPublicPart(r.item));

  const filtered = visibleRows.filter((r) => {
    if (field === "item") return contains(r.item, q);
    if (field === "customer") {
      if (!privileged) return false;
      return contains(r.customerPartNo, q);
    }
    if (field === "desc") return contains(r.description, q);

    return privileged
      ? contains(r.item, q) || contains(r.customerPartNo, q) || contains(r.description, q)
      : contains(r.item, q) || contains(r.description, q);
  });

  // Cap results so UI stays snappy (adjust if you want)
  const limited = filtered.slice(0, 500).map((r) => ({
    ...r,
    customerPartNo: privileged ? r.customerPartNo : "",
  }));

  return NextResponse.json({ ok: true, privileged, count: filtered.length, items: limited });
}
