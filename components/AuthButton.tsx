"use client";

import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  const { data } = useSession();
  const user = data?.user;

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-slate-50"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/account"
        className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-slate-50"
      >
        {user.image ? (
          <Image
            src={user.image}
            alt="Profile"
            width={24}
            height={24}
            className="h-6 w-6 rounded-full"
          />
        ) : (
          <div className="h-6 w-6 rounded-full bg-slate-200" />
        )}
        Account
      </Link>

      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="text-sm font-semibold text-gray-700 hover:text-gray-900"
      >
        Sign out
      </button>
    </div>
  );
}
