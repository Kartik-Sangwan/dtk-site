"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Trash2 } from "lucide-react";

export type AccountProfile = {
  name: string;
  email: string;
  image?: string | null;
  company?: string | null; // optional
  phone?: string | null;
  shippingAddress1?: string | null;
  shippingAddress2?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

export default function AccountProfileForm({
  initialProfile,
}: {
  initialProfile: AccountProfile;
}) {
  const router = useRouter();

  // ✅ Keep local state so inputs don't reset/re-mount
  const [form, setForm] = useState<AccountProfile>(initialProfile);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const toastTimer = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function showToast(type: "success" | "error", text: string) {
    setToast({ type, text });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2500);
  }

  // If initialProfile changes (rare), update state once.
  useEffect(() => {
    setForm(initialProfile);
    setPreviewUrl(initialProfile.image ?? null);
  }, [initialProfile]);

  function setField<K extends keyof AccountProfile>(key: K, value: AccountProfile[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onUploadAvatar(file: File) {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      showToast("error", "Only JPG, PNG, and WEBP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "Image is too large. Max size is 5MB.");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await fetch("/api/account/avatar", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json().catch(() => ({}))) as { imageUrl?: string; error?: string };
      if (!res.ok || !data.imageUrl) {
        throw new Error(data.error || "Upload failed");
      }

      setForm((prev) => ({ ...prev, image: data.imageUrl }));
      setPreviewUrl(data.imageUrl);
      showToast("success", "Profile image updated.");
      router.refresh();
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onRemoveAvatar() {
    setUploading(true);
    try {
      const res = await fetch("/api/account/avatar", { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not remove image");
      setForm((prev) => ({ ...prev, image: null }));
      setPreviewUrl(null);
      showToast("success", "Profile image removed.");
      router.refresh();
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Could not remove image");
    } finally {
      setUploading(false);
    }
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Save failed");
      }

      // Prefer JSON response containing the canonical saved profile
      const data = await res.json().catch(() => null);
      if (data?.profile) {
        setForm(data.profile as AccountProfile);
      }

      showToast("success", "Saved details successfully.");
      router.refresh();
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSave} className="mt-6 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage your contact and shipping details.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className={[
            "inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold",
            saving ? "bg-gray-200 text-gray-600" : "bg-gray-900 text-white hover:bg-gray-800",
          ].join(" ")}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          className={[
            "fixed right-5 top-20 z-[100] rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg",
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900",
          ].join(" ")}
        >
          {toast.text}
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative h-20 w-20 overflow-hidden rounded-full border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
          aria-label="Select profile image"
          disabled={uploading}
        >
          {previewUrl ? (
            <Image src={previewUrl} alt="Profile image" fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-500">
              Upload
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-[11px] font-semibold text-slate-700">
              ...
            </div>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onUploadAvatar(file);
            e.currentTarget.value = "";
          }}
          className="hidden"
        />
        <button
          type="button"
          onClick={onRemoveAvatar}
          disabled={uploading || !previewUrl}
          aria-label="Remove profile image"
          className={[
            "inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
            uploading || !previewUrl
              ? "border-slate-200 bg-slate-100 text-slate-400"
              : "border-slate-300 bg-white text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600",
          ].join(" ")}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {/* Name */}
        <input
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          aria-label="Name"
          className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
          placeholder="Name"
        />

        {/* Email (read-only) */}
        <input
          value={form.email}
          readOnly
          aria-label="Email"
          className="h-12 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-gray-600 placeholder:text-slate-400"
          placeholder="Email"
        />

        {/* Company (optional) */}
        <input
          value={form.company ?? ""}
          onChange={(e) => setField("company", e.target.value)}
          aria-label="Company"
          className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
          placeholder="Company (optional)"
        />

        {/* Phone */}
        <input
          value={form.phone ?? ""}
          onChange={(e) => setField("phone", e.target.value)}
          aria-label="Phone"
          className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
          placeholder="Phone (optional)"
        />
      </div>

      {/* Shipping address */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900">Shipping address</h3>

        <div className="mt-4 grid gap-4">
          <input
            value={form.shippingAddress1 ?? ""}
            onChange={(e) => setField("shippingAddress1", e.target.value)}
            aria-label="Address line 1"
            className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
            placeholder="Address line 1"
          />

          <input
            value={form.shippingAddress2 ?? ""}
            onChange={(e) => setField("shippingAddress2", e.target.value)}
            aria-label="Address line 2"
            className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
            placeholder="Address line 2 (optional)"
          />

          <div className="grid gap-4 md:grid-cols-3">
            <input
              value={form.city ?? ""}
              onChange={(e) => setField("city", e.target.value)}
              aria-label="City"
              className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
              placeholder="City"
            />
            <input
              value={form.province ?? ""}
              onChange={(e) => setField("province", e.target.value)}
              aria-label="Province/State"
              className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
              placeholder="Province/State"
            />
            <input
              value={form.postalCode ?? ""}
              onChange={(e) => setField("postalCode", e.target.value)}
              aria-label="Postal code"
              className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
              placeholder="Postal code"
            />
          </div>

          <div className="md:max-w-sm">
            <input
              value={form.country ?? ""}
              onChange={(e) => setField("country", e.target.value)}
              aria-label="Country"
              className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
              placeholder="Country"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
