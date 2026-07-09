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
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined in server environment variables.')
  }

  return crypto
    .createHmac('sha256', secret)
    .update(merchantId)
    .digest('hex')
    .substring(0, 32) // VULN-H Fix: 32 hex chars = 128 bits of entropy (increased from 24 for stronger security)
                      // ⚠️ Changing this value invalidates all existing merchant webhook URLs.
                      //    Merchants must regenerate their webhook URL from the Settings page.
}

