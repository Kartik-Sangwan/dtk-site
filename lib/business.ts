export const BUSINESS_NAME = "DTK Industrial Components Inc.";
export const SUPPORT_EMAIL = "sales@dtkindustrial.com";
export const SUPPORT_PHONE_DISPLAY = "(905) 268-0393";
export const SUPPORT_PHONE_E164 = "+19052680393";

export const BUSINESS_ADDRESS = {
  line1: "7-20 Lightbeam Terrace",
  city: "Brampton",
  province: "Ontario",
  postalCode: "L6Y 6H9",
  country: "Canada",
} as const;

export const BASE_SHIPPING_RATE = 0.1;
export const TAX_RATE = 0.13;

export const BUSINESS_ADDRESS_SINGLE_LINE = `${BUSINESS_ADDRESS.line1}, ${BUSINESS_ADDRESS.city}, ${BUSINESS_ADDRESS.province}, ${BUSINESS_ADDRESS.postalCode}, ${BUSINESS_ADDRESS.country}`;
export const BUSINESS_FOOTER_NOTE = `${BUSINESS_NAME} | ${BUSINESS_ADDRESS_SINGLE_LINE} | ${SUPPORT_PHONE_DISPLAY} | ${SUPPORT_EMAIL}`;
