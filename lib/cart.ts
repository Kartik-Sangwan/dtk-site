import { cookies } from "next/headers";

export const CART_COOKIE = "dtk_cart_id";

export async function getCartIdCookie(): Promise<string | null> {
  const c = await cookies();
  return c.get(CART_COOKIE)?.value ?? null;
}

export async function setCartIdCookie(cartId: string) {
  const c = await cookies();
  c.set(CART_COOKIE, cartId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearCartIdCookie() {
  const c = await cookies();
  c.set(CART_COOKIE, "", { path: "/", maxAge: 0 });
}
