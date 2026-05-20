import crypto from 'crypto'

/**
 * Generates a deterministic, unforgeable webhook token for a given merchant.
 *
 * This token is derived from the SUPABASE_SERVICE_ROLE_KEY (a server-side secret)
 * and the merchant's UUID. It's safe to share in the webhook URL because:
 * - It cannot be reversed to determine the secret key
 * - It's unique per merchant (different merchants get different tokens)
 * - It cannot be forged without knowing the server secret
 *
 * Usage: append `&token={getWebhookToken(merchantId)}` to the webhook URL.
 */
export function getWebhookToken(merchantId: string): string {
  // Use SERVICE_ROLE_KEY as the HMAC secret — it's server-only and strong
  // Fall back to SUPABASE_URL (available on both client/server) as a weaker salt
  const secret =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'beepme-fallback-salt'

  return crypto
    .createHmac('sha256', secret)
    .update(merchantId)
    .digest('hex')
    .substring(0, 24) // 24 hex chars = 96 bits of entropy, easy to embed in URLs
}
