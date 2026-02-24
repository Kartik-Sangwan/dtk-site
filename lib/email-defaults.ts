import { BUSINESS_NAME, SUPPORT_EMAIL } from "@/lib/business";

export const SALES_EMAIL = SUPPORT_EMAIL;
export const DEFAULT_FROM = `${BUSINESS_NAME.replace(" Components Inc.", "")} <${SALES_EMAIL}>`;
