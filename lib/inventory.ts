// lib/inventory.ts
import fs from "node:fs/promises";
import path from "node:path";

export type InventoryRow = {
  item: string;
  description: string;
  qtyOnHand: number;
  price: number;
  customerPartNo: string;
};

type InventoryIndex = Map<string, InventoryRow>;

const CSV_PATH =
  process.env.INVENTORY_CSV_PATH ??
  path.join(process.cwd(), "data", "inventory.csv");

// Minimal CSV parser (handles quoted fields + commas inside quotes)
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"' && inQuotes && next === '"') {
      // escaped quote
      cell += '"';
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && (ch === "," || ch === "\n" || ch === "\r")) {
      if (ch === "\r" && next === "\n") {
        // consume CRLF
        i++;
      }
      row.push(cell.trim());
      cell = "";

      if (ch === "\n" || ch === "\r") {
        // avoid pushing empty last line
        if (row.some((v) => v.length > 0)) rows.push(row);
        row = [];
      }
      continue;
    }

    cell += ch;
  }

  // last cell
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.some((v) => v.length > 0)) rows.push(row);
  }

  return rows;
}

function toNumber(v: string): number {
  const n = Number(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function normalizeKey(s: string) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizePartNo(s: string) {
  return String(s ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function isBetterRow(next: InventoryRow, current: InventoryRow) {
  if (current.price === 0 && next.price !== 0) return true;
  if (current.price !== 0 && next.price === 0) return false;
  if (current.qtyOnHand <= 0 && next.qtyOnHand > 0) return true;
  if (current.qtyOnHand > 0 && next.qtyOnHand <= 0) return false;
  return false;
}

function setPreferred(map: InventoryIndex, key: string, row: InventoryRow) {
  const existing = map.get(key);
  if (!existing || isBetterRow(row, existing)) map.set(key, row);
}

function partNoAliases(partNo: string) {
  const p = String(partNo ?? "").trim().toUpperCase();
  if (!p) return [];

  const out: string[] = [];

  // Rectangular flange aliases used in inventory.csv
  const df = /^DF-(\d+)$/.exec(p);
  if (df) {
    const n = df[1];
    const map: Record<string, string[]> = {
      "20": ["DF-2"],
      "325": ["DF-32"],
      "40": ["DF-4"],
      "50": ["DF-5"],
      "60": ["DF-6"],
    };
    out.push(...(map[n] ?? []));
  }

  // Intermediate trunnion aliases used in inventory.csv
  const ditm = /^DITM-(15|20|25|325|40|50|60)$/.exec(p);
  if (ditm) {
    const n = ditm[1];
    const map: Record<string, string[]> = {
      "15": ["MT4-15", "MT4-15()"],
      "20": ["MT4-2"],
      "25": ["MT-25"],
      "325": ["MT4-3.25"],
      "40": ["MT-4"],
      "50": ["MT-5"],
      "60": ["MT-6", "MT6.5x6.5x1.5", "MT6.5x6.5x2"],
    };
    out.push(...(map[n] ?? []));
  }

  return [...new Set(out.filter((x) => x !== p))];
}

let cachedRows: InventoryRow[] | null = null;
let cachedAt = 0;
let cachedIndex: InventoryIndex | null = null;
const CACHE_TTL_MS = 30_000;

export async function readInventory(): Promise<InventoryRow[]> {
  const now = Date.now();
  if (cachedRows && now - cachedAt < CACHE_TTL_MS) return cachedRows;

  const csv = await fs.readFile(CSV_PATH, "utf8");
  const grid = parseCsv(csv);
  if (grid.length < 2) return [];

  const headers = grid[0].map(normalizeKey);

  const idx = {
    item: headers.indexOf("item"),
    description: headers.indexOf("description"),
    qty: headers.indexOf("quantity on hand"),
    price: headers.indexOf("price"),
    cust: headers.indexOf("customer part#"),
  };

  // fallback: some people use slightly different names
  if (idx.cust === -1) idx.cust = headers.indexOf("customer part #");
  if (idx.qty === -1) idx.qty = headers.indexOf("quantity");

  const rows = grid.slice(1).map((r) => {
    const item = r[idx.item] ?? "";
    const description = r[idx.description] ?? "";
    const qtyOnHand = Math.max(0, toNumber(r[idx.qty] ?? "0"));
    const price = toNumber(r[idx.price] ?? "0");
    const customerPartNo = r[idx.cust] ?? "";

    return {
      item: String(item).trim(),
      description: String(description).trim(),
      qtyOnHand,
      price,
      customerPartNo: String(customerPartNo).trim(),
    };
  });

  cachedRows = rows;
  cachedAt = now;
  cachedIndex = null;

  return rows;
}

async function readInventoryIndex(): Promise<InventoryIndex> {
  if (cachedIndex && cachedRows && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedIndex;
  }

  const rows = await readInventory();
  const map: InventoryIndex = new Map();

  for (const row of rows) {
    const itemKey = normalizePartNo(row.item);
    if (itemKey) setPreferred(map, itemKey, row);
  }

  for (const row of rows) {
    const customerKey = normalizePartNo(row.customerPartNo);
    if (customerKey) setPreferred(map, customerKey, row);
  }

  cachedIndex = map;
  return map;
}

function resolveByPartNo(index: InventoryIndex, partNo: string) {
  const candidates = [partNo, ...partNoAliases(partNo)];
  let best: InventoryRow | null = null;

  for (const candidate of candidates) {
    const key = normalizePartNo(candidate);
    if (!key) continue;
    const row = index.get(key);
    if (!row) continue;
    if (!best || isBetterRow(row, best)) best = row;
  }

  return best;
}

export async function findInventoryRowByPartNo(partNo: string): Promise<InventoryRow | null> {
  const index = await readInventoryIndex();
  return resolveByPartNo(index, partNo);
}

export async function findInventoryRowsByPartNos(partNos: string[]) {
  const index = await readInventoryIndex();
  const out: Record<string, InventoryRow | null> = {};

  for (const raw of partNos) {
    const partNo = String(raw ?? "").trim();
    out[partNo] = partNo ? resolveByPartNo(index, partNo) : null;
  }

  return out;
}
