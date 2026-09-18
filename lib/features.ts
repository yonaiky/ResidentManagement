/**
 * Feature flags.
 *
 * Read with a NEXT_PUBLIC_ prefix so the UI and the API routes resolve the same
 * value and can never disagree about whether a feature is on.
 */

/**
 * WhatsApp (Evolution API) messaging. Disabled unless explicitly turned on, so
 * an unconfigured Evolution instance can't surface a broken feature to users.
 */
export const WHATSAPP_ENABLED =
  process.env.NEXT_PUBLIC_WHATSAPP_ENABLED === "true";
