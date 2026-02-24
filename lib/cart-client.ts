export const CART_SERVER_EVENT = "dtk_cart_server_updated";

export function notifyCartUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CART_SERVER_EVENT));
  }
}